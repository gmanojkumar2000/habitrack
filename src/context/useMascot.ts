import { useContext } from 'react';
import { MascotContext } from './mascotContextValue';

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};
