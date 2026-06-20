import { createContext, useContext, ReactNode } from 'react';

const DemoContext = createContext(false);
export function DemoProvider({ children }: { children: ReactNode }) {
  const isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');
  return <DemoContext.Provider value={isDemo}>{children}</DemoContext.Provider>;
}
export function useDemoMode() { return useContext(DemoContext); }
