import React, { useState } from 'react';
import { Bookmark, Download, ExternalLink, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { SafeImage } from '../components/SafeImage';
import { createDocumentPdfDataUri, triggerPdfDownload } from '../lib/pdfGenerator';

export const NoticesPage: React.FC = () => {
  const { lang, notices, searchQuery, bookmarks, toggleBookmark } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pdfModal, setPdfModal] = useState<{
    title: string;
    pdfUrl: string;
    externalUrl?: string;
  } | null>(null);

  const categories = ['All', ...Array.from(new Set(notices.map((n) => n.category)))];
  const q = searchQuery.trim().toLowerCase();

  const filtered = notices.filter((n) => {
    const matchCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.titleHi || '').toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  const getPdfForNotice = (n: (typeof notices)[number]) =>
    n.pdfUrl ||
    createDocumentPdfDataUri({
      title: n.title,
      subtitle: `${n.category} | Date: ${n.date}`,
      body: n.summary,
    });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-5">
        <h1 className="font-display text-3xl font-bold text-white">
          {lang === 'hi' ? 'महत्वपूर्ण छात्र सूचनाएं (Important Notices)' : 'Important Exam & Scholarship Notices'}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
          {lang === 'hi'
            ? 'नवीनतम परीक्षा कैलेंडर, एडमिट कार्ड दिशानिर्देश और आधिकारिक PDF सूचनाएं देखें या डाउनलोड करें।'
            : 'Read verified exam circulars, view official PDF notices online, download copies, and visit official portals.'}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AdSlot variant="header" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((notice) => {
          const pdfUrl = getPdfForNotice(notice);
          const isSaved = bookmarks.some((b) => b.itemId === notice.id && b.itemType === 'notice');
          return (
            <article
              key={notice.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/8] bg-slate-950 overflow-hidden">
                  <SafeImage
                    src={notice.imageUrl}
                    alt={notice.title}
                    fallbackTitle={notice.category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-purple-300">{notice.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{notice.date}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toggleBookmark({ id: notice.id, type: 'notice', title: notice.title })
                      }
                      aria-label="Bookmark Notice"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSaved
                          ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="font-display text-xl font-bold text-white leading-snug">
                    {lang === 'hi' && notice.titleHi ? notice.titleHi : notice.title}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{notice.summary}</p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPdfModal({
                        title: notice.title,
                        pdfUrl,
                        externalUrl: notice.externalUrl,
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {lang === 'hi' ? 'PDF देखें' : 'View PDF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPdfDownload(pdfUrl, notice.title)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'hi' ? 'डाउनलोड' : 'Download'}
                  </button>
                </div>

                {notice.externalUrl && (
                  <div className="pt-1">
                    <a
                      href={notice.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {lang === 'hi' ? 'आधिकारिक वेबसाइट लिंक: ' : 'Official Portal Link: '}
                      {notice.externalUrl}
                    </a>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {pdfModal && (
        <PdfViewerModal
          title={pdfModal.title}
          pdfUrl={pdfModal.pdfUrl}
          externalUrl={pdfModal.externalUrl}
          onClose={() => setPdfModal(null)}
        />
      )}
    </div>
  );
};
