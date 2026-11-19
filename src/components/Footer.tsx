import React from 'react';
import { useApp } from '../context/AppContext';
import { PageRoute } from '../types';

export const Footer: React.FC = () => {
  const { lang, navigate } = useApp();

  const portalLinks: { route: PageRoute; label: string }[] = [
    { route: 'quiz', label: lang === 'hi' ? 'मॉक क्विज' : 'Quizzes & Leaderboard' },
    { route: 'notices', label: lang === 'hi' ? 'महत्वपूर्ण सूचनाएं' : 'Important Notices' },
    { route: 'colleges', label: lang === 'hi' ? 'कॉलेज गाइड' : 'Indian Colleges' },
    { route: 'news', label: lang === 'hi' ? 'शिक्षा समाचार' : 'Education News' },
    { route: 'dashboard', label: lang === 'hi' ? 'स्टूडेंट डैशबोर्ड' : 'Student Dashboard' },
  ];

  const policyLinks: { route: PageRoute; label: string }[] = [
    { route: 'about', label: 'About Us' },
    { route: 'contact', label: 'Contact Us' },
    { route: 'privacy-policy', label: 'Privacy Policy' },
    { route: 'terms', label: 'Terms & Conditions' },
    { route: 'disclaimer', label: 'Disclaimer' },
    { route: 'dmca', label: 'DMCA' },
  ];

  return (
    <footer className="border-t border-slate-800/90 bg-[#050814] text-slate-300 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/logo_c99d9733.png"
              alt="Student Manch Crest"
              className="w-8 h-8 rounded-full border border-amber-400/50"
              referrerPolicy="no-referrer"
            />
            <span className="font-display text-lg font-bold text-white">
              Student Manch (studentmanch.online)
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            {lang === 'hi'
              ? 'भारत के विद्यार्थियों के लिए विश्वसनीय हिंदी व अंग्रेजी शैक्षणिक मंच — मॉक क्विज, आधिकारिक परीक्षा सूचनाएं, कॉलेज ब्रॉशर और सटीक समाचार।'
              : 'India’s independent bilingual educational portal providing verified exam notices, interactive mock quizzes, college admission brochures, and original academic guidance.'}
          </p>
          <p className="text-xs text-slate-500">
            Email: contact@studentmanch.online · New Delhi, India
          </p>
        </div>

        {/* Portal Links */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {lang === 'hi' ? 'मुख्य अनुभाग' : 'Student Sections'}
          </h3>
          <ul className="space-y-2 text-sm">
            {portalLinks.map((l) => (
              <li key={l.route}>
                <button
                  type="button"
                  onClick={() => navigate(l.route)}
                  className="text-slate-300 hover:text-sky-400 transition-colors"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal & AdSense Compliance Links */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {lang === 'hi' ? 'नीतियाँ एवं सहायता' : 'Policies & Support'}
          </h3>
          <ul className="space-y-2 text-sm">
            {policyLinks.map((l) => (
              <li key={l.route}>
                <button
                  type="button"
                  onClick={() => navigate(l.route)}
                  className="text-slate-300 hover:text-sky-400 transition-colors"
                >
                  {l.label}
                </button>
              </li>
            ))}
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-sky-400 transition-colors"
              >
                Sitemap (XML)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Student Manch (studentmanch.online). All rights reserved. Independent educational platform for students in India.
      </div>
    </footer>
  );
};
