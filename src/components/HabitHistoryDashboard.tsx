import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, Minus, X } from 'lucide-react';
import type { AdHocEntry, DailyHabitEntry, HabitTemplate } from '../types';
import { buildRecentDateKeys } from '../utils/progress';

type RangeLength = 7 | 30 | 60 | 90;

interface HabitHistoryDashboardProps {
  userId: string;
  habits: HabitTemplate[];
  dailyEntries: DailyHabitEntry[];
  adHocEntries: AdHocEntry[];
  onToggleHabit?: (habitId: string, date: string) => Promise<void>;
}

const ranges: RangeLength[] = [7, 30, 60, 90];

function HabitHistoryDashboard({
  userId,
  habits,
  dailyEntries,
  adHocEntries,
  onToggleHabit
}: HabitHistoryDashboardProps) {
  const [range, setRange] = useState<RangeLength>(7);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const days = buildRecentDateKeys(range);
  const isEditable = Boolean(onToggleHabit) && range === 7;
  const dailyHabits = habits.filter((habit) => habit.frequency !== 'weekly');
  const weeklyHabits = habits.filter((habit) => habit.frequency === 'weekly');
  const completedDays = days.filter((date) =>
    dailyEntries.some((entry) => entry.userId === userId && entry.date === date && entry.completed)
  ).length;
  const completionRate = days.length === 0 ? 0 : Math.round((completedDays / days.length) * 100);

  const renderSection = (sectionHabits: HabitTemplate[], title: string) => {
    if (sectionHabits.length === 0) return null;

    return (
      <section className="history-section">
        <h4>{title}</h4>
        <div className="history-list">
          {sectionHabits.map((habit) => {
            const completedCount = days.filter((date) =>
              dailyEntries.some((entry) => entry.habitTemplateId === habit.id && entry.date === date && entry.completed)
            ).length;
            const habitRate = Math.round((completedCount / days.length) * 100);

            return (
              <div key={habit.id} className="history-row">
                <div className="history-row-header">
                  <strong>
                    {habit.title}
                    {habit.isCritical && <span className="critical-label"> Critical</span>}
                  </strong>
                  <span>{completedCount}/{days.length}</span>
                </div>
                <div
                  className={range === 7 ? 'history-days history-days-large' : 'history-days history-days-compact'}
                  style={range === 7 ? undefined : { '--history-days': days.length } as CSSProperties}
                >
                  {days.map((date) => (
                    <HistoryDay
                      key={date}
                      date={date}
                      habitId={habit.id}
                      range={range}
                      userId={userId}
                      dailyEntries={dailyEntries}
                      adHocEntries={adHocEntries}
                      isEditable={isEditable}
                      isSaving={savingCell === `${habit.id}:${date}`}
                      onToggle={async () => {
                        if (!onToggleHabit) return;
                        const cellKey = `${habit.id}:${date}`;
                        setSavingCell(cellKey);
                        try {
                          await onToggleHabit(habit.id, date);
                        } finally {
                          setSavingCell(null);
                        }
                      }}
                    />
                  ))}
                </div>
                {range !== 7 && (
                  <div className="history-row-footer">
                    <div className="history-mini-track">
                      <div style={{ width: `${habitRate}%` }} />
                    </div>
                    <span>{habitRate}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="history-dashboard">
      <div className="history-toolbar">
        <div>
          <strong>{range}-day view</strong>
          <span>
            {isEditable ? 'Tap a day to update it' : `${completionRate}% of days had a win`}
          </span>
        </div>
        <div className="segmented-control" aria-label="History range">
          {ranges.map((value) => (
            <button
              key={value}
              type="button"
              className={range === value ? 'active' : ''}
              onClick={() => setRange(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {habits.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No active habits to show.</p>
      ) : (
        <>
          {renderSection(dailyHabits, 'Daily Habits')}
          {renderSection(weeklyHabits, 'Weekly Quests')}
        </>
      )}
    </div>
  );
}

interface HistoryDayProps {
  date: string;
  habitId: string;
  range: RangeLength;
  userId: string;
  dailyEntries: DailyHabitEntry[];
  adHocEntries: AdHocEntry[];
  isEditable: boolean;
  isSaving: boolean;
  onToggle: () => Promise<void>;
}

function HistoryDay({
  date,
  habitId,
  range,
  userId,
  dailyEntries,
  adHocEntries,
  isEditable,
  isSaving,
  onToggle
}: HistoryDayProps) {
  const entry = dailyEntries.find((dailyEntry) => dailyEntry.habitTemplateId === habitId && dailyEntry.date === date);
  const isDone = entry?.completed;
  const hasDemerit = adHocEntries.some((adHocEntry) =>
    adHocEntry.userId === userId &&
    adHocEntry.relatedHabitId === habitId &&
    adHocEntry.date === date &&
    adHocEntry.category === 'Demerit'
  );
  const dateParts = date.split('-').map(Number);
  const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const dayLabel = localDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
  const status = isDone ? 'done' : hasDemerit ? 'demerit' : 'empty';

  if (range !== 7) {
    return <span className={`history-cell ${status}`} title={`${localDate.toLocaleDateString()} ${status}`} />;
  }

  const dayContent = (
    <>
      <div className={`history-dot ${status}`}>
        {isDone ? <Check size={12} /> : hasDemerit ? <X size={12} /> : <Minus size={12} />}
      </div>
      <span>{dayLabel}</span>
      <span>{localDate.getDate()}</span>
    </>
  );

  if (isEditable) {
    const action = isDone ? 'mark incomplete' : 'mark complete';
    return (
      <button
        type="button"
        className="history-day history-day-button"
        aria-label={`${localDate.toLocaleDateString()}: ${action}`}
        title={`Click to ${action}`}
        disabled={isSaving}
        onClick={() => void onToggle()}
      >
        {dayContent}
      </button>
    );
  }

  return (
    <div className="history-day">
      {dayContent}
    </div>
  );
}

export default HabitHistoryDashboard;
