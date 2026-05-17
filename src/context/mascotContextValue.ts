import { createContext } from 'react';

export type CheerType = 'success' | 'streak' | 'warning' | 'party';

export interface CheerPayload {
  title: string;
  message: string;
  type?: CheerType;
  duration?: number;
}

export interface MascotContextType {
  isVisible: boolean;
  title: string;
  message: string;
  type: CheerType;
  isCheering: boolean;
  triggerCheer: (payload: CheerPayload) => void;
  dismissCheer: () => void;
}

export const MascotContext = createContext<MascotContextType | undefined>(undefined);
