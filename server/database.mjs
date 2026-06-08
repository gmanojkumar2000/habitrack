import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const defaultState = {
  settings: { parentPin: '0000' },
  users: [],
  currentUser: null,
  habitTemplates: [],
  dailyEntries: [],
  adHocEntries: [],
  rewardTemplates: [],
  earnedBadges: [],
  quotes: [
    { id: '1', text: 'You are capable of amazing things.', author: 'Unknown' },
    { id: '2', text: 'Every day is a fresh start.', author: 'Unknown' },
    { id: '3', text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
    { id: '4', text: 'Make today so awesome yesterday gets jealous.', author: 'Unknown' },
    { id: '5', text: 'You can learn something new every day if you listen.', author: 'Unknown' }
  ]
};

const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  color_theme TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  mascot_enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily'
);

CREATE TABLE IF NOT EXISTS daily_habit_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  habit_template_id TEXT NOT NULL REFERENCES habit_templates(id) ON DELETE CASCADE,
  title_snapshot TEXT NOT NULL,
  points_snapshot INTEGER NOT NULL,
  completed INTEGER NOT NULL,
  completed_at INTEGER,
  UNIQUE(habit_template_id, date)
);

CREATE TABLE IF NOT EXISTS ad_hoc_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  convert_to_habit INTEGER NOT NULL,
  related_habit_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_templates_user_id ON habit_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_habit_entries_user_date ON daily_habit_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_hoc_entries_user_date ON ad_hoc_entries(user_id, date);

CREATE TABLE IF NOT EXISTS reward_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  icon TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reward_templates_user_id ON reward_templates(user_id);

CREATE TABLE IF NOT EXISTS earned_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  celebrated_at INTEGER,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_earned_badges_user_id ON earned_badges(user_id);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT
);

INSERT OR IGNORE INTO quotes (id, text, author) VALUES 
('1', 'You are capable of amazing things.', 'Unknown'),
('2', 'Every day is a fresh start.', 'Unknown'),
('3', 'Believe you can and you are halfway there.', 'Theodore Roosevelt'),
('4', 'Make today so awesome yesterday gets jealous.', 'Unknown'),
('5', 'You can learn something new every day if you listen.', 'Unknown'),
('6', 'The secret of getting ahead is getting started.', 'Mark Twain'),
('7', 'It always seems impossible until it is done.', 'Nelson Mandela'),
('8', 'Do what you can, with what you have, where you are.', 'Theodore Roosevelt'),
('9', 'Keep your face always toward the sunshine—and shadows will fall behind you.', 'Walt Whitman'),
('10', 'Fall seven times and stand up eight.', 'Japanese Proverb'),
('11', 'Why fit in when you were born to stand out?', 'Dr. Seuss'),
('12', 'The more that you read, the more things you will know. The more that you learn, the more places you''ll go.', 'Dr. Seuss'),
('13', 'You always pass failure on the way to success.', 'Mickey Rooney'),
('14', 'Only surround yourself with people who will lift you higher.', 'Oprah Winfrey'),
('15', 'We grow great by dreams.', 'Woodrow Wilson'),
('16', 'Don''t let what you cannot do interfere with what you can do.', 'John Wooden'),
('17', 'Winning doesn''t always mean being first. Winning means you''re doing better than you''ve done before.', 'Bonnie Blair'),
('18', 'You are braver than you believe, stronger than you seem, and smarter than you think.', 'A.A. Milne'),
('19', 'It’s not what happens to you, but how you react to it that matters.', 'Epictetus'),
('20', 'Be a voice, not an echo.', 'Albert Einstein'),
('21', 'Dream big and dare to fail.', 'Norman Vaughan'),
('22', 'Everything you can imagine is real.', 'Pablo Picasso'),
('23', 'In a gentle way, you can shake the world.', 'Mahatma Gandhi'),
('24', 'To be the best, you must be able to handle the worst.', 'Wilson Kanadi'),
('25', 'Mistakes are proof that you are trying.', 'Unknown');
`;

const insertSettingsSql = `
INSERT OR REPLACE INTO settings (key, value, updated_at)
VALUES (?, ?, ?)
`;

const insertUserSql = `
INSERT INTO users (id, name, avatar, color_theme, is_active, mascot_enabled, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const insertHabitTemplateSql = `
INSERT INTO habit_templates (id, user_id, title, category, points, is_active, created_at, frequency)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertDailyEntrySql = `
INSERT INTO daily_habit_entries (
  id, user_id, date, habit_template_id, title_snapshot, points_snapshot, completed, completed_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertAdHocEntrySql = `
INSERT INTO ad_hoc_entries (
  id, user_id, date, title, points, category, note, convert_to_habit, related_habit_id, created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const insertRewardTemplateSql = `
INSERT INTO reward_templates (id, user_id, title, cost, icon, is_active, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const insertQuoteSql = `
INSERT INTO quotes (id, text, author)
VALUES (?, ?, ?)
`;

const insertEarnedBadgeSql = `
INSERT INTO earned_badges (id, user_id, badge_id, earned_at, celebrated_at)
VALUES (?, ?, ?, ?, ?)
`;

let SQL;
let db;
let dbPath;

export async function initDatabase(options = {}) {
  const dataDir = options.dataDir || path.join(process.cwd(), 'data');
  dbPath = options.dbPath || path.join(dataDir, 'habitrack.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
  });

  db = fs.existsSync(dbPath)
    ? new SQL.Database(fs.readFileSync(dbPath))
    : new SQL.Database();

  db.exec(schemaSql);
  
  // Migrations
  try { db.exec("ALTER TABLE habit_templates ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily'"); } catch (e) {}
  try { db.exec("ALTER TABLE ad_hoc_entries ADD COLUMN related_habit_id TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN mascot_enabled INTEGER NOT NULL DEFAULT 1"); } catch (e) {}
  try { db.exec("ALTER TABLE earned_badges ADD COLUMN celebrated_at INTEGER"); } catch (e) {}
  
  persistDatabase();

  return { dbPath };
}

export function getSchema() {
  return schemaSql.trim();
}

export function getState() {
  assertReady();

  const settingsRows = selectAll('SELECT key, value FROM settings');
  const settingsMap = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));

  const users = selectAll(`
    SELECT id, name, avatar, color_theme, is_active, mascot_enabled, created_at
    FROM users
    ORDER BY created_at ASC
  `).map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    colorTheme: row.color_theme,
    isActive: Boolean(row.is_active),
    mascotEnabled: Boolean(row.mascot_enabled),
    createdAt: Number(row.created_at)
  }));

  const currentUser = users.find((user) => user.id === settingsMap.current_user_id) || null;

  return {
    settings: {
      parentPin: settingsMap.parent_pin || defaultState.settings.parentPin
    },
    users,
    currentUser,
    habitTemplates: selectAll(`
      SELECT id, user_id, title, category, points, is_active, created_at, frequency
      FROM habit_templates
      ORDER BY created_at ASC
    `).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      category: row.category,
      points: Number(row.points),
      isActive: Boolean(row.is_active),
      createdAt: Number(row.created_at),
      frequency: row.frequency || 'daily'
    })),
    dailyEntries: selectAll(`
      SELECT id, user_id, date, habit_template_id, title_snapshot, points_snapshot, completed, completed_at
      FROM daily_habit_entries
      ORDER BY date ASC, completed_at ASC
    `).map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      habitTemplateId: row.habit_template_id,
      titleSnapshot: row.title_snapshot,
      pointsSnapshot: Number(row.points_snapshot),
      completed: Boolean(row.completed),
      completedAt: row.completed_at == null ? undefined : Number(row.completed_at)
    })),
    adHocEntries: selectAll(`
      SELECT id, user_id, date, title, points, category, note, convert_to_habit, related_habit_id, created_at
      FROM ad_hoc_entries
      ORDER BY date ASC, created_at ASC
    `).map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      title: row.title,
      points: Number(row.points),
      category: row.category,
      note: row.note == null ? undefined : row.note,
      convertToHabit: Boolean(row.convert_to_habit),
      relatedHabitId: row.related_habit_id == null ? undefined : row.related_habit_id,
      createdAt: Number(row.created_at)
    })),
    rewardTemplates: selectAll(`
      SELECT id, user_id, title, cost, icon, is_active, created_at
      FROM reward_templates
      ORDER BY created_at ASC
    `).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      cost: Number(row.cost),
      icon: row.icon,
      isActive: Boolean(row.is_active),
      createdAt: Number(row.created_at)
    })),
    earnedBadges: selectAll(`
      SELECT id, user_id, badge_id, earned_at, celebrated_at
      FROM earned_badges
      ORDER BY earned_at ASC
    `).map((row) => ({
      id: row.id,
      userId: row.user_id,
      badgeId: row.badge_id,
      earnedAt: Number(row.earned_at),
      celebratedAt: row.celebrated_at == null ? undefined : Number(row.celebrated_at)
    })),
    quotes: selectAll(`
      SELECT id, text, author
      FROM quotes
    `).map((row) => ({
      id: row.id,
      text: row.text,
      author: row.author == null ? undefined : row.author
    }))
  };
}

export function replaceState(inputState) {
  assertReady();
  const state = normalizeState(inputState);
  const now = Date.now();

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    db.exec(`
      DELETE FROM ad_hoc_entries;
      DELETE FROM daily_habit_entries;
      DELETE FROM habit_templates;
      DELETE FROM reward_templates;
      DELETE FROM earned_badges;
      DELETE FROM users;
      DELETE FROM settings;
      DELETE FROM quotes;
    `);

    run(insertSettingsSql, ['parent_pin', state.settings.parentPin, now]);
    if (state.currentUser?.id) {
      run(insertSettingsSql, ['current_user_id', state.currentUser.id, now]);
    }

    for (const user of state.users) {
      run(insertUserSql, [
        user.id,
        user.name,
        user.avatar,
        user.colorTheme,
        user.isActive === false ? 0 : 1,
        user.mascotEnabled === false ? 0 : 1,
        user.createdAt
      ]);
    }

    for (const template of state.habitTemplates) {
      run(insertHabitTemplateSql, [
        template.id,
        template.userId,
        template.title,
        template.category,
        template.points,
        template.isActive ? 1 : 0,
        template.createdAt,
        template.frequency || 'daily'
      ]);
    }

    for (const entry of state.dailyEntries) {
      run(insertDailyEntrySql, [
        entry.id,
        entry.userId,
        entry.date,
        entry.habitTemplateId,
        entry.titleSnapshot,
        entry.pointsSnapshot,
        entry.completed ? 1 : 0,
        entry.completedAt ?? null
      ]);
    }

    for (const entry of state.adHocEntries) {
      run(insertAdHocEntrySql, [
        entry.id,
        entry.userId,
        entry.date,
        entry.title,
        entry.points,
        entry.category,
        entry.note ?? null,
        entry.convertToHabit ? 1 : 0,
        entry.relatedHabitId ?? null,
        entry.createdAt
      ]);
    }

    for (const template of state.rewardTemplates) {
      run(insertRewardTemplateSql, [
        template.id,
        template.userId,
        template.title,
        template.cost,
        template.icon,
        template.isActive ? 1 : 0,
        template.createdAt
      ]);
    }

    for (const badge of state.earnedBadges) {
      run(insertEarnedBadgeSql, [
        badge.id,
        badge.userId,
        badge.badgeId,
        badge.earnedAt,
        badge.celebratedAt ?? null
      ]);
    }

    for (const quote of state.quotes) {
      run(insertQuoteSql, [
        quote.id,
        quote.text,
        quote.author ?? null
      ]);
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  persistDatabase();
  return getState();
}

export function clearState() {
  return replaceState(defaultState);
}

function normalizeState(inputState = {}) {
  const state = {
    ...defaultState,
    ...inputState,
    settings: {
      ...defaultState.settings,
      ...(inputState.settings || {})
    }
  };

  return {
    settings: {
      parentPin: String(state.settings.parentPin || defaultState.settings.parentPin)
    },
    users: asArray(state.users).map((user) => ({
      id: requireString(user.id, 'user.id'),
      name: String(user.name || ''),
      avatar: String(user.avatar || ''),
      colorTheme: String(user.colorTheme || 'primary'),
      isActive: user.isActive !== false,
      mascotEnabled: user.mascotEnabled !== false,
      createdAt: Number(user.createdAt || Date.now())
    })),
    currentUser: state.currentUser || null,
    habitTemplates: asArray(state.habitTemplates).map((template) => ({
      id: requireString(template.id, 'habitTemplate.id'),
      userId: requireString(template.userId, 'habitTemplate.userId'),
      title: String(template.title || ''),
      category: String(template.category || ''),
      points: Number(template.points || 0),
      isActive: template.isActive !== false,
      createdAt: Number(template.createdAt || Date.now()),
      frequency: String(template.frequency || 'daily')
    })),
    dailyEntries: asArray(state.dailyEntries).map((entry) => ({
      id: requireString(entry.id, 'dailyEntry.id'),
      userId: requireString(entry.userId, 'dailyEntry.userId'),
      date: requireString(entry.date, 'dailyEntry.date'),
      habitTemplateId: requireString(entry.habitTemplateId, 'dailyEntry.habitTemplateId'),
      titleSnapshot: String(entry.titleSnapshot || ''),
      pointsSnapshot: Number(entry.pointsSnapshot || 0),
      completed: Boolean(entry.completed),
      completedAt: entry.completedAt == null ? undefined : Number(entry.completedAt)
    })),
    adHocEntries: asArray(state.adHocEntries).map((entry) => ({
      id: requireString(entry.id, 'adHocEntry.id'),
      userId: requireString(entry.userId, 'adHocEntry.userId'),
      date: requireString(entry.date, 'adHocEntry.date'),
      title: String(entry.title || ''),
      points: Number(entry.points || 0),
      category: String(entry.category || ''),
      note: entry.note == null ? undefined : String(entry.note),
      convertToHabit: Boolean(entry.convertToHabit),
      relatedHabitId: entry.relatedHabitId == null ? undefined : String(entry.relatedHabitId),
      createdAt: Number(entry.createdAt || Date.now())
    })),
    rewardTemplates: asArray(state.rewardTemplates).map((template) => ({
      id: requireString(template.id, 'rewardTemplate.id'),
      userId: requireString(template.userId, 'rewardTemplate.userId'),
      title: String(template.title || ''),
      cost: Number(template.cost || 0),
      icon: String(template.icon || ''),
      isActive: template.isActive !== false,
      createdAt: Number(template.createdAt || Date.now())
    })),
    earnedBadges: asArray(state.earnedBadges).map((badge) => ({
      id: requireString(badge.id, 'earnedBadge.id'),
      userId: requireString(badge.userId, 'earnedBadge.userId'),
      badgeId: requireString(badge.badgeId, 'earnedBadge.badgeId'),
      earnedAt: Number(badge.earnedAt || Date.now()),
      celebratedAt: badge.celebratedAt == null ? undefined : Number(badge.celebratedAt)
    })),
    quotes: asArray(state.quotes).map((quote) => ({
      id: requireString(quote.id, 'quote.id'),
      text: requireString(quote.text, 'quote.text'),
      author: quote.author == null ? undefined : String(quote.author)
    }))
  };
}

function selectAll(sql, params = []) {
  const statement = db.prepare(sql);
  const rows = [];

  try {
    statement.bind(params);
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
  } finally {
    statement.free();
  }

  return rows;
}

function run(sql, params = []) {
  const statement = db.prepare(sql);

  try {
    statement.run(params);
  } finally {
    statement.free();
  }
}

function persistDatabase() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function assertReady() {
  if (!db) {
    throw new Error('Database has not been initialized');
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid state payload: ${fieldName} is required`);
  }

  return value;
}
