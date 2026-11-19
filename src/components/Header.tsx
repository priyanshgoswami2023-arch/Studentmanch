import React, { useState } from 'react';
import { Menu, Search, User as UserIcon, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageRoute } from '../types';

export const Header: React.FC = () => {
  const { lang, setLang, route, navigate, searchQuery, setSearchQuery, user, profile } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { route: PageRoute; en: string; hi: string }[] = [
    { route: 'home', en: 'Home', hi: 'होम' },
    { route: 'quiz', en: 'Quiz', hi: 'क्विज' },
    { route: 'notices', en: 'Notices', hi: 'सूचनाएं' },
    { route: 'colleges', en: 'Colleges', hi: 'कॉलेज' },
    { route: 'news', en: 'News', hi: 'समाचार' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && route === 'home') {
      navigate('news');
    }
    setMobileOpen(false);
  };

  const go = (r: PageRoute) => {
    navigate(r);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#070B19]/92 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Zone */}
        <button
          type="button"
          onClick={() => go('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
        >
          <img
            src="/assets/aistudio/logo_c99d9733.png"
            alt="Student Manch Logo"
            className="w-9 h-9 rounded-full object-cover border border-amber-400/60"
            referrerPolicy="no-referrer"
          />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Student Manch
          </span>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const active =
              route === item.route || (item.route === 'news' && route === 'article');
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => go(item.route)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                  active
                    ? 'text-white border-sky-400'
                    : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                {lang === 'hi' ? item.hi : item.en}
              </button>
            );
          })}
        </nav>

        {/* Search Bar + Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'खोजें (क्विज, नोटिस, न्यूज़)...' : 'Search quiz, notice, news...'}
              aria-label="Search Student Manch"
              className="w-52 xl:w-60 pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-colors"
            />
          </form>

          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            aria-label="Switch Language"
            className="px-2.5 py-1.5 rounded-lg border border-slate-700/90 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:border-slate-500 transition-colors whitespace-nowrap shrink-0"
          >
            {lang === 'en' ? 'EN / हिं' : 'हिं / EN'}
          </button>

          <button
            type="button"
            onClick={() => go(user ? 'dashboard' : 'auth')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="max-w-[110px] truncate">
              {user
                ? profile?.displayName || (lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard')
                : lang === 'hi'
                ? 'लॉगिन'
                : 'Sign In'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#070B19] px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'खोजें (क्विज, नोटिस, न्यूज़)...' : 'Search quiz, notice, news...'}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
          </form>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => go(item.route)}
                className={`px-3 py-2.5 rounded-lg text-left text-sm font-medium border transition-colors ${
                  route === item.route
                    ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                {lang === 'hi' ? item.hi : item.en}
              </button>
            ))}
            <button
              type="button"
              onClick={() => go(user ? 'dashboard' : 'auth')}
              className="px-3 py-2.5 rounded-lg text-left text-sm font-medium bg-indigo-600 text-white"
            >
              {user
                ? lang === 'hi'
                  ? 'मेरा डैशबोर्ड'
                  : 'Dashboard'
                : lang === 'hi'
                ? 'लॉगिन / साइन अप'
                : 'Sign In / Join'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
