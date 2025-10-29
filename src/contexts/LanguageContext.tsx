import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Language } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const VALID_LANGUAGES: Language[] = ['ht', 'es', 'fr'];

function getInitialLanguage(): Language {
  // SSR-safe: check if we're on client
  if (typeof window === 'undefined') return 'ht';
  
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && VALID_LANGUAGES.includes(langParam as Language)) {
    return langParam as Language;
  }
  
  // Check localStorage
  const stored = localStorage.getItem('locale');
  if (stored && VALID_LANGUAGES.includes(stored as Language)) {
    return stored as Language;
  }
  
  // Default to HT (Haitian Creole)
  return 'ht';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Sync with URL parameter on mount and when URL changes
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam && VALID_LANGUAGES.includes(langParam as Language)) {
      setLanguageState(langParam as Language);
      localStorage.setItem('locale', langParam);
    }
  }, [searchParams]);

  const setLanguage = (lang: Language) => {
    // Update state
    setLanguageState(lang);
    
    // Save to localStorage
    localStorage.setItem('locale', lang);
    
    // Update URL parameter without full reload (SSR-safe)
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lang', lang);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
