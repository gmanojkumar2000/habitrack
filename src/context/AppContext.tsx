import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { get as getIndexedDb } from 'idb-keyval';
import type {
  GlobalSettings,
  User,
  HabitTemplate,
  DailyHabitEntry,
  AdHocEntry,
  RewardTemplate,
  EarnedBadge,
  Quote
} from '../types';
import { addNewlyEarnedBadges } from '../utils/badges';

interface AppState {
  settings: GlobalSettings;
  users: User[];
  currentUser: User | null;
  habitTemplates: HabitTemplate[];
  dailyEntries: DailyHabitEntry[];
  adHocEntries: AdHocEntry[];
  rewardTemplates: RewardTemplate[];
  earnedBadges: EarnedBadge[];
  quotes: Quote[];
}

interface SyncResult {
  imported: boolean;
  message: string;
}

interface AppContextType extends AppState {
  updatePin: (newPin: string) => Promise<void>;
  addUser: (name: string, avatar: string, colorTheme: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  switchUser: (id: string) => void;
  addHabitTemplate: (template: Omit<HabitTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateHabitTemplate: (id: string, updates: Partial<HabitTemplate>) => Promise<void>;
  toggleDailyHabit: (templateId: string, date: string) => Promise<void>;
  addAdHocEntry: (entry: Omit<AdHocEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteAdHocEntry: (id: string) => Promise<void>;
  addRewardTemplate: (template: Omit<RewardTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateRewardTemplate: (id: string, updates: Partial<RewardTemplate>) => Promise<void>;
  deleteRewardTemplate: (id: string) => Promise<void>;
  redeemReward: (rewardId: string, userId: string) => Promise<void>;
  saveLocalDataBackup: () => Promise<SyncResult>;
  syncLocalData: () => Promise<SyncResult>;
  clearData: () => Promise<void>;
  badgeCelebration: EarnedBadge | null;
  dismissBadgeCelebration: () => Promise<void>;
}

const defaultState: AppState = {
  settings: { parentPin: '0000' },
  users: [],
  currentUser: null,
  habitTemplates: [],
  dailyEntries: [],
  adHocEntries: [],
  rewardTemplates: [],
  earnedBadges: [],
  quotes: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const loadServerState = async (): Promise<AppState> => {
  const response = await fetch('/api/state');
  if (!response.ok) {
    throw new Error(`Failed to load server database (${response.status})`);
  }
  return normalizeState(await response.json());
};

const saveServerState = async (state: AppState): Promise<AppState> => {
  const response = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });

  if (!response.ok) {
    throw new Error(`Failed to save server database (${response.status})`);
  }

  return normalizeState(await response.json());
};

const readLegacyBrowserState = async (): Promise<AppState | null> => {
  const indexedDbState = await getIndexedDb<AppState>('habitrack_data');
  if (indexedDbState) {
    return normalizeState(indexedDbState);
  }

  const localStorageState = localStorage.getItem('habitrack_data');
  if (!localStorageState) {
    return null;
  }

  return normalizeState(JSON.parse(localStorageState));
};

const normalizeState = (state: Partial<AppState> | null | undefined): AppState => {
  const mergedState = {
    ...defaultState,
    ...(state || {}),
    settings: {
      ...defaultState.settings,
      ...(state?.settings || {})
    }
  };

  return {
    settings: mergedState.settings,
    users: Array.isArray(mergedState.users) ? mergedState.users : [],
    currentUser: mergedState.currentUser || null,
    habitTemplates: Array.isArray(mergedState.habitTemplates) ? mergedState.habitTemplates : [],
    dailyEntries: Array.isArray(mergedState.dailyEntries) ? mergedState.dailyEntries : [],
    adHocEntries: Array.isArray(mergedState.adHocEntries) ? mergedState.adHocEntries : [],
    rewardTemplates: Array.isArray(mergedState.rewardTemplates) ? mergedState.rewardTemplates : [],
    earnedBadges: Array.isArray(mergedState.earnedBadges) ? mergedState.earnedBadges : [],
    quotes: Array.isArray(mergedState.quotes) ? mergedState.quotes : []
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const stateRef = useRef<AppState>(defaultState);

  useEffect(() => {
    const loadData = async () => {
      try {
        const serverState = await loadServerState();
        stateRef.current = serverState;
        setState(serverState);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load server database');
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const commitState = async (nextState: AppState, evaluateBadges = false) => {
    const reconciled = evaluateBadges
      ? addNewlyEarnedBadges(nextState, generateId)
      : { state: nextState, newBadges: [] };
    stateRef.current = reconciled.state;
    setState(reconciled.state);
    try {
      const savedState = await saveServerState(reconciled.state);
      stateRef.current = savedState;
      setState(savedState);
      setLoadError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save server database';
      setLoadError(message);
      throw e;
    }
  };

  const addUser = async (name: string, avatar: string, colorTheme: string) => {
    const prev = stateRef.current;
    const newUser: User = {
      id: generateId(),
      name,
      avatar,
      colorTheme,
      isActive: true,
      createdAt: Date.now()
    };

    await commitState({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: prev.currentUser || newUser
    });
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
      currentUser: prev.currentUser?.id === id ? { ...prev.currentUser, ...updates } : prev.currentUser
    });
  };

  const deleteUser = async (id: string) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, isActive: false } : u),
      currentUser: prev.currentUser?.id === id ? null : prev.currentUser
    });
  };

  const switchUser = (id: string) => {
    const prev = stateRef.current;
    const nextState = {
      ...prev,
      currentUser: prev.users.find(u => u.id === id) || null
    };
    void commitState(nextState);
  };

  const updatePin = async (newPin: string) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      settings: { ...prev.settings, parentPin: newPin }
    });
  };

  const addHabitTemplate = async (template: Omit<HabitTemplate, 'id' | 'createdAt'>) => {
    const prev = stateRef.current;
    const newTemplate: HabitTemplate = {
      ...template,
      id: generateId(),
      createdAt: Date.now()
    };
    await commitState({ ...prev, habitTemplates: [...prev.habitTemplates, newTemplate] });
  };

  const updateHabitTemplate = async (id: string, updates: Partial<HabitTemplate>) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      habitTemplates: prev.habitTemplates.map(h => h.id === id ? { ...h, ...updates } : h)
    });
  };

  const toggleDailyHabit = async (templateId: string, date: string) => {
    const prev = stateRef.current;
    const existingIdx = prev.dailyEntries.findIndex(e => e.habitTemplateId === templateId && e.date === date);

    if (existingIdx >= 0) {
      const updated = [...prev.dailyEntries];
      updated[existingIdx] = {
        ...updated[existingIdx],
        completed: !updated[existingIdx].completed,
        completedAt: !updated[existingIdx].completed ? Date.now() : undefined
      };
      await commitState({ ...prev, dailyEntries: updated }, true);
      return;
    }

    const template = prev.habitTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newEntry: DailyHabitEntry = {
      id: generateId(),
      userId: template.userId,
      date,
      habitTemplateId: template.id,
      titleSnapshot: template.title,
      pointsSnapshot: template.points,
      completed: true,
      completedAt: Date.now()
    };
    await commitState({ ...prev, dailyEntries: [...prev.dailyEntries, newEntry] }, true);
  };

  const deleteAdHocEntry = async (id: string) => {
    const prev = stateRef.current;
    const nextState = { ...prev, adHocEntries: prev.adHocEntries.filter(e => e.id !== id) };
    await commitState(nextState);
  };

  const addAdHocEntry = async (entry: Omit<AdHocEntry, 'id' | 'createdAt'>) => {
    const prev = stateRef.current;
    const newEntry: AdHocEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now()
    };
    const nextState = { ...prev, adHocEntries: [...prev.adHocEntries, newEntry] };

    if (entry.convertToHabit) {
      const newTemplate: HabitTemplate = {
        id: generateId(),
        userId: entry.userId,
        title: entry.title,
        category: entry.category,
        points: entry.points,
        isActive: true,
        createdAt: Date.now()
      };
      nextState.habitTemplates = [...nextState.habitTemplates, newTemplate];
    }

    await commitState(nextState);
  };

  const addRewardTemplate = async (template: Omit<RewardTemplate, 'id' | 'createdAt'>) => {
    const prev = stateRef.current;
    const newTemplate: RewardTemplate = {
      ...template,
      id: generateId(),
      createdAt: Date.now()
    };
    await commitState({ ...prev, rewardTemplates: [...prev.rewardTemplates, newTemplate] });
  };

  const updateRewardTemplate = async (id: string, updates: Partial<RewardTemplate>) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      rewardTemplates: prev.rewardTemplates.map(r => r.id === id ? { ...r, ...updates } : r)
    });
  };

  const deleteRewardTemplate = async (id: string) => {
    const prev = stateRef.current;
    await commitState({
      ...prev,
      rewardTemplates: prev.rewardTemplates.filter(r => r.id !== id)
    });
  };

  const redeemReward = async (rewardId: string, userId: string) => {
    const prev = stateRef.current;
    const reward = prev.rewardTemplates.find(r => r.id === rewardId);
    if (!reward) return;

    const newEntry: AdHocEntry = {
      id: generateId(),
      userId,
      date: new Date().toISOString().split('T')[0],
      title: `Redeemed: ${reward.title}`,
      points: -Math.abs(reward.cost),
      category: 'Reward',
      convertToHabit: false,
      createdAt: Date.now()
    };

    await commitState({ ...prev, adHocEntries: [...prev.adHocEntries, newEntry] });
  };

  const syncLocalData = async (): Promise<SyncResult> => {
    const legacyState = await readLegacyBrowserState();

    if (!legacyState) {
      return { imported: false, message: 'No browser-stored data was found to sync.' };
    }

    await commitState(legacyState);
    return { imported: true, message: 'Browser-stored data has been synced to SQLite.' };
  };

  const saveLocalDataBackup = async (): Promise<SyncResult> => {
    const legacyState = await readLegacyBrowserState();

    if (!legacyState) {
      return { imported: false, message: 'No browser-stored data was found to back up.' };
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      source: 'browser-storage',
      data: legacyState
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habitrack-browser-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return { imported: true, message: 'Browser-stored data backup was downloaded.' };
  };

  const clearData = async () => {
    await commitState(defaultState);
  };

  const badgeCelebration = state.currentUser
    ? state.earnedBadges.find((badge) =>
      badge.userId === state.currentUser?.id && badge.celebratedAt == null
    ) || null
    : null;

  const dismissBadgeCelebration = async () => {
    if (!badgeCelebration) return;
    const prev = stateRef.current;
    await commitState({
      ...prev,
      earnedBadges: prev.earnedBadges.map((badge) =>
        badge.id === badgeCelebration.id
          ? { ...badge, celebratedAt: Date.now() }
          : badge
      )
    });
  };

  if (!isLoaded) return <div>Loading server database...</div>;

  if (loadError) {
    return (
      <div className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '520px' }}>
          <h2>Server database unavailable</h2>
          <p>{loadError}</p>
          <p>Start the Habitrack server with <code>npm run dev</code> and refresh this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      ...state,
      updatePin, addUser, updateUser, deleteUser, switchUser,
      addHabitTemplate, updateHabitTemplate, toggleDailyHabit,
      addAdHocEntry, deleteAdHocEntry, addRewardTemplate, updateRewardTemplate, deleteRewardTemplate, redeemReward,
      saveLocalDataBackup, syncLocalData, clearData,
      badgeCelebration,
      dismissBadgeCelebration
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
