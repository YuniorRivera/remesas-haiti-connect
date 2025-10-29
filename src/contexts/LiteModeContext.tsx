import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

interface LiteModeContextType {
  lite: boolean;
  setLite: (enabled: boolean) => void;
}

const LiteModeContext = createContext<LiteModeContextType | undefined>(undefined);

function getInitialLiteMode(): boolean {
  // SSR-safe: check if we're on client
  if (typeof window === 'undefined') return false;
  
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('lite') === '1';
}

export function LiteModeProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lite, setLiteState] = useState<boolean>(getInitialLiteMode);

  // Sync with URL parameter on mount and when URL changes
  useEffect(() => {
    const liteParam = searchParams.get('lite');
    const enabled = liteParam === '1';
    setLiteState(enabled);
  }, [searchParams]);

  // Apply lite class to body when mode changes
  useEffect(() => {
    if (lite) {
      document.body.classList.add("lite");
    } else {
      document.body.classList.remove("lite");
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove("lite");
    };
  }, [lite]);

  const setLite = (enabled: boolean) => {
    setLiteState(enabled);
    
    // Update URL parameter without full reload (SSR-safe)
    const newParams = new URLSearchParams(searchParams);
    if (enabled) {
      newParams.set('lite', '1');
    } else {
      newParams.delete('lite');
    }
    setSearchParams(newParams, { replace: true });
  };

  const value = useMemo(() => ({ lite, setLite }), [lite]);

  return (
    <LiteModeContext.Provider value={value}>{children}</LiteModeContext.Provider>
  );
}

export function useLiteMode() {
  const ctx = useContext(LiteModeContext);
  if (!ctx) {
    throw new Error("useLiteMode must be used within LiteModeProvider");
  }
  return ctx;
}

/**
 * Convenience hook that returns just the lite boolean
 * Use this in components that only need to check if lite mode is active
 */
export function useLite() {
  const { lite } = useLiteMode();
  return lite;
}


