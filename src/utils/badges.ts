import type { DailyHabitEntry, EarnedBadge, HabitTemplate, User } from '../types';

export type BadgeGroup = 'Daily Streaks' | 'Perfect Days' | 'Multi-Habit' | 'Weekly Quests';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  group: BadgeGroup;
  icon: string;
  colors: [string, string];
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

const buildBadgeStats = (
  userId: string,
  habits: HabitTemplate[],
  dailyEntries: DailyHabitEntry[]
): BadgeStats => {
  const userHabits = habits.filter((habit) => habit.userId === userId);
  const activeDailyHabits = userHabits.filter((habit) => habit.isActive && habit.frequency !== 'weekly');
  const activeWeeklyHabits = userHabits.filter((habit) => habit.isActive && habit.frequency === 'weekly');
  const completedEntries = dailyEntries.filter((entry) => entry.userId === userId && entry.completed);
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
    hasEverythingWeek
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
  { id: 'quest-legend', name: 'Quest Legend', description: 'Complete weekly goals 12 weeks in a row.', group: 'Weekly Quests', icon: '\u{1F9ED}', colors: ['#f59e0b', '#7c2d12'], isEarned: (s) => s.longestCompleteWeeklyQuestStreak >= 12 }
];

export const getBadgeDefinition = (badgeId: string) =>
  badgeDefinitions.find((badge) => badge.id === badgeId);

export const getEarnedBadgeIds = (
  user: User,
  habits: HabitTemplate[],
  dailyEntries: DailyHabitEntry[]
) => {
  const stats = buildBadgeStats(user.id, habits, dailyEntries);
  return badgeDefinitions.filter((badge) => badge.isEarned(stats)).map((badge) => badge.id);
};

interface BadgeState {
  users: User[];
  habitTemplates: HabitTemplate[];
  dailyEntries: DailyHabitEntry[];
  earnedBadges: EarnedBadge[];
}

export const addNewlyEarnedBadges = <T extends BadgeState>(
  state: T,
  createId: () => string,
  earnedAt = Date.now()
) => {
  const existingBadgeKeys = new Set(
    state.earnedBadges.map((badge) => `${badge.userId}:${badge.badgeId}`)
  );
  const newBadges: EarnedBadge[] = [];

  for (const user of state.users) {
    for (const badgeId of getEarnedBadgeIds(user, state.habitTemplates, state.dailyEntries)) {
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
