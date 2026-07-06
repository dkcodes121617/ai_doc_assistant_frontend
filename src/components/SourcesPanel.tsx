"use client";

import { useEffect, useRef, useState, memo } from "react";
import { X, FileText, Hash, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Citation {
  chunk_id: string;
  page_number: number;
  snippet_text: string;
  relevant_excerpt?: string;
  index: number;
}

interface SourcesPanelProps {
  citations: Citation[];
  highlightedIndex: number | null;
  onClose: () => void;
}

/* ────────────────────────────────────────
   Single citation card
──────────────────────────────────────── */
const CitationCard = memo(function CitationCard({
  cit,
  isHighlighted,
  cardRef,
  onClick,
}: {
  cit: Citation;
  isHighlighted: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onClick: () => void;
}) {
  // Expand to show full text if highlighted, otherwise truncate
  const rawSnippet = (cit.relevant_excerpt || cit.snippet_text)?.trim() || "";
  const isExpanded = isHighlighted;

  const displaySnippet = (!isExpanded && rawSnippet.length > 240)
    ? rawSnippet.slice(0, 240) + "…"
    : rawSnippet;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-xl border cursor-pointer select-none overflow-hidden transition-all duration-200 ${isHighlighted
        ? "bg-blue-50 border-blue-200 shadow-md shadow-blue-100/50"
        : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
        }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Highlight accent bar */}
      <AnimatePresence>
        {isHighlighted && (
          <motion.div
            layoutId="src-accent"
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Header row: index + page number */}
      <div className={`flex items-center justify-between px-3.5 pt-3 pb-2 border-b ${isHighlighted ? "border-blue-100" : "border-slate-50"
        }`}>
        <div className="flex items-center gap-2">
          {/* Citation number badge */}
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${isHighlighted
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-500"
              }`}
          >
            {cit.index}
          </div>

          {/* Page number */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${isHighlighted
            ? "bg-blue-100/60 border-blue-200 text-blue-700"
            : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
            <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
            Page {cit.page_number}
          </div>
        </div>

        {/* Chunk ID (subtle, for traceability) */}
        <div className="flex items-center gap-1 text-[9px] text-slate-300 font-mono" title={cit.chunk_id}>
          <Hash className="w-2.5 h-2.5" />
          <span className="truncate max-w-[56px]">{cit.chunk_id.slice(-8)}</span>
        </div>
      </div>

      {/* Snippet */}
      <div className="px-3.5 py-3">
        <p className={`text-[12px] leading-[1.6] whitespace-pre-wrap ${isHighlighted ? "text-blue-900" : "text-slate-600 italic"
          }`}>
          {displaySnippet}
        </p>
      </div>
    </motion.div>
  );
});

/* ════════════════════════════════════════
   PANEL
════════════════════════════════════════ */
export const SourcesPanel = memo(function SourcesPanel({
  citations,
  highlightedIndex,
  onClose,
}: SourcesPanelProps) {
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (highlightedIndex !== null && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex, citations]);

  const isOpen = citations.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, x: 16, width: 0 }}
          animate={isMobile
            ? { opacity: 1, y: 0 }
            : { opacity: 1, x: 0, width: 320, minWidth: 320 }
          }
          exit={isMobile ? { opacity: 0, y: "100%" } : { opacity: 0, x: 16, width: 0 }}
          transition={{ type: "spring", bounce: 0.06, duration: 0.38 }}
          className={
            isMobile
              ? "fixed inset-x-0 bottom-0 z-50 h-[70vh] flex-shrink-0"
              : "flex-shrink-0 h-full"
          }
        >
          <div className="h-full flex flex-col bg-white border border-slate-200 rounded-t-xl sm:rounded-t-xl sm:border-b-0 shadow-lg overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-slate-800 leading-none">
                    Source Citations
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {citations.length} reference{citations.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cards list */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 flex flex-col gap-2.5">
              {citations.map((cit, i) => (
                <motion.div
                  key={cit.index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CitationCard
                    cit={cit}
                    isHighlighted={highlightedIndex === cit.index}
                    cardRef={(el) => { itemRefs.current[cit.index] = el; }}
                    onClick={() => {/* already highlighted on open */ }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
              <p className="text-[10px] text-slate-400 text-center">
                Click citation numbers{" "}
                <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-blue-600 text-white rounded-full align-middle">1</span>
                {" "}in the answer to highlight a source
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
