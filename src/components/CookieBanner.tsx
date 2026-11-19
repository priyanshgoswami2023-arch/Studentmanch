import React, { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { PageRoute } from '../types';

interface CookieBannerProps {
  onNavigate: (route: PageRoute) => void;
  lang: 'en' | 'hi';
}

const CONSENT_KEY = 'studentmanch_cookie_consent_v1';

export const CookieBanner: React.FC<CookieBannerProps> = ({ onNavigate, lang }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (!saved) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie Consent"
      className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-4xl rounded-xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-md px-4 py-3 shadow-2xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 leading-snug">
          <Cookie className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            {lang === 'hi'
              ? 'हम बेहतर अनुभव और Google AdSense विज्ञापन दिखाने के लिए कुकीज़ का उपयोग करते हैं। '
              : 'We use cookies to improve your reading experience and serve relevant Google AdSense ads. '}
            <button
              type="button"
              onClick={() => onNavigate('privacy-policy')}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2 font-medium"
            >
              {lang === 'hi' ? 'गोपनीयता नीति पढ़ें' : 'Privacy Policy'}
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleChoice('essential')}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {lang === 'hi' ? 'केवल आवश्यक' : 'Essential Only'}
          </button>
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors whitespace-nowrap"
          >
            {lang === 'hi' ? 'स्वीकार करें' : 'Accept All'}
          </button>
        </div>
      </div>
    </div>
  );
};
