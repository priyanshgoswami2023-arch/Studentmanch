import React from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { triggerPdfDownload } from '../lib/pdfGenerator';

interface PdfViewerModalProps {
  title: string;
  pdfUrl: string;
  externalUrl?: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  title,
  pdfUrl,
  externalUrl,
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-violet-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerPdfDownload(pdfUrl, title)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Official Link
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF viewer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 relative overflow-hidden">
          <iframe
            src={pdfUrl}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
