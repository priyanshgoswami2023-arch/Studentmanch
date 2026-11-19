import React, { useState } from 'react';
import { Bookmark, Download, ExternalLink, FileText, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdSlot } from '../components/AdSlot';
import { PdfViewerModal } from '../components/PdfViewerModal';
import { SafeImage } from '../components/SafeImage';
import { createDocumentPdfDataUri, triggerPdfDownload } from '../lib/pdfGenerator';

export const CollegesPage: React.FC = () => {
  const { lang, colleges, searchQuery, bookmarks, toggleBookmark } = useApp();
  const [selectedStream, setSelectedStream] = useState('All');
  const [pdfModal, setPdfModal] = useState<{
    title: string;
    pdfUrl: string;
    externalUrl?: string;
  } | null>(null);

  const streams = ['All', ...Array.from(new Set(colleges.map((c) => c.stream)))];
  const q = searchQuery.trim().toLowerCase();

  const filtered = colleges.filter((col) => {
    const matchStream = selectedStream === 'All' || col.stream === selectedStream;
    const matchQuery =
      !q ||
      col.name.toLowerCase().includes(q) ||
      (col.nameHi || '').toLowerCase().includes(q) ||
      col.location.toLowerCase().includes(q) ||
      col.details.toLowerCase().includes(q);
    return matchStream && matchQuery;
  });

  const getPdfForCollege = (col: (typeof colleges)[number]) =>
    col.pdfUrl ||
    createDocumentPdfDataUri({
      title: col.name,
      subtitle: `${col.location} | ${col.stream}`,
      body: `${col.details}\n\nFees: ${col.fees || 'See official website'}\nExams Accepted: ${
        col.examsAccepted || 'CUET / National Entrance'
      }`,
    });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2 border-b border-slate-800 pb-5">
        <h1 className="font-display text-3xl font-bold text-white">
          {lang === 'hi' ? 'भारतीय कॉलेज एवं विश्वविद्यालय निर्देशिका' : 'Top Indian Colleges & Admission Brochures'}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
          {lang === 'hi'
            ? 'IIT, NIT, AIIMS और केंद्रीय विश्वविद्यालयों की जानकारी, शुल्क संरचना, प्रवेश परीक्षाएं और ब्रॉशर PDF प्राप्त करें।'
            : 'Explore Indian universities, compare fee structures and accepted entrance exams, and download official brochure PDFs.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {streams.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setSelectedStream(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedStream === st
                ? 'bg-pink-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <AdSlot variant="header" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((col) => {
          const pdfUrl = getPdfForCollege(col);
          const isSaved = bookmarks.some((b) => b.itemId === col.id && b.itemType === 'college');
          return (
            <article
              key={col.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden flex flex-col justify-between hover:border-pink-500/40 transition-colors"
            >
              <div>
                <div className="aspect-[16/10] bg-slate-950 overflow-hidden">
                  <SafeImage
                    src={col.imageUrl}
                    alt={col.name}
                    fallbackTitle={col.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-pink-300">{col.stream}</span>
                    <button
                      type="button"
                      onClick={() =>
                        toggleBookmark({ id: col.id, type: 'college', title: col.name })
                      }
                      aria-label="Bookmark College"
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSaved
                          ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                          : 'border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="font-display text-lg font-bold text-white leading-snug">
                    {lang === 'hi' && col.nameHi ? col.nameHi : col.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{col.location}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {lang === 'hi' && col.detailsHi ? col.detailsHi : col.details}
                  </p>

                  {(col.fees || col.examsAccepted) && (
                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                      {col.fees && (
                        <div>
                          <span className="text-slate-500">Fees: </span>
                          <span className="text-slate-200 font-medium">{col.fees}</span>
                        </div>
                      )}
                      {col.examsAccepted && (
                        <div>
                          <span className="text-slate-500">Exams: </span>
                          <span className="text-slate-200 font-medium">{col.examsAccepted}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPdfModal({
                        title: `${col.name} Brochure`,
                        pdfUrl,
                        externalUrl: col.externalUrl,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {lang === 'hi' ? 'ब्रॉशर PDF देखें' : 'View Brochure PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerPdfDownload(pdfUrl, col.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>

                {col.externalUrl && (
                  <div>
                    <a
                      href={col.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {col.externalUrl}
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
