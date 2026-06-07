export interface GlobalSettings {
  parentPin: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  colorTheme: string;
  isActive?: boolean;
  vacationMode?: boolean;
  mascotEnabled?: boolean;
  createdAt: number;
}

export interface HabitTemplate {
  id: string;
  userId: string;
  title: string;
  category: string;
  points: number;
  isActive: boolean;
  isCritical?: boolean;
  frequency?: 'daily' | 'weekly';
  createdAt: number;
}

export interface DailyHabitEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  habitTemplateId: string;
  titleSnapshot: string;
  pointsSnapshot: number;
  completed: boolean;
  completedAt?: number;
}

export interface AdHocEntry {
  id: string;
  userId: string;
  date: string;
  title: string;
  points: number;
  category: string;
  note?: string;
  convertToHabit: boolean;
  relatedHabitId?: string;
  createdAt: number;
}

export interface RewardTemplate {
  id: string;
  userId: string;
  title: string;
  cost: number;
  icon: string;
  isActive: boolean;
  createdAt: number;
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
}
