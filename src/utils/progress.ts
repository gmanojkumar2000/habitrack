import type { AdHocEntry, DailyHabitEntry } from '../types';

export const toDateKey = (date: Date) => date.toLocaleDateString('sv-SE');

export const buildRecentDateKeys = (length: number) => {
  return Array.from({ length }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (length - 1 - index));
    return toDateKey(date);
  });
};

export const calculateUserPoints = (
  userId: string,
  dailyEntries: DailyHabitEntry[],
  adHocEntries: AdHocEntry[]
) => {
  const completedDaily = dailyEntries.filter((entry) => entry.userId === userId && entry.completed);
  const userAdHoc = adHocEntries.filter((entry) => entry.userId === userId);
  const earnedAdHoc = userAdHoc.filter((entry) => entry.points > 0);
  const spentAdHoc = userAdHoc.filter((entry) => entry.points < 0);

  const lifetimePoints =
    completedDaily.reduce((sum, entry) => sum + entry.pointsSnapshot, 0) +
    earnedAdHoc.reduce((sum, entry) => sum + entry.points, 0);

  return {
    completedDaily,
    earnedAdHoc,
    spentAdHoc,
    lifetimePoints,
    currentPoints: lifetimePoints + spentAdHoc.reduce((sum, entry) => sum + entry.points, 0)
  };
};

export const calculateCurrentStreak = (userId: string, dailyEntries: DailyHabitEntry[]) => {
  const completedDates = new Set(
    dailyEntries
      .filter((entry) => entry.userId === userId && entry.completed)
      .map((entry) => entry.date)
  );

  let streak = 0;
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  while (completedDates.has(toDateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
};

export const getNextStreakMilestone = (currentStreak: number) => {
  const milestones = [3, 7, 14, 30, 60, 90, 100];
  return milestones.find((milestone) => milestone > currentStreak) || currentStreak + 10;
};
