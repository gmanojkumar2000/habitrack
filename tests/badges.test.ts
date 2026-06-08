import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addNewlyEarnedBadges,
  getEarnedBadgeIds,
  shouldShowBadgeCelebration
} from '../src/utils/badges.ts';
import { buildRecentDateKeys } from '../src/utils/progress.ts';
import type { DailyHabitEntry, EarnedBadge, HabitTemplate, User } from '../src/types/index.ts';

const user: User = {
  id: 'kid-1',
  name: 'Alex',
  avatar: 'A',
  colorTheme: 'primary',
  createdAt: 1
};

const dailyHabit = (id: string, category = 'Health'): HabitTemplate => ({
  id,
  userId: user.id,
  title: id,
  category,
  points: 10,
  isActive: true,
  frequency: 'daily',
  createdAt: 1
});

const weeklyHabit = (id: string): HabitTemplate => ({
  ...dailyHabit(id),
  frequency: 'weekly'
});

const entry = (habitId: string, date: string): DailyHabitEntry => ({
  id: `${habitId}-${date}`,
  userId: user.id,
  date,
  habitTemplateId: habitId,
  titleSnapshot: habitId,
  pointsSnapshot: 10,
  completed: true,
  completedAt: 1
});

test('three consecutive active days earn First Step, Spark Starter, and Daily Hero', () => {
  const habits = [dailyHabit('brush')];
  const entries = [
    entry('brush', '2026-06-01'),
    entry('brush', '2026-06-02'),
    entry('brush', '2026-06-03')
  ];

  const earned = new Set(getEarnedBadgeIds(user, habits, entries));

  assert.equal(earned.has('first-step'), true);
  assert.equal(earned.has('spark-starter'), true);
  assert.equal(earned.has('daily-hero'), true);
  assert.equal(earned.has('workweek-warrior'), false);
});

test('perfect-day and multi-habit streak rules require their full thresholds', () => {
  const habits = [
    dailyHabit('brush', 'Health'),
    dailyHabit('read', 'Learning'),
    dailyHabit('tidy', 'Responsibility')
  ];
  const entries = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = `2026-06-0${dayIndex + 1}`;
    return habits.map((habit) => entry(habit.id, date));
  }).flat();

  const earned = new Set(getEarnedBadgeIds(user, habits, entries));

  assert.equal(earned.has('perfect-week'), true);
  assert.equal(earned.has('dynamic-duo'), true);
  assert.equal(earned.has('triple-threat'), true);
  assert.equal(earned.has('balanced-builder'), true);
});

test('weekly quest streaks are grouped by Monday-based calendar weeks', () => {
  const habits = [weeklyHabit('laundry'), weeklyHabit('room')];
  const entries = [
    entry('laundry', '2026-06-01'),
    entry('room', '2026-06-05'),
    entry('laundry', '2026-06-08'),
    entry('room', '2026-06-12'),
    entry('laundry', '2026-06-15'),
    entry('room', '2026-06-19')
  ];

  const earned = new Set(getEarnedBadgeIds(user, habits, entries));

  assert.equal(earned.has('quest-begin'), true);
  assert.equal(earned.has('weekly-winner'), true);
  assert.equal(earned.has('two-week-trek'), true);
  assert.equal(earned.has('three-week-titan'), true);
  assert.equal(earned.has('month-of-mondays'), false);
});

test('badge reconciliation adds only newly earned badges', () => {
  const existingBadge: EarnedBadge = {
    id: 'existing',
    userId: user.id,
    badgeId: 'first-step',
    earnedAt: 1
  };
  let nextId = 0;
  const result = addNewlyEarnedBadges({
    users: [user],
    habitTemplates: [dailyHabit('brush')],
    dailyEntries: [
      entry('brush', '2026-06-01'),
      entry('brush', '2026-06-02'),
      entry('brush', '2026-06-03')
    ],
    earnedBadges: [existingBadge]
  }, () => `new-${++nextId}`, 99);

  assert.equal(result.newBadges.some((badge) => badge.badgeId === 'first-step'), false);
  assert.equal(result.newBadges.some((badge) => badge.badgeId === 'spark-starter'), true);
  assert.equal(new Set(result.state.earnedBadges.map((badge) => badge.badgeId)).size, result.state.earnedBadges.length);
  assert.equal(result.newBadges.every((badge) => badge.earnedAt === 99), true);
});

test('badge popup is restricted to the earning child on kid-facing pages', () => {
  assert.equal(shouldShowBadgeCelebration('/today', 'kid-1', 'kid-1'), true);
  assert.equal(shouldShowBadgeCelebration('/badges', 'kid-1', 'kid-1'), true);
  assert.equal(shouldShowBadgeCelebration('/parent', 'kid-1', 'kid-1'), false);
  assert.equal(shouldShowBadgeCelebration('/', 'kid-1', 'kid-1'), false);
  assert.equal(shouldShowBadgeCelebration('/today', 'kid-2', 'kid-1'), false);
});

test('recent date builder provides exactly seven ordered local date keys', () => {
  const dates = buildRecentDateKeys(7);

  assert.equal(dates.length, 7);
  assert.equal(new Set(dates).size, 7);
  assert.equal(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)), true);
  assert.deepEqual([...dates].sort(), dates);
});
