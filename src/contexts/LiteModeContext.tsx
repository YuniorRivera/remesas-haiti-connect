import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

interface LiteModeContextType {
  lite: boolean;
}

const LiteModeContext = createContext<LiteModeContextType | undefined>(undefined);

export function LiteModeProvider({ children }: { children: ReactNode }) {
  const [lite, setLite] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const enabled = params.get("lite") === "1";
    setLite(enabled);
  }, []);

  useEffect(() => {
    if (lite) {
      document.body.classList.add("lite");
    } else {
      document.body.classList.remove("lite");
    }
  }, [lite]);

  const value = useMemo(() => ({ lite }), [lite]);

  return (
    <LiteModeContext.Provider value={value}>{children}</LiteModeContext.Provider>
  );
}

export function useLiteMode() {
  const ctx = useContext(LiteModeContext);
  if (!ctx) throw new Error("useLiteMode must be used within LiteModeProvider");
  return ctx;
}


