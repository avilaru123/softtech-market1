import React, { createContext, useContext, useState, useCallback } from 'react';

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextType>({
  announce: () => {},
});

export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Schedule asynchronously to prevent updating AnnouncerProvider during another component's render phase
    window.setTimeout(() => {
      if (priority === 'assertive') {
        setAssertiveMessage('');
        window.setTimeout(() => setAssertiveMessage(message), 40);
      } else {
        setPoliteMessage('');
        window.setTimeout(() => setPoliteMessage(message), 40);
      }
    }, 0);
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {/* Off-screen live regions for assistive technologies */}
      <div
        id="polite-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        id="assertive-announcer"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
      {children}
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  return useContext(AnnouncerContext);
}
