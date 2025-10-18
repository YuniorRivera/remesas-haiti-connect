import { useState, useEffect } from "react";

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  date: string;
}

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("cookie-consent");
    if (stored) {
      setConsent(JSON.parse(stored));
    }
  }, []);

  const hasAnalyticsConsent = () => {
    return consent?.analytics === true;
  };

  const updateConsent = (newConsent: CookieConsent) => {
    localStorage.setItem("cookie-consent", JSON.stringify(newConsent));
    setConsent(newConsent);
  };

  return {
    consent,
    hasAnalyticsConsent,
    updateConsent
  };
};
