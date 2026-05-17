import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export function useDemerits() {
  const { 
    currentUser, 
    habitTemplates, 
    dailyEntries, 
    adHocEntries, 
    addAdHocEntry 
  } = useAppContext();

  useEffect(() => {
    if (!currentUser || currentUser.vacationMode) return;

    // We only check past days, not today.
    const today = new Date();
    today.setHours(0,0,0,0);

    const checkDemerits = async () => {
      const criticalHabits = habitTemplates.filter(h => h.userId === currentUser.id && h.isActive && h.isCritical && h.frequency !== 'weekly');
      
      for (const habit of criticalHabits) {
        // Find consecutive missed days looking backwards from yesterday
        let consecutiveMisses = 0;
        const d = new Date(today);
        d.setDate(d.getDate() - 1);

        // We only check up to 5 days back for the max penalty
        for (let i = 0; i < 5; i++) {
          const dateStr = d.toISOString().split('T')[0];
          const entry = dailyEntries.find(e => e.habitTemplateId === habit.id && e.date === dateStr);
          
          if (!entry || !entry.completed) {
            consecutiveMisses++;
            d.setDate(d.getDate() - 1);
          } else {
            break; // Streak broken
          }
        }

        // We need to avoid re-applying penalties for the same date.
        // Penalty is based on the LAST missed date (yesterday).
        const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
        const existingDemerit = adHocEntries.find(e => 
          e.userId === currentUser.id && 
          e.relatedHabitId === habit.id && 
          e.date === yesterdayStr && 
          e.category === 'Demerit'
        );

        if (existingDemerit) {
          continue; // Already penalized/warned for this day
        }

        if (consecutiveMisses >= 5) {
          // Miss 5 days -> -50 pts
          await addAdHocEntry({
            userId: currentUser.id,
            date: yesterdayStr,
            title: `Missed critical habit: ${habit.title} (5 days)`,
            category: 'Demerit',
            points: -50,
            convertToHabit: false,
            relatedHabitId: habit.id,
          });
          alert(`DEMERIT: You missed ${habit.title} for 5 days. You lost 50 points!`);
        } else if (consecutiveMisses >= 3) {
          // Miss 3 days -> -25 pts
          await addAdHocEntry({
            userId: currentUser.id,
            date: yesterdayStr,
            title: `Missed critical habit: ${habit.title} (3 days)`,
            category: 'Demerit',
            points: -25,
            convertToHabit: false,
            relatedHabitId: habit.id,
          });
          alert(`DEMERIT: You missed ${habit.title} for 3 days. You lost 25 points!`);
        } else if (consecutiveMisses === 2) {
          // Miss 2 days -> Warning (0 pts, just record so we don't warn again today)
          await addAdHocEntry({
            userId: currentUser.id,
            date: yesterdayStr,
            title: `WARNING: Missed ${habit.title} (2 days)`,
            category: 'Demerit',
            points: 0,
            convertToHabit: false,
            relatedHabitId: habit.id,
          });
          alert(`WARNING: You missed ${habit.title} for 2 days! Don't miss it again!`);
        }
      }

      // Check weekly habits
      const criticalWeeklyHabits = habitTemplates.filter(h => h.userId === currentUser.id && h.isActive && h.isCritical && h.frequency === 'weekly');
      
      const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
      };
      
      const getEndOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) + 6;
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
      };

      for (const habit of criticalWeeklyHabits) {
        const currentWeekStart = new Date(getStartOfWeek(today));
        
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekStartStr = getStartOfWeek(lastWeekStart);
        const lastWeekEndStr = getEndOfWeek(lastWeekStart);

        const twoWeeksAgoStart = new Date(lastWeekStart);
        twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7);
        const twoWeeksAgoStartStr = getStartOfWeek(twoWeeksAgoStart);
        const twoWeeksAgoEndStr = getEndOfWeek(twoWeeksAgoStart);

        const missedLastWeek = !dailyEntries.some(e => e.habitTemplateId === habit.id && e.completed && e.date >= lastWeekStartStr && e.date <= lastWeekEndStr);
        const missedTwoWeeksAgo = !dailyEntries.some(e => e.habitTemplateId === habit.id && e.completed && e.date >= twoWeeksAgoStartStr && e.date <= twoWeeksAgoEndStr);

        if (missedLastWeek && missedTwoWeeksAgo) {
          const existingDemerit = adHocEntries.find(e => 
            e.userId === currentUser.id && 
            e.relatedHabitId === habit.id && 
            e.date >= lastWeekStartStr && e.date <= lastWeekEndStr &&
            e.category === 'Demerit'
          );

          if (!existingDemerit) {
            await addAdHocEntry({
              userId: currentUser.id,
              date: lastWeekEndStr,
              title: `Missed critical weekly: ${habit.title} (2 weeks straight)`,
              category: 'Demerit',
              points: -25,
              convertToHabit: false,
              relatedHabitId: habit.id,
            });
            alert(`DEMERIT: You missed ${habit.title} for 2 weeks straight! You lost 25 points!`);
          }
        }
      }
    };

    checkDemerits();
  }, [currentUser, habitTemplates, dailyEntries, adHocEntries, addAdHocEntry]);
}
