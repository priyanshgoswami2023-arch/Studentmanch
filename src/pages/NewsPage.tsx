import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Search,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NewsCategory } from '../types';
import { AdSlot } from '../components/AdSlot';
import { SafeImage } from '../components/SafeImage';

const CATEGORIES: ('All' | NewsCategory)[] = [
  'All',
  'Exam',
  'Result',
  'Admission',
  'Job',
  'Scholarship',
];

export const NewsPage: React.FC = () => {
  const {
    lang,
    route,
    selectedArticleSlug,
    navigate,
    news,
    searchQuery,
    setSearchQuery,
    bookmarks,
    toggleBookmark,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'All' | NewsCategory>('All');
  const [copied, setCopied] = useState(false);

  const activeArticle =
    route === 'article' && selectedArticleSlug
      ? news.find((a) => a.slug === selectedArticleSlug || a.id === selectedArticleSlug)
      : null;

  if (activeArticle) {
    const related = news
      .filter((n) => n.id !== activeArticle.id && n.category === activeArticle.category)
      .slice(0, 3);
    const isSaved = bookmarks.some(
      (b) => b.itemId === activeArticle.id && b.itemType === 'news'
    );
    const shareUrl = window.location.href;
    const shareTitle =
      lang === 'hi' && activeArticle.headlineHi
        ? activeArticle.headlineHi
        : activeArticle.headline;

    const handleCopy = () => {
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const paragraphs = (
      lang === 'hi' && activeArticle.contentHi ? activeArticle.contentHi : activeArticle.content
    ).split('\n\n');

    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <button
          type="button"
          onClick={() => navigate('news')}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'hi' ? 'समाचार अनुभाग पर वापस जाएं' : 'Back to All News'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Article Body */}
          <article className="lg:col-span-8 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-sky-400">{activeArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{activeArticle.date}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.author}</span>
                <span aria-hidden="true">·</span>
                <span>{activeArticle.readTime}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
                {shareTitle}
              </h1>
            </div>

            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <SafeImage
                src={activeArticle.imageUrl}
                alt={shareTitle}
                fallbackTitle={activeArticle.category}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Share & Save Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 mr-1">
                  <Share2 className="w-3.5 h-3.5" />
                  Share:
                </span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-sky-600/20 border border-sky-500/40 text-xs font-medium text-sky-300 hover:bg-sky-600/30"
                >
                  Telegram
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  X / Twitter
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  toggleBookmark({
                    id: activeArticle.id,
                    type: 'news',
                    title: activeArticle.headline,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isSaved
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {isSaved ? 'Saved' : 'Save Article'}
              </button>
            </div>

            {/* Article Prose */}
            <div className="max-w-prose space-y-5 text-base sm:text-[17px] text-slate-200 leading-[1.8]">
              {paragraphs.map((para, idx) => (
                <React.Fragment key={idx}>
                  <p>{para}</p>
                  {idx === 1 && (
                    <div className="my-6">
                      <AdSlot variant="in-content" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Tags as quiet inline text */}
            {activeArticle.tags && activeArticle.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 mr-2">Topics:</span>
                {activeArticle.tags.join(' · ')}
              </div>
            )}

            {/* Related News */}
            {related.length > 0 && (
              <section className="pt-8 border-t border-slate-800 space-y-4">
                <h2 className="font-display text-xl font-bold text-white">
                  {lang === 'hi' ? 'संबंधित समाचार' : 'Related News & Guides'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => navigate('article', rel.slug)}
                      className="text-left rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-sky-500/40 transition-colors space-y-2"
                    >
                      <div className="text-xs text-sky-400 font-semibold">
                        {rel.category} · {rel.date}
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-3 leading-snug">
                        {lang === 'hi' && rel.headlineHi ? rel.headlineHi : rel.headline}
                      </h3>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="lg:col-span-4 space-y-6">
            <AdSlot variant="sidebar" />
          </aside>
        </div>
      </div>
    );
  }

  const q = searchQuery.trim().toLowerCase();
  const filteredNews = news.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch =
      !q ||
      item.headline.toLowerCase().includes(q) ||
      (item.headlineHi || '').toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-white">
            {lang === 'hi' ? 'छात्र समाचार एवं मार्गदर्शन (News Section)' : 'Student News & Career Guides'}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            {lang === 'hi'
              ? 'परीक्षा, रिजल्ट, एडमिशन, सरकारी नौकरी और छात्रवृत्ति से जुड़े मौलिक लेख व अपडेट।'
              : 'Original bilingual articles covering Exam, Result, Admission, Job, and Scholarship updates across India.'}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'hi' ? 'समाचार खोजें...' : 'Filter articles...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AdSlot variant="header" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((article) => (
          <article
            key={article.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
          >
            <div>
              <div className="aspect-[16/10] bg-slate-950 overflow-hidden">
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
                <h2 className="font-display text-lg font-bold text-white leading-snug line-clamp-2">
                  {lang === 'hi' && article.headlineHi ? article.headlineHi : article.headline}
                </h2>
                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
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
                {lang === 'hi' ? 'आगे पढ़ें' : 'Read More'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
