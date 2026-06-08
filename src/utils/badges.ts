import type {
  AdHocEntry,
  DailyHabitEntry,
  EarnedBadge,
  HabitTemplate,
  RewardTemplate,
  User
} from '../types';

export type BadgeGroup =
  | 'Daily Streaks'
  | 'Perfect Days'
  | 'Multi-Habit'
  | 'Weekly Quests'
  | 'Comebacks'
  | 'Habit Mastery'
  | 'Points & Rewards'
  | 'Extra Effort';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  group: BadgeGroup;
  icon: string;
  colors: [string, string];
  generation?: 'core' | 'expansion';
  isEarned: (stats: BadgeStats) => boolean;
}

interface BadgeStats {
  completedEntries: DailyHabitEntry[];
  longestActiveDayStreak: number;
  perfectDayCount: number;
  longestPerfectDayStreak: number;
  longestTwoHabitStreak: number;
  longestThreeHabitStreak: number;
  distinctHabitCount: number;
  hasThreeCategoryDay: boolean;
  completedWeeklyHabitCount: number;
  hasCompleteWeeklyQuestWeek: boolean;
  longestCompleteWeeklyQuestStreak: number;
  hasEverythingWeek: boolean;
  hasFreshStart: boolean;
  hasBackOnTrack: boolean;
  hasComebackPerfectDay: boolean;
  streakRunCount: number;
  hasPersonalBest: boolean;
  hasPerfectWeekend: boolean;
  maxHabitCompletionCount: number;
  hasEarlyPerfectDay: boolean;
  hasNightFinish: boolean;
  lifetimePoints: number;
  currentPoints: number;
  canAffordReward: boolean;
  hasRedeemedReward: boolean;
  extraGoodDeedCount: number;
  perfectSundayCount: number;
}

const dayMs = 24 * 60 * 60 * 1000;

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) => date.toLocaleDateString('sv-SE');

const getMondayKey = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return toDateKey(date);
};

const getConsecutiveCount = (dateKeys: Iterable<string>) => {
  const timestamps = [...new Set(dateKeys)]
    .map((dateKey) => parseDateKey(dateKey).getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let current = 0;
  let previous: number | null = null;

  for (const timestamp of timestamps) {
    current = previous !== null && timestamp - previous === dayMs ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = timestamp;
  }

  return longest;
};

const getConsecutiveWeekCount = (weekKeys: Iterable<string>) => {
  const timestamps = [...new Set(weekKeys)]
    .map((dateKey) => parseDateKey(dateKey).getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let current = 0;
  let previous: number | null = null;

  for (const timestamp of timestamps) {
    current = previous !== null && timestamp - previous === dayMs * 7 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = timestamp;
  }

  return longest;
};

const getDateRuns = (dateKeys: Iterable<string>) => {
  const timestamps = [...new Set(dateKeys)]
    .map((dateKey) => parseDateKey(dateKey).getTime())
    .sort((a, b) => a - b);
  const runs: number[] = [];
  let current = 0;
  let previous: number | null = null;

  for (const timestamp of timestamps) {
    if (previous !== null && timestamp - previous === dayMs) {
      current += 1;
    } else {
      if (current > 0) runs.push(current);
      current = 1;
    }
    previous = timestamp;
  }
  if (current > 0) runs.push(current);
  return runs;
};

const hasCompletionAfterGap = (dateKeys: Iterable<string>, gapDays: number) => {
  const timestamps = [...new Set(dateKeys)]
    .map((dateKey) => parseDateKey(dateKey).getTime())
    .sort((a, b) => a - b);
  return timestamps.some((timestamp, index) =>
    index > 0 && timestamp - timestamps[index - 1] >= dayMs * (gapDays + 1)
  );
};

const buildBadgeStats = (
  userId: string,
  habits: HabitTemplate[],
  dailyEntries: DailyHabitEntry[],
  adHocEntries: AdHocEntry[],
  rewardTemplates: RewardTemplate[]
): BadgeStats => {
  const userHabits = habits.filter((habit) => habit.userId === userId);
  const activeDailyHabits = userHabits.filter((habit) => habit.isActive && habit.frequency !== 'weekly');
  const activeWeeklyHabits = userHabits.filter((habit) => habit.isActive && habit.frequency === 'weekly');
  const completedEntries = dailyEntries.filter((entry) => entry.userId === userId && entry.completed);
  const userAdHocEntries = adHocEntries.filter((entry) => entry.userId === userId);
  const completedByDate = new Map<string, Set<string>>();

  for (const entry of completedEntries) {
    const habitIds = completedByDate.get(entry.date) || new Set<string>();
    habitIds.add(entry.habitTemplateId);
    completedByDate.set(entry.date, habitIds);
  }

  const perfectDates = [...completedByDate.entries()]
    .filter(([, habitIds]) =>
      activeDailyHabits.length > 0 && activeDailyHabits.every((habit) => habitIds.has(habit.id))
    )
    .map(([date]) => date);
  const sortedPerfectDates = [...perfectDates].sort();
  const twoHabitDates = [...completedByDate.entries()]
    .filter(([, habitIds]) => habitIds.size >= 2)
    .map(([date]) => date);
  const threeHabitDates = [...completedByDate.entries()]
    .filter(([, habitIds]) => habitIds.size >= 3)
    .map(([date]) => date);
  const categoryByHabitId = new Map(userHabits.map((habit) => [habit.id, habit.category]));
  const hasThreeCategoryDay = [...completedByDate.values()].some((habitIds) => {
    const categories = new Set(
      [...habitIds].map((habitId) => categoryByHabitId.get(habitId)).filter(Boolean)
    );
    return categories.size >= 3;
  });

  const weekKeys = new Set(completedEntries.map((entry) => getMondayKey(entry.date)));
  const completeWeeklyQuestWeeks = [...weekKeys].filter((weekKey) =>
    activeWeeklyHabits.length > 0 && activeWeeklyHabits.every((habit) =>
      completedEntries.some((entry) =>
        entry.habitTemplateId === habit.id && getMondayKey(entry.date) === weekKey
      )
    )
  );
  const hasEverythingWeek = completeWeeklyQuestWeeks.some((weekKey) => {
    if (activeDailyHabits.length === 0) return false;
    const monday = parseDateKey(weekKey);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const completedHabitIds = completedByDate.get(toDateKey(date));
      return completedHabitIds && activeDailyHabits.every((habit) => completedHabitIds.has(habit.id));
    }).every(Boolean);
  });
  const completionRuns = getDateRuns(completedByDate.keys());
  const lastRun = completionRuns.at(-1) || 0;
  const earlierBest = completionRuns.length > 1 ? Math.max(...completionRuns.slice(0, -1)) : 0;
  const hasFreshStart = completionRuns.some((run, index) => index > 0 && run >= 3);
  const hasComebackPerfectDay = sortedPerfectDates.some((dateKey) => {
    const date = parseDateKey(dateKey);
    const threeDaysEarlier = new Date(date);
    threeDaysEarlier.setDate(threeDaysEarlier.getDate() - 3);
    const hadEarlierProgress = [...completedByDate.keys()].some((completedDate) =>
      parseDateKey(completedDate).getTime() < threeDaysEarlier.getTime()
    );
    return hadEarlierProgress && [1, 2, 3].every((daysBack) => {
      const prior = new Date(date);
      prior.setDate(prior.getDate() - daysBack);
      return !completedByDate.has(toDateKey(prior));
    });
  });
  const hasPerfectWeekend = sortedPerfectDates.some((dateKey) => {
    const saturday = parseDateKey(dateKey);
    if (saturday.getDay() !== 6) return false;
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    return perfectDates.includes(toDateKey(sunday));
  });
  const completionCountByHabit = new Map<string, number>();
  for (const entry of completedEntries) {
    completionCountByHabit.set(
      entry.habitTemplateId,
      (completionCountByHabit.get(entry.habitTemplateId) || 0) + 1
    );
  }
  const isCompletedBeforeHour = (entry: DailyHabitEntry, hour: number) => {
    if (!entry.completedAt) return false;
    const completedAt = new Date(entry.completedAt);
    return toDateKey(completedAt) === entry.date && completedAt.getHours() < hour;
  };
  const hasEarlyPerfectDay = sortedPerfectDates.some((dateKey) => {
    const entries = completedEntries.filter((entry) =>
      entry.date === dateKey && activeDailyHabits.some((habit) => habit.id === entry.habitTemplateId)
    );
    return entries.length >= activeDailyHabits.length && entries.every((entry) => isCompletedBeforeHour(entry, 12));
  });
  const hasNightFinish = completedEntries.some((entry) => {
    if (!entry.completedAt) return false;
    const completedAt = new Date(entry.completedAt);
    return toDateKey(completedAt) === entry.date && completedAt.getHours() >= 18;
  });
  const earnedAdHoc = userAdHocEntries.filter((entry) => entry.points > 0);
  const lifetimePoints =
    completedEntries.reduce((sum, entry) => sum + entry.pointsSnapshot, 0) +
    earnedAdHoc.reduce((sum, entry) => sum + entry.points, 0);
  const currentPoints = lifetimePoints +
    userAdHocEntries.filter((entry) => entry.points < 0).reduce((sum, entry) => sum + entry.points, 0);
  const availableRewards = rewardTemplates.filter((reward) =>
    reward.isActive && (reward.userId === userId || reward.userId === 'global')
  );
  const extraGoodDeedCount = userAdHocEntries.filter((entry) =>
    entry.points > 0 && entry.category === 'Bonus'
  ).length;

  return {
    completedEntries,
    longestActiveDayStreak: getConsecutiveCount(completedByDate.keys()),
    perfectDayCount: perfectDates.length,
    longestPerfectDayStreak: getConsecutiveCount(perfectDates),
    longestTwoHabitStreak: getConsecutiveCount(twoHabitDates),
    longestThreeHabitStreak: getConsecutiveCount(threeHabitDates),
    distinctHabitCount: new Set(completedEntries.map((entry) => entry.habitTemplateId)).size,
    hasThreeCategoryDay,
    completedWeeklyHabitCount: completedEntries.filter((entry) =>
      activeWeeklyHabits.some((habit) => habit.id === entry.habitTemplateId)
    ).length,
    hasCompleteWeeklyQuestWeek: completeWeeklyQuestWeeks.length > 0,
    longestCompleteWeeklyQuestStreak: getConsecutiveWeekCount(completeWeeklyQuestWeeks),
    hasEverythingWeek,
    hasFreshStart,
    hasBackOnTrack: hasCompletionAfterGap(completedByDate.keys(), 3),
    hasComebackPerfectDay,
    streakRunCount: completionRuns.length,
    hasPersonalBest: completionRuns.length > 1 && lastRun > earlierBest,
    hasPerfectWeekend,
    maxHabitCompletionCount: Math.max(0, ...completionCountByHabit.values()),
    hasEarlyPerfectDay,
    hasNightFinish,
    lifetimePoints,
    currentPoints,
    canAffordReward: availableRewards.some((reward) => currentPoints >= reward.cost),
    hasRedeemedReward: userAdHocEntries.some((entry) =>
      entry.category === 'Reward' && entry.title.startsWith('Redeemed:')
    ),
    extraGoodDeedCount,
    perfectSundayCount: perfectDates.filter((dateKey) => parseDateKey(dateKey).getDay() === 0).length
  };
};

export const badgeDefinitions: BadgeDefinition[] = [
  { id: 'first-step', name: 'First Step', description: 'Complete your first habit.', group: 'Daily Streaks', icon: '\u{1F463}', colors: ['#38bdf8', '#2563eb'], isEarned: (s) => s.completedEntries.length >= 1 },
  { id: 'spark-starter', name: 'Spark Starter', description: 'Keep a habit win going for 3 days.', group: 'Daily Streaks', icon: '\u{1F525}', colors: ['#fb923c', '#ea580c'], isEarned: (s) => s.longestActiveDayStreak >= 3 },
  { id: 'workweek-warrior', name: 'Workweek Warrior', description: 'Build a 5-day streak.', group: 'Daily Streaks', icon: '\u{1F4BC}', colors: ['#fbbf24', '#d97706'], isEarned: (s) => s.longestActiveDayStreak >= 5 },
  { id: 'seven-day-superstar', name: 'Seven-Day Superstar', description: 'Build a 7-day streak.', group: 'Daily Streaks', icon: '\u{2B50}', colors: ['#facc15', '#f97316'], isEarned: (s) => s.longestActiveDayStreak >= 7 },
  { id: 'fortnight-force', name: 'Fortnight Force', description: 'Build a 14-day streak.', group: 'Daily Streaks', icon: '\u{26A1}', colors: ['#60a5fa', '#4f46e5'], isEarned: (s) => s.longestActiveDayStreak >= 14 },
  { id: 'monthly-marvel', name: 'Monthly Marvel', description: 'Build a 30-day streak.', group: 'Daily Streaks', icon: '\u{1F451}', colors: ['#c084fc', '#7e22ce'], isEarned: (s) => s.longestActiveDayStreak >= 30 },
  { id: 'momentum-master', name: 'Momentum Master', description: 'Build a 60-day streak.', group: 'Daily Streaks', icon: '\u{1F680}', colors: ['#94a3b8', '#475569'], isEarned: (s) => s.longestActiveDayStreak >= 60 },
  { id: 'century-champion', name: 'Century Champion', description: 'Build a legendary 100-day streak.', group: 'Daily Streaks', icon: '\u{1F48E}', colors: ['#22d3ee', '#2563eb'], isEarned: (s) => s.longestActiveDayStreak >= 100 },

  { id: 'daily-hero', name: 'Daily Hero', description: 'Complete every daily habit in one day.', group: 'Perfect Days', icon: '\u{2600}\u{FE0F}', colors: ['#fde047', '#f59e0b'], isEarned: (s) => s.perfectDayCount >= 1 },
  { id: 'triple-triumph', name: 'Triple Triumph', description: 'Earn 3 perfect days.', group: 'Perfect Days', icon: '\u{1F31F}', colors: ['#fb7185', '#e11d48'], isEarned: (s) => s.perfectDayCount >= 3 },
  { id: 'high-five-finish', name: 'High-Five Finish', description: 'Earn 5 perfect days.', group: 'Perfect Days', icon: '\u{1F590}\u{FE0F}', colors: ['#34d399', '#059669'], isEarned: (s) => s.perfectDayCount >= 5 },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete every daily habit for 7 days in a row.', group: 'Perfect Days', icon: '\u{1F308}', colors: ['#a78bfa', '#ec4899'], isEarned: (s) => s.longestPerfectDayStreak >= 7 },
  { id: 'flawless-fortnight', name: 'Flawless Fortnight', description: 'Complete every daily habit for 14 days in a row.', group: 'Perfect Days', icon: '\u{1F6E1}\u{FE0F}', colors: ['#67e8f9', '#0284c7'], isEarned: (s) => s.longestPerfectDayStreak >= 14 },
  { id: 'all-star-month', name: 'All-Star Month', description: 'Complete every daily habit for 30 days in a row.', group: 'Perfect Days', icon: '\u{1F3C6}', colors: ['#fcd34d', '#b45309'], isEarned: (s) => s.longestPerfectDayStreak >= 30 },

  { id: 'dynamic-duo', name: 'Dynamic Duo', description: 'Complete 2 habits a day for 7 days in a row.', group: 'Multi-Habit', icon: '\u{1F517}', colors: ['#2dd4bf', '#0f766e'], isEarned: (s) => s.longestTwoHabitStreak >= 7 },
  { id: 'triple-threat', name: 'Triple Threat', description: 'Complete 3 habits a day for 7 days in a row.', group: 'Multi-Habit', icon: '\u{1F531}', colors: ['#f472b6', '#be185d'], isEarned: (s) => s.longestThreeHabitStreak >= 7 },
  { id: 'habit-collector', name: 'Habit Collector', description: 'Complete 5 different habits.', group: 'Multi-Habit', icon: '\u{1F3AF}', colors: ['#818cf8', '#4338ca'], isEarned: (s) => s.distinctHabitCount >= 5 },
  { id: 'balanced-builder', name: 'Balanced Builder', description: 'Complete habits from 3 categories in one day.', group: 'Multi-Habit', icon: '\u{1F9F1}', colors: ['#fb7185', '#7c3aed'], isEarned: (s) => s.hasThreeCategoryDay },
  { id: 'everything-everywhere', name: 'Everything Everywhere', description: 'Complete every daily and weekly habit in one week.', group: 'Multi-Habit', icon: '\u{1F30C}', colors: ['#6366f1', '#111827'], isEarned: (s) => s.hasEverythingWeek },

  { id: 'quest-begin', name: 'Quest Begin', description: 'Complete your first weekly habit.', group: 'Weekly Quests', icon: '\u{1F5FA}\u{FE0F}', colors: ['#4ade80', '#15803d'], isEarned: (s) => s.completedWeeklyHabitCount >= 1 },
  { id: 'weekly-winner', name: 'Weekly Winner', description: 'Complete every weekly habit in one week.', group: 'Weekly Quests', icon: '\u{1F3C5}', colors: ['#fbbf24', '#ca8a04'], isEarned: (s) => s.hasCompleteWeeklyQuestWeek },
  { id: 'two-week-trek', name: 'Two-Week Trek', description: 'Complete weekly goals 2 weeks in a row.', group: 'Weekly Quests', icon: '\u{1F97E}', colors: ['#a3e635', '#4d7c0f'], isEarned: (s) => s.longestCompleteWeeklyQuestStreak >= 2 },
  { id: 'three-week-titan', name: 'Three-Week Titan', description: 'Complete weekly goals 3 weeks in a row.', group: 'Weekly Quests', icon: '\u{1F4AA}', colors: ['#fb923c', '#9a3412'], isEarned: (s) => s.longestCompleteWeeklyQuestStreak >= 3 },
  { id: 'month-of-mondays', name: 'Month of Mondays', description: 'Complete weekly goals 4 weeks in a row.', group: 'Weekly Quests', icon: '\u{1F5D3}\u{FE0F}', colors: ['#cbd5e1', '#64748b'], isEarned: (s) => s.longestCompleteWeeklyQuestStreak >= 4 },
  { id: 'quest-legend', name: 'Quest Legend', description: 'Complete weekly goals 12 weeks in a row.', group: 'Weekly Quests', icon: '\u{1F9ED}', colors: ['#f59e0b', '#7c2d12'], isEarned: (s) => s.longestCompleteWeeklyQuestStreak >= 12 },
  { id: 'fresh-start', name: 'Fresh Start', description: 'Start a new 3-day streak after a break.', group: 'Comebacks', icon: '\u{1F305}', colors: ['#fbbf24', '#fb7185'], generation: 'expansion', isEarned: (s) => s.hasFreshStart },
  { id: 'back-on-track', name: 'Back on Track', description: 'Complete a habit after missing 3 days.', group: 'Comebacks', icon: '\u{21A9}\u{FE0F}', colors: ['#38bdf8', '#0369a1'], generation: 'expansion', isEarned: (s) => s.hasBackOnTrack },
  { id: 'comeback-kid', name: 'Comeback Kid', description: 'Earn a perfect day after 3 missed days.', group: 'Comebacks', icon: '\u{1F31F}', colors: ['#f472b6', '#7c3aed'], generation: 'expansion', isEarned: (s) => s.hasComebackPerfectDay },
  { id: 'never-give-up', name: 'Never Give Up', description: 'Restart your streak 3 times.', group: 'Comebacks', icon: '\u{1F525}', colors: ['#fb923c', '#be123c'], generation: 'expansion', isEarned: (s) => s.streakRunCount >= 4 },
  { id: 'personal-best', name: 'Personal Best', description: 'Beat your previous longest streak.', group: 'Comebacks', icon: '\u{1F4C8}', colors: ['#4ade80', '#15803d'], generation: 'expansion', isEarned: (s) => s.hasPersonalBest },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: 'Complete all daily habits on Saturday and Sunday.', group: 'Comebacks', icon: '\u{1F6E1}\u{FE0F}', colors: ['#60a5fa', '#4338ca'], generation: 'expansion', isEarned: (s) => s.hasPerfectWeekend },

  { id: 'ten-timer', name: 'Ten-Timer', description: 'Complete one habit 10 times.', group: 'Habit Mastery', icon: '\u{1F51F}', colors: ['#d97706', '#92400e'], generation: 'expansion', isEarned: (s) => s.maxHabitCompletionCount >= 10 },
  { id: 'habit-hero', name: 'Habit Hero', description: 'Complete one habit 25 times.', group: 'Habit Mastery', icon: '\u{2705}', colors: ['#94a3b8', '#475569'], generation: 'expansion', isEarned: (s) => s.maxHabitCompletionCount >= 25 },
  { id: 'routine-royalty', name: 'Routine Royalty', description: 'Complete one habit 50 times.', group: 'Habit Mastery', icon: '\u{1F451}', colors: ['#facc15', '#ca8a04'], generation: 'expansion', isEarned: (s) => s.maxHabitCompletionCount >= 50 },
  { id: 'century-routine', name: 'Century Routine', description: 'Complete one habit 100 times.', group: 'Habit Mastery', icon: '\u{1F4AF}', colors: ['#22d3ee', '#4f46e5'], generation: 'expansion', isEarned: (s) => s.maxHabitCompletionCount >= 100 },
  { id: 'early-explorer', name: 'Early Explorer', description: 'Complete all daily habits before noon.', group: 'Habit Mastery', icon: '\u{1F9ED}', colors: ['#fde047', '#f97316'], generation: 'expansion', isEarned: (s) => s.hasEarlyPerfectDay },
  { id: 'night-finisher', name: 'Night Finisher', description: 'Complete a habit after 6 PM.', group: 'Habit Mastery', icon: '\u{1F319}', colors: ['#818cf8', '#312e81'], generation: 'expansion', isEarned: (s) => s.hasNightFinish },

  { id: 'point-pioneer', name: 'Point Pioneer', description: 'Earn 100 lifetime points.', group: 'Points & Rewards', icon: '\u{1FA99}', colors: ['#d97706', '#78350f'], generation: 'expansion', isEarned: (s) => s.lifetimePoints >= 100 },
  { id: 'star-saver', name: 'Star Saver', description: 'Earn 500 lifetime points.', group: 'Points & Rewards', icon: '\u{2B50}', colors: ['#cbd5e1', '#64748b'], generation: 'expansion', isEarned: (s) => s.lifetimePoints >= 500 },
  { id: 'goal-getter', name: 'Goal Getter', description: 'Earn 1,000 lifetime points.', group: 'Points & Rewards', icon: '\u{1F3AF}', colors: ['#facc15', '#d97706'], generation: 'expansion', isEarned: (s) => s.lifetimePoints >= 1000 },
  { id: 'treasure-builder', name: 'Treasure Builder', description: 'Earn 2,500 lifetime points.', group: 'Points & Rewards', icon: '\u{1F4B0}', colors: ['#34d399', '#047857'], generation: 'expansion', isEarned: (s) => s.lifetimePoints >= 2500 },
  { id: 'reward-ready', name: 'Reward Ready', description: 'Save enough points for a reward.', group: 'Points & Rewards', icon: '\u{1F381}', colors: ['#fb7185', '#be185d'], generation: 'expansion', isEarned: (s) => s.canAffordReward },
  { id: 'dream-redeemer', name: 'Dream Redeemer', description: 'Redeem your first reward.', group: 'Points & Rewards', icon: '\u{1F4E6}', colors: ['#a78bfa', '#6d28d9'], generation: 'expansion', isEarned: (s) => s.hasRedeemedReward },

  { id: 'bonus-spark', name: 'Bonus Spark', description: 'Complete your first extra-good deed.', group: 'Extra Effort', icon: '\u{1F496}', colors: ['#f9a8d4', '#db2777'], generation: 'expansion', isEarned: (s) => s.extraGoodDeedCount >= 1 },
  { id: 'helping-hand', name: 'Helping Hand', description: 'Complete 5 extra-good deeds.', group: 'Extra Effort', icon: '\u{1F91D}', colors: ['#fbbf24', '#b45309'], generation: 'expansion', isEarned: (s) => s.extraGoodDeedCount >= 5 },
  { id: 'above-and-beyond', name: 'Above and Beyond', description: 'Complete 10 extra-good deeds.', group: 'Extra Effort', icon: '\u{1F680}', colors: ['#38bdf8', '#7c3aed'], generation: 'expansion', isEarned: (s) => s.extraGoodDeedCount >= 10 },
  { id: 'family-champion', name: 'Family Champion', description: 'Complete 25 extra-good deeds.', group: 'Extra Effort', icon: '\u{1F3E0}', colors: ['#4ade80', '#0f766e'], generation: 'expansion', isEarned: (s) => s.extraGoodDeedCount >= 25 },
  { id: 'three-peat', name: 'Three-Peat', description: 'Earn 3 perfect days in a row.', group: 'Extra Effort', icon: '\u{1F3C6}', colors: ['#fbbf24', '#e11d48'], generation: 'expansion', isEarned: (s) => s.longestPerfectDayStreak >= 3 },
  { id: 'sunday-shine', name: 'Sunday Shine', description: 'Complete every daily habit on Sunday.', group: 'Extra Effort', icon: '\u{2600}\u{FE0F}', colors: ['#fde047', '#ea580c'], generation: 'expansion', isEarned: (s) => s.perfectSundayCount >= 1 },
  { id: 'quest-collector', name: 'Quest Collector', description: 'Complete 10 weekly quests.', group: 'Extra Effort', icon: '\u{1F392}', colors: ['#2dd4bf', '#1d4ed8'], generation: 'expansion', isEarned: (s) => s.completedWeeklyHabitCount >= 10 }
];

export const getBadgeDefinition = (badgeId: string) =>
  badgeDefinitions.find((badge) => badge.id === badgeId);

export const getEarnedBadgeIds = (
  user: User,
  habits: HabitTemplate[],
  dailyEntries: DailyHabitEntry[],
  adHocEntries: AdHocEntry[] = [],
  rewardTemplates: RewardTemplate[] = [],
  expansionStartedAt = 0
) => {
  const coreStats = buildBadgeStats(user.id, habits, dailyEntries, adHocEntries, rewardTemplates);
  const expansionStats = buildBadgeStats(
    user.id,
    habits,
    dailyEntries.filter((entry) => (entry.completedAt || 0) >= expansionStartedAt),
    adHocEntries.filter((entry) => entry.createdAt >= expansionStartedAt),
    rewardTemplates
  );
  return badgeDefinitions
    .filter((badge) => badge.isEarned(badge.generation === 'expansion' ? expansionStats : coreStats))
    .map((badge) => badge.id);
};

interface BadgeState {
  users: User[];
  habitTemplates: HabitTemplate[];
  dailyEntries: DailyHabitEntry[];
  adHocEntries?: AdHocEntry[];
  rewardTemplates?: RewardTemplate[];
  earnedBadges: EarnedBadge[];
}

export const addNewlyEarnedBadges = <T extends BadgeState>(
  state: T,
  createId: () => string,
  earnedAt = Date.now(),
  expansionStartedAt = 0
) => {
  const existingBadgeKeys = new Set(
    state.earnedBadges.map((badge) => `${badge.userId}:${badge.badgeId}`)
  );
  const newBadges: EarnedBadge[] = [];

  for (const user of state.users) {
    for (const badgeId of getEarnedBadgeIds(
      user,
      state.habitTemplates,
      state.dailyEntries,
      state.adHocEntries || [],
      state.rewardTemplates || [],
      expansionStartedAt
    )) {
      const badgeKey = `${user.id}:${badgeId}`;
      if (existingBadgeKeys.has(badgeKey)) continue;

      const earnedBadge: EarnedBadge = {
        id: createId(),
        userId: user.id,
        badgeId,
        earnedAt
      };
      existingBadgeKeys.add(badgeKey);
      newBadges.push(earnedBadge);
    }
  }

  return {
    state: newBadges.length > 0
      ? { ...state, earnedBadges: [...state.earnedBadges, ...newBadges] }
      : state,
    newBadges
  };
};

export const shouldShowBadgeCelebration = (
  pathname: string,
  currentUserId: string | undefined,
  badgeUserId: string
) => {
  const isKidPage = !['/', '/loading', '/parent'].includes(pathname);
  return isKidPage && currentUserId === badgeUserId;
};
