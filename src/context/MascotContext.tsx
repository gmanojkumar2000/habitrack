import React, { useState, useRef, useCallback } from 'react';
import { MascotContext, type CheerPayload, type CheerType } from './mascotContextValue';

export const MascotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCheering, setIsCheering] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CheerType>('success');
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissCheer = useCallback(() => {
    setIsVisible(false);
    setIsCheering(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
  }, []);

  const triggerCheer = useCallback(({ title: newTitle, message: newMessage, type: newType = 'success', duration = 5000 }: CheerPayload) => {
    // Clear any existing hide timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    // Trigger a little reset toggle for animations to replay
    setIsCheering(false);
    
    // Set the new text
    setTitle(newTitle);
    setMessage(newMessage);
    setType(newType);
    
    // Make it visible
    setIsVisible(true);
    
    // Short delay to re-trigger bounce animation
    setTimeout(() => {
      setIsCheering(true);
    }, 20);

    // Schedule automatic dismissal
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsCheering(false);
    }, duration);

    // Animation state clears sooner so it can settle into idle
    animationTimeoutRef.current = setTimeout(() => {
      setIsCheering(false);
    }, 1200); // 800ms for animation plus buffer
  }, []);

  return (
    <MascotContext.Provider value={{
      isVisible,
      title,
      message,
      type,
      isCheering,
      triggerCheer,
      dismissCheer
    }}>
      {children}
    </MascotContext.Provider>
  );
};
