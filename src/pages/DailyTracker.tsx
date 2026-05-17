import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Star, Check, Plus, AlertCircle, ChevronLeft, ChevronRight, Calendar, PartyPopper, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { calculateCurrentStreak, getNextStreakMilestone } from '../utils/progress';
import { useMascot } from '../context/useMascot';
import { getSmartMascotMessage } from '../utils/mascot';

interface AchievementMessage {
  title: string;
  detail: string;
}

const bonusSounds = ["VROOOOM!", "ROOOAAAAR!", "KA-CHOW!", "BEEP BEEP!"];

const getRandomBonusSound = () => bonusSounds[Math.floor(Math.random() * bonusSounds.length)];

function DailyTracker() {
  const { currentUser, habitTemplates, dailyEntries, toggleDailyHabit, addAdHocEntry } = useAppContext();
  const { triggerCheer } = useMascot();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [adHocTitle, setAdHocTitle] = useState('');
  const [adHocPoints, setAdHocPoints] = useState(5);
  const [makeHabit, setMakeHabit] = useState(false);
  const [dateOffset, setDateOffset] = useState(0); // 0 = today, -1 = yesterday
  const [achievement, setAchievement] = useState<AchievementMessage | null>(null);

  if (!currentUser) return <Navigate to="/" />;

  // Calculate the target date string YYYY-MM-DD
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + dateOffset);
  const selectedDateStr = targetDate.toLocaleDateString('sv-SE');
  
  const displayDate = dateOffset === 0 ? "Today" : "Yesterday";

  const activeHabits = habitTemplates.filter(t => t.userId === currentUser.id && t.isActive);
  const dailyHabits = activeHabits.filter(h => h.frequency !== 'weekly');
  const weeklyHabits = activeHabits.filter(h => h.frequency === 'weekly');
  
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

  const startOfWeekStr = getStartOfWeek(targetDate);
  const endOfWeekStr = getEndOfWeek(targetDate);

  // Calculate selected date's points
  const dayEntries = dailyEntries.filter(e => e.userId === currentUser.id && e.date === selectedDateStr && e.completed);
  const totalPoints = dayEntries.reduce((sum, e) => sum + e.pointsSnapshot, 0);
  const totalTaskCount = dailyHabits.length + weeklyHabits.length;

  const handleToggle = async (templateId: string) => {
    const existingEntry = dailyEntries.find(e => e.habitTemplateId === templateId && e.date === selectedDateStr);
    const wasCompleted = existingEntry?.completed || false;

    // Add subtle vibration if supported
    if (navigator.vibrate) navigator.vibrate(50);
    await toggleDailyHabit(templateId, selectedDateStr);

    if (!wasCompleted) {
      const completedAfter = dayEntries.length + 1;
      const remaining = Math.max(0, totalTaskCount - completedAfter);
      const projectedEntries = existingEntry
        ? dailyEntries.map(entry => entry.id === existingEntry.id ? { ...entry, completed: true, completedAt: Date.now() } : entry)
        : [
          ...dailyEntries,
          {
            id: 'preview',
            userId: currentUser.id,
            date: selectedDateStr,
            habitTemplateId: templateId,
            titleSnapshot: '',
            pointsSnapshot: 0,
            completed: true
          }
        ];
      const projectedStreak = calculateCurrentStreak(currentUser.id, projectedEntries);
      const nextMilestone = getNextStreakMilestone(projectedStreak);

      setAchievement({
        title: remaining === 0 ? `${displayDate} complete` : 'Nice work',
        detail: remaining === 0
          ? `You are on a ${projectedStreak}-day streak. Next goal: ${nextMilestone} days.`
          : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left to finish ${displayDate.toLowerCase()}.`
      });

      // -- SMART MASCOT CHER TRIGGER --
      const remainingIncompleteHabits = activeHabits.filter(h => {
        if (h.id === templateId) return false; // just completed
        if (h.frequency === 'weekly') {
          return !dailyEntries.some(e => 
            e.habitTemplateId === h.id && 
            e.completed && 
            e.date >= startOfWeekStr && 
            e.date <= endOfWeekStr
          );
        } else {
          const entry = dailyEntries.find(e => e.habitTemplateId === h.id && e.date === selectedDateStr);
          return !(entry?.completed || false);
        }
      });

      const mascotMsg = getSmartMascotMessage(
        remainingIncompleteHabits,
        totalTaskCount - remainingIncompleteHabits.length,
        projectedStreak
      );

      triggerCheer({
        title: mascotMsg.title,
        message: mascotMsg.message,
        type: mascotMsg.type,
        duration: 6000
      });
    }
  };

  const handleAdHocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocTitle.trim()) return;
    
    await addAdHocEntry({
      userId: currentUser.id,
      date: selectedDateStr,
      title: adHocTitle,
      points: Number(adHocPoints),
      category: 'Bonus',
      convertToHabit: makeHabit
    });
    
    // Trigger mascot cheer for doing something extra!
    const randomSound = getRandomBonusSound();
    triggerCheer({
      title: `${randomSound} BONUS POINTS!`,
      message: `Incredible! You filled up your tank with ${adHocPoints} bonus points for "${adHocTitle}"! Pure dino power!`,
      type: 'party',
      duration: 6000
    });
    
    // reset form
    setAdHocTitle('');
    setAdHocPoints(5);
    setMakeHabit(false);
    setShowQuickAdd(false);
  };

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: '100px' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: '50%', fontSize: '2rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentUser.avatar}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Hi, {currentUser.name}!</h2>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Let's crush {displayDate.toLowerCase()}'s goals.</p>
          </div>
        </div>
        
        <div className="glass-panel animate-pop" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none' }}>
          <Star fill="white" size={20} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{totalPoints}</span>
        </div>
      </header>

      {achievement && (
        <div className="achievement-banner animate-pop">
          <PartyPopper size={28} />
          <div>
            <strong>{achievement.title}</strong>
            <span>{achievement.detail}</span>
          </div>
          <button type="button" aria-label="Dismiss achievement" onClick={() => setAchievement(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Date Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'var(--panel-bg)', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <button 
          onClick={() => setDateOffset(-1)} 
          disabled={dateOffset === -1}
          style={{ opacity: dateOffset === -1 ? 0.3 : 1, padding: '0.5rem', background: 'none', border: 'none', cursor: dateOffset === -1 ? 'default' : 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
          <Calendar size={18} color="var(--primary)" />
          <span>{displayDate}</span>
        </div>

        <button 
          onClick={() => setDateOffset(0)} 
          disabled={dateOffset === 0}
          style={{ opacity: dateOffset === 0 ? 0.3 : 1, padding: '0.5rem', background: 'none', border: 'none', cursor: dateOffset === 0 ? 'default' : 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {activeHabits.length === 0 ? (
        <div className="glass-panel animate-pop" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
          <h3>No habits set yet!</h3>
          <p>Ask your parent to assign some daily habits in Parent Mode.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>{displayDate}'s Tasks</h3>
          {dailyHabits.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No daily tasks.</p>
          ) : dailyHabits.map(habit => {
            const entry = dailyEntries.find(e => e.habitTemplateId === habit.id && e.date === selectedDateStr);
            const isCompleted = entry?.completed || false;
            
            return (
              <div key={habit.id} className={`habit-row ${isCompleted ? 'completed' : ''}`} onClick={() => handleToggle(habit.id)}>
                <div className="habit-info">
                  <span className="habit-title">{habit.title}</span>
                  <div className="habit-meta">
                    <span className="points-badge"><Star size={12} fill="currentColor" /> {habit.points} pts</span>
                    <span>{habit.category}</span>
                  </div>
                </div>
                <div className="habit-checkbox">
                  <Check />
                </div>
              </div>
            );
          })}

          {weeklyHabits.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>This Week's Quests</h3>
              {weeklyHabits.map(habit => {
                const isCompleted = dailyEntries.some(e => 
                  e.habitTemplateId === habit.id && 
                  e.completed && 
                  e.date >= startOfWeekStr && 
                  e.date <= endOfWeekStr
                );
                
                return (
                  <div key={habit.id} className={`habit-row ${isCompleted ? 'completed' : ''}`} onClick={() => handleToggle(habit.id)} style={{ borderLeft: '4px solid var(--secondary)' }}>
                    <div className="habit-info">
                      <span className="habit-title">{habit.title}</span>
                      <div className="habit-meta">
                        <span className="points-badge" style={{ background: isCompleted ? 'var(--success)' : 'var(--secondary)', color: 'white' }}><Star size={12} fill="currentColor" /> {habit.points} pts</span>
                        <span>{habit.category} • Weekly</span>
                      </div>
                    </div>
                    <div className="habit-checkbox" style={{ borderColor: isCompleted ? 'var(--success)' : 'var(--secondary)', background: isCompleted ? 'var(--success)' : 'transparent' }}>
                      <Check />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Section */}
      <div style={{ marginTop: '2rem' }}>
        {!showQuickAdd ? (
          <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem' }} onClick={() => setShowQuickAdd(true)}>
            <Plus size={20} /> I did something extra good!
          </button>
        ) : (
          <div className="glass-panel animate-pop" style={{ border: '2px solid var(--secondary)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Awesome! What did you do?</h3>
            <form onSubmit={handleAdHocSubmit}>
              <div className="input-group">
                <input 
                  className="input-field" 
                  placeholder="e.g. Helped fold laundry"
                  value={adHocTitle}
                  onChange={e => setAdHocTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Points to claim</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={adHocPoints}
                    onChange={e => setAdHocPoints(Number(e.target.value))}
                    min="1" max="100"
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginLeft: '0.5rem' }}>
                <input type="checkbox" id="makeHabit" checked={makeHabit} onChange={e => setMakeHabit(e.target.checked)} style={{ transform: 'scale(1.5)', accentColor: 'var(--secondary)' }} />
                <label htmlFor="makeHabit" style={{ fontWeight: 600, color: 'var(--text-main)' }}>Make this a daily habit</label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--secondary)', color: 'var(--secondary)' }} onClick={() => setShowQuickAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-secondary" style={{ flex: 2 }}>Claim Points!</button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

export default DailyTracker;
