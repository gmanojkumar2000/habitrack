import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const dateKey = (daysAgo = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString('sv-SE');
};

const baseUser = {
  id: 'kid-1',
  name: 'Alex',
  avatar: 'A',
  colorTheme: 'primary',
  isActive: true,
  mascotEnabled: false,
  createdAt: 1
};

const habit = (overrides: Record<string, unknown> = {}) => ({
  id: 'habit-1',
  userId: baseUser.id,
  title: 'Brush teeth',
  category: 'Health',
  points: 10,
  isActive: true,
  isCritical: false,
  frequency: 'daily',
  createdAt: 1,
  ...overrides
});

const completedEntry = (habitId: string, date: string, points = 10) => ({
  id: `${habitId}-${date}`,
  userId: baseUser.id,
  date,
  habitTemplateId: habitId,
  titleSnapshot: habitId,
  pointsSnapshot: points,
  completed: true,
  completedAt: 1
});

const state = (overrides: Record<string, unknown> = {}) => ({
  settings: { parentPin: '0000', badgeExpansionStartedAt: 1 },
  users: [baseUser],
  currentUser: baseUser,
  habitTemplates: [],
  dailyEntries: [],
  adHocEntries: [],
  rewardTemplates: [],
  earnedBadges: [],
  quotes: [],
  ...overrides
});

async function resetState(request: APIRequestContext, nextState = state()) {
  const response = await request.put('/api/state', { data: nextState });
  expect(response.ok()).toBeTruthy();
}

async function unlockParent(page: Page) {
  await page.goto('/parent');
  await page.getByPlaceholder('****').fill('0000');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Parent Control' })).toBeVisible();
}

async function dismissBadgeQueue(page: Page) {
  while (await page.getByRole('dialog').isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Close badge celebration' }).click();
  }
}

async function expectBadgeInQueue(page: Page, badgeName: string) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await expect(page.getByRole('dialog')).toBeVisible();
    if (await page.getByText(badgeName, { exact: true }).isVisible().catch(() => false)) return;
    await page.getByRole('button', { name: 'Close badge celebration' }).click();
  }
  throw new Error(`Badge "${badgeName}" was not found in the celebration queue`);
}

test.beforeEach(async ({ request }) => {
  await resetState(request, {
    settings: { parentPin: '0000', badgeExpansionStartedAt: 1 },
    users: [],
    currentUser: null,
    habitTemplates: [],
    dailyEntries: [],
    adHocEntries: [],
    rewardTemplates: [],
    earnedBadges: [],
    quotes: []
  });
});

test('first-run onboarding, parent setup, and reload persistence', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByText("Welcome to Habitrack! Let's add your first hero.")).toBeVisible();
  await page.getByPlaceholder('e.g. Leo').fill('Alex');
  await page.getByRole('button', { name: 'Ready to Go!' }).click();
  await expect(page.getByRole('heading', { name: "Who's playing today?" })).toBeVisible();

  await page.getByRole('button', { name: 'Parent Area' }).click();
  await page.getByPlaceholder('****').fill('0000');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await page.getByRole('button', { name: 'Habits' }).click();

  const habitForm = page.locator('form').filter({ has: page.getByPlaceholder('e.g. Brush teeth') });
  await habitForm.getByPlaceholder('e.g. Brush teeth').fill('Brush teeth');
  await habitForm.locator('select').nth(0).selectOption('Health');
  await habitForm.locator('input[type="number"]').fill('15');
  await habitForm.getByRole('button', { name: 'Add Habit' }).click();
  await expect(page.getByText('Brush teeth', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Rewards' }).click();
  const rewardForm = page.locator('form').filter({ has: page.getByPlaceholder('e.g. Disney Trip') });
  await rewardForm.getByPlaceholder('e.g. Disney Trip').fill('Movie Night');
  await rewardForm.locator('input[type="number"]').fill('40');
  await rewardForm.getByRole('button', { name: 'Create Reward' }).click();
  await expect(page.getByText('Reward saved.')).toBeVisible();
  await expect(page.getByText('Movie Night', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Parent Area' })).toBeVisible();

  const saved = await (await request.get('/api/state')).json();
  expect(saved.users).toHaveLength(1);
  expect(saved.habitTemplates[0]).toMatchObject({ title: 'Brush teeth', points: 15 });
  expect(saved.rewardTemplates[0]).toMatchObject({ title: 'Movie Night', cost: 40 });
});

test('child completes a habit, sees badge celebrations, and finds earned badges', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit()]
  }));

  await page.goto('/today');
  await page.getByText('Brush teeth', { exact: true }).click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('First Step', { exact: true })).toBeVisible();
  await dismissBadgeQueue(page);

  await page.getByRole('link', { name: 'Badges' }).click();
  await expect(page.getByRole('heading', { name: 'Badges' })).toBeVisible();
  await expect(page.locator('article.badge-card.earned').filter({ hasText: 'First Step' })).toBeVisible();
  await expect(page.locator('article.badge-card.earned').filter({ hasText: 'Daily Hero' })).toBeVisible();

  const saved = await (await request.get('/api/state')).json();
  expect(saved.dailyEntries).toHaveLength(1);
  expect(saved.earnedBadges.map((badge: { badgeId: string }) => badge.badgeId)).toEqual(
    expect.arrayContaining(['first-step', 'daily-hero'])
  );
});

test('pending badge celebrations survive reload and dismissed badges stay closed', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit()],
    dailyEntries: [completedEntry('habit-1', dateKey())],
    earnedBadges: [{
      id: 'badge-pending',
      userId: baseUser.id,
      badgeId: 'first-step',
      earnedAt: 1
    }]
  }));

  await page.goto('/today');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('button', { name: 'Close badge celebration' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const saved = await (await request.get('/api/state')).json();
  expect(saved.earnedBadges[0].celebratedAt).toBeGreaterThan(1);
});

test('parent edits the past seven days without a popup, then the child receives it', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit()],
    dailyEntries: [
      completedEntry('habit-1', dateKey(2)),
      completedEntry('habit-1', dateKey(1))
    ]
  }));

  await unlockParent(page);
  await expect(page.getByText('Tap a day to update it')).toBeVisible();

  const editableDays = page.locator('.history-day-button');
  await expect(editableDays).toHaveCount(7);
  await editableDays.last().click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const saved = await (await request.get('/api/state')).json();
  expect(saved.dailyEntries.filter((entry: { completed: boolean }) => entry.completed)).toHaveLength(3);
  expect(saved.earnedBadges.map((badge: { badgeId: string }) => badge.badgeId)).toContain('spark-starter');

  await page.getByRole('link', { name: 'Today' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('First Step', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close badge celebration' }).click();
  await expect(page.getByText('Spark Starter', { exact: true })).toBeVisible();
});

test('extra good deeds update points and progress', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit()]
  }));

  await page.goto('/today');
  await page.getByRole('button', { name: 'I did something extra good!' }).click();
  await page.getByPlaceholder('e.g. Helped fold laundry').fill('Helped with dishes');
  await page.locator('input[type="number"]').fill('12');
  await page.getByRole('button', { name: 'Claim Points!' }).click();
  await expect(page.getByText('Bonus Spark', { exact: true })).toBeVisible();
  await dismissBadgeQueue(page);

  await page.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByText('Available Points').locator('..').getByRole('heading', { name: '12' })).toBeVisible();
  await expect(page.getByText('Extra Deeds').locator('..').getByRole('heading', { name: '1' })).toBeVisible();

  const saved = await (await request.get('/api/state')).json();
  expect(saved.adHocEntries[0]).toMatchObject({ title: 'Helped with dishes', points: 12 });
});

test('parent redeems an affordable reward and the child balance updates', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit({ points: 50 })],
    dailyEntries: [completedEntry('habit-1', dateKey(), 50)],
    rewardTemplates: [{
      id: 'reward-1',
      userId: baseUser.id,
      title: 'Movie Night',
      cost: 30,
      icon: 'Gift',
      isActive: true,
      createdAt: 1
    }]
  }));

  await page.goto('/rewards');
  await expect(page.getByText('50', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Ready to Claim')).toBeVisible();

  await unlockParent(page);
  await page.getByRole('button', { name: 'Rewards' }).click();
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Redeem' }).click();

  await expect.poll(async () => {
    const saved = await (await request.get('/api/state')).json();
    return saved.adHocEntries.some((entry: { title: string; points: number }) =>
      entry.title === 'Redeemed: Movie Night' && entry.points === -30
    );
  }).toBe(true);

  await page.getByRole('link', { name: 'Rewards' }).click();
  await expectBadgeInQueue(page, 'Dream Redeemer');
  await dismissBadgeQueue(page);
  await expect(page.getByText('20', { exact: true }).first()).toBeVisible();
});

test('badges page displays the complete 50-badge collection', async ({ page, request }) => {
  await resetState(request, state());

  await page.goto('/badges');
  await expect(page.getByText('0 of 50 earned')).toBeVisible();
  await expect(page.locator('article.badge-card')).toHaveCount(50);
  await expect(page.getByRole('heading', { name: 'Comebacks' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Habit Mastery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Points & Rewards' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Extra Effort' })).toBeVisible();
});

test('all child navigation tabs work and state remains after reload', async ({ page, request }) => {
  await resetState(request, state({
    habitTemplates: [habit()],
    dailyEntries: [completedEntry('habit-1', dateKey())],
    earnedBadges: [{
      id: 'badge-1',
      userId: baseUser.id,
      badgeId: 'first-step',
      earnedAt: 1,
      celebratedAt: 2
    }]
  }));

  await page.goto('/today');
  await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();

  await page.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Your Progress' })).toBeVisible();

  await page.getByRole('link', { name: 'Rewards' }).click();
  await expect(page.getByRole('heading', { name: 'Rewards', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Badges' }).click();
  await expect(page.getByRole('heading', { name: 'Badges' })).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Brush teeth', { exact: true })).toBeVisible();
});
