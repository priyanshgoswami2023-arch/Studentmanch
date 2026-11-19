import React from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  Building2,
  FileText,
  GraduationCap,
  Newspaper,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';
import { SafeImage } from '../components/SafeImage';

export const HomePage: React.FC = () => {
  const { lang, navigate, news, notices, quizzes, colleges, searchQuery } = useApp();

  const q = searchQuery.trim().toLowerCase();
  const filteredNews = (q
    ? news.filter(
        (n) =>
          n.headline.toLowerCase().includes(q) ||
          (n.headlineHi || '').toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q)
      )
    : news
  ).slice(0, 6);

  const recentNotices = notices.slice(0, 4);

  const glowCards = [
    {
      id: 'quiz' as const,
      title: lang === 'hi' ? '1. क्विज (Quiz)' : '1. Quiz',
      subtitle:
        lang === 'hi'
          ? 'लाइव मॉक टेस्ट, स्कोर और टॉप-3 लीडरबोर्ड'
          : 'Practice MCQs, live score & Gold/Silver/Bronze podium',
      icon: Trophy,
      borderGrad: 'from-sky-400 via-blue-500 to-cyan-400',
      glowClass: 'glow-btn-blue',
      accentText: 'text-sky-300',
      iconBg: 'bg-sky-500/15 border-sky-400/40 text-sky-300',
    },
    {
      id: 'notices' as const,
      title: lang === 'hi' ? '2. महत्वपूर्ण सूचना (Notice)' : '2. Important Notice',
      subtitle:
        lang === 'hi'
          ? 'परीक्षा तिथियाँ, एडमिट कार्ड एवं आधिकारिक PDF'
          : 'Official exam schedules, PDFs & direct portal links',
      icon: Bell,
      borderGrad: 'from-violet-400 via-purple-500 to-indigo-500',
      glowClass: 'glow-btn-purple',
      accentText: 'text-purple-300',
      iconBg: 'bg-purple-500/15 border-purple-400/40 text-purple-300',
    },
    {
      id: 'colleges' as const,
      title: lang === 'hi' ? '3. कॉलेज (College)' : '3. College',
      subtitle:
        lang === 'hi'
          ? 'शीर्ष भारतीय कॉलेज, फीस, ब्रॉशर PDF व लिंक'
          : 'Top Indian colleges, fees, brochure PDFs & links',
      icon: Building2,
      borderGrad: 'from-pink-400 via-rose-500 to-fuchsia-500',
      glowClass: 'glow-btn-pink',
      accentText: 'text-pink-300',
      iconBg: 'bg-pink-500/15 border-pink-400/40 text-pink-300',
    },
    {
      id: 'news' as const,
      title: lang === 'hi' ? '4. समाचार (News Section)' : '4. News Section',
      subtitle:
        lang === 'hi'
          ? 'एग्जाम, रिजल्ट, एडमिशन, जॉब और स्कॉलरशिप'
          : 'Exam, Result, Admission, Job & Scholarship updates',
      icon: Newspaper,
      borderGrad: 'from-blue-400 via-purple-500 to-pink-500',
      glowClass: 'glow-btn-tri',
      accentText: 'text-indigo-200',
      iconBg: 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0E1633] via-[#090F24] to-[#070B19] px-5 py-10 sm:px-10 sm:py-14 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex justify-center">
            <img
              src="/assets/aistudio/logo_c99d9733.png"
              alt="Student Manch Official Emblem"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-400/70 shadow-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white [text-wrap:balance]">
            {lang === 'hi'
              ? 'स्टूडेंट मंच — भारत के विद्यार्थियों का डिजिटल मंच'
              : 'Student Manch — India’s Trusted Student Portal'}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {lang === 'hi'
              ? 'क्विज अभ्यास, आधिकारिक परीक्षा नोटिस PDF, भारतीय कॉलेज गाइड और हिंदी-अंग्रेजी शिक्षा समाचार एक ही स्थान पर।'
              : 'Bilingual Hindi & English quizzes, verified exam notice PDFs, Indian college brochures, and original career & scholarship news.'}
          </p>
        </div>

        {/* 4 Big GLOWING Action Buttons */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {glowCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.id)}
                className={`group relative p-[2px] rounded-2xl bg-gradient-to-br ${card.borderGrad} ${card.glowClass} transition-all duration-200 hover:-translate-y-1.5 active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
              >
                <div className="h-full rounded-[14px] bg-[#0B1124]/95 group-hover:bg-[#0F1733] px-5 py-6 flex flex-col justify-between gap-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center ${card.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className={`w-5 h-5 ${card.accentText} transition-transform group-hover:translate-x-1`} />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">
                      {card.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-300 leading-snug">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reserved Header Ad Slot */}
      <AdSlot variant="header" />

      {/* Latest Updates + Sidebar Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Latest Updates Feed */}
        <div className="lg:col-span-8 space-y-10">
          {/* Latest News Updates */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {lang === 'hi' ? 'ताज़ा शिक्षा समाचार' : 'Latest Education Updates'}
                </h2>
                <p className="text-sm text-slate-400">
                  {lang === 'hi'
                    ? 'परीक्षा, परिणाम, प्रवेश, सरकारी नौकरी व छात्रवृत्ति लेख'
                    : 'Original guides across Exam, Result, Admission, Job & Scholarship'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('news')}
                className="text-sm font-semibold text-sky-400 hover:text-sky-300 whitespace-nowrap shrink-0"
              >
                {lang === 'hi' ? 'सभी समाचार →' : 'All News →'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredNews.map((article) => (
                <article
                  key={article.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="aspect-[16/9] bg-slate-950 overflow-hidden">
                      <SafeImage
                        src={article.imageUrl}
                        alt={article.headline}
                        fallbackTitle={article.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-sky-400">{article.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{article.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-white leading-snug line-clamp-2">
                        {lang === 'hi' && article.headlineHi ? article.headlineHi : article.headline}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => navigate('article', article.slug)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      {lang === 'hi' ? 'पूरा लेख पढ़ें' : 'Read More'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* In-Content Ad Slot */}
          <AdSlot variant="in-content" />

          {/* Latest Important Notices Strip */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-display text-2xl font-bold text-white">
                {lang === 'hi' ? 'नवीनतम महत्वपूर्ण सूचनाएं' : 'Recent Important Notices'}
              </h2>
              <button
                type="button"
                onClick={() => navigate('notices')}
                className="text-sm font-semibold text-purple-400 hover:text-purple-300 whitespace-nowrap"
              >
                {lang === 'hi' ? 'सभी सूचनाएं →' : 'View All Notices →'}
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/40">
              {recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-purple-300 font-semibold">{notice.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{notice.date}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {lang === 'hi' && notice.titleHi ? notice.titleHi : notice.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('notices')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-semibold text-purple-200 whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {lang === 'hi' ? 'PDF देखें' : 'View PDF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <AdSlot variant="sidebar" />

          {/* Quiz Spotlight */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {lang === 'hi' ? 'लोकप्रिय क्विज' : 'Active Mock Quizzes'}
              </h3>
              <button
                type="button"
                onClick={() => navigate('quiz')}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                {lang === 'hi' ? 'खेलें' : 'Play All'}
              </button>
            </div>
            <div className="space-y-3">
              {quizzes.slice(0, 3).map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={() => navigate('quiz')}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-sky-500/50 transition-colors space-y-1"
                >
                  <div className="text-xs text-sky-400 font-medium">
                    {quiz.category} · {quiz.questions.length} MCQs
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {lang === 'hi' && quiz.titleHi ? quiz.titleHi : quiz.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Featured Colleges */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-pink-400" />
                {lang === 'hi' ? 'शीर्ष कॉलेज निर्देशिका' : 'Featured Colleges'}
              </h3>
              <button
                type="button"
                onClick={() => navigate('colleges')}
                className="text-xs font-semibold text-pink-400 hover:text-pink-300"
              >
                {lang === 'hi' ? 'सभी देखें' : 'Explore'}
              </button>
            </div>
            <div className="space-y-2.5">
              {colleges.slice(0, 4).map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => navigate('colleges')}
                  className="w-full text-left p-3 rounded-xl border border-slate-800/90 bg-slate-950/50 hover:border-pink-500/40 transition-colors"
                >
                  <div className="text-sm font-semibold text-white truncate">
                    {lang === 'hi' && col.nameHi ? col.nameHi : col.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {col.location} · {col.stream}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Student Account Callout */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/25 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              {lang === 'hi' ? 'अपना स्कोर सेव करें' : 'Save Quiz Progress'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'hi'
                ? 'फ्री छात्र खाता बनाएं, अपनी क्विज प्रगति ट्रैक करें और लीडरबोर्ड पर रैंक प्राप्त करें।'
                : 'Create your free Student Manch account to save quiz scores, track accuracy on your dashboard, and bookmark articles.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('auth')}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              {lang === 'hi' ? 'साइन अप / लॉगिन' : 'Sign Up / Log In'}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
};
