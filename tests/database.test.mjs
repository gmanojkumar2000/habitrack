import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { clearState, getState, initDatabase, replaceState } from '../server/database.mjs';

test('default quotes are seeded and restored after a factory reset', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'habitrack-quotes-test-'));
  const dbPath = path.join(tempDir, 'habitrack.sqlite');

  try {
    await initDatabase({ dbPath });
    assert.equal(getState().quotes.length, 100);

    replaceState({ quotes: [] });
    assert.equal(getState().quotes.length, 0);

    clearState();
    const quotes = getState().quotes;
    assert.equal(quotes.length, 100);
    assert.equal(new Set(quotes.map((quote) => quote.text)).size, 100);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('earned badges persist through the SQLite state round trip', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'habitrack-test-'));
  const dbPath = path.join(tempDir, 'habitrack.sqlite');

  try {
    await initDatabase({ dbPath });
    replaceState({
      settings: { parentPin: '0000' },
      users: [{
        id: 'kid-1',
        name: 'Alex',
        avatar: 'A',
        colorTheme: 'primary',
        createdAt: 1
      }],
      currentUser: { id: 'kid-1' },
      habitTemplates: [{
        id: 'habit-1',
        userId: 'kid-1',
        title: 'Brush teeth',
        category: 'Health',
        points: 10,
        isActive: true,
        frequency: 'daily',
        createdAt: 1
      }],
      dailyEntries: [{
        id: 'entry-1',
        userId: 'kid-1',
        date: '2026-06-07',
        habitTemplateId: 'habit-1',
        titleSnapshot: 'Brush teeth',
        pointsSnapshot: 10,
        completed: true,
        completedAt: 1
      }],
      adHocEntries: [],
      rewardTemplates: [],
      earnedBadges: [{
        id: 'badge-1',
        userId: 'kid-1',
        badgeId: 'first-step',
        earnedAt: 1,
        celebratedAt: 2
      }],
      quotes: []
    });

    const state = getState();
    assert.deepEqual(state.earnedBadges, [{
      id: 'badge-1',
      userId: 'kid-1',
      badgeId: 'first-step',
      earnedAt: 1,
      celebratedAt: 2
    }]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
