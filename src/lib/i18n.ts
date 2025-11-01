import es from "@/locales/es.json";
import ht from "@/locales/ht.json";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import { useLanguage } from "@/contexts/LanguageContext";

export type Language = 'es' | 'ht' | 'fr' | 'en';

type Dict = Record<string, string>;

const DICTS: Record<Language, Dict> = { es, ht, fr, en } as const;

export function useLocale() {
  const { language, setLanguage } = useLanguage();

  const t = (key: string): string => {
    // Prefer current language; fallback to HT (default), then ES, else key
    return (
      DICTS[language][key] ||
      DICTS.ht[key] ||
      DICTS.es[key] ||
      key
    );
  };

  return { locale: language, setLocale: setLanguage, t, dicts: DICTS };
}
