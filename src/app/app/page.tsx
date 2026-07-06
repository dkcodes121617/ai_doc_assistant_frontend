"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ChatInterface } from "@/components/ChatInterface";
import {
  Plus, FileText, X, ChevronLeft, ChevronRight,
  Menu, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentSession {
  documentId: string;
  filename: string;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentSession[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const removeDoc = (id: string) =>
    setDocuments((prev) => prev.filter((d) => d.documentId !== id));

  const handleUploadSuccess = (data: { document_id: string; filename: string; num_chunks: number; num_pages: number }) => {
    setDocuments((prev) => [
      ...prev,
      { documentId: data.document_id, filename: data.filename },
    ]);
    setIsUploadOpen(false);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-50 text-zinc-900 overflow-hidden">

      {/* ════════════════════════════════════
          MOBILE TOP BAR
      ════════════════════════════════════ */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-slate-800">Doc AI</span>
        </div>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              {documents.length} doc{documents.length !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          MOBILE SIDEBAR OVERLAY
      ════════════════════════════════════ */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="sm:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white border-r border-zinc-200 flex flex-col shadow-xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800">Doc AI</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add doc button */}
              <div className="p-3 border-b border-zinc-100">
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-start text-[12px] border-dashed border-slate-300 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all shadow-none"
                      />
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Document
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-white border-zinc-200 p-0 overflow-hidden shadow-2xl rounded-2xl mx-4">
                    <UploadZone onUploadSuccess={handleUploadSuccess} />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Doc list */}
              {documents.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                    Documents{" "}
                    <span className="ml-1 bg-zinc-100 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {documents.length}
                    </span>
                  </p>
                </div>
              )}
              <ScrollArea className="flex-1 px-2">
                <div className="py-1 space-y-0.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.documentId}
                      className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      <div className="p-1 rounded-md bg-zinc-100 flex-shrink-0">
                        <FileText className="w-3 h-3 text-zinc-500" />
                      </div>
                      <p className="text-[12px] font-medium text-zinc-700 truncate flex-1 min-w-0">
                        {doc.filename}
                      </p>
                      <button
                        onClick={() => removeDoc(doc.documentId)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 hover:text-red-500 text-zinc-300 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="flex flex-col items-center py-10 gap-2 text-center">
                      <FileText className="w-6 h-6 text-zinc-300" />
                      <p className="text-[11px] text-zinc-400">No documents yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════
          DESKTOP SIDEBAR
      ════════════════════════════════════ */}
      <motion.div
        animate={{ width: desktopCollapsed ? 52 : 232 }}
        transition={{ type: "spring", bounce: 0, duration: 0.32 }}
        className="hidden sm:flex relative z-20 flex-shrink-0"
      >
        <div className="flex flex-col w-full h-full bg-white border-r border-slate-200 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3.5 py-3.5 border-b border-zinc-100 min-h-[53px]">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <AnimatePresence>
            {!desktopCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="font-semibold text-[13px] text-zinc-800 whitespace-nowrap leading-none"
              >
                DocChat
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Add doc button */}
        <div className={`p-3 border-b border-zinc-100 ${desktopCollapsed ? "flex justify-center" : ""}`}>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className={`border-dashed border-zinc-300 text-zinc-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all shadow-none text-[12px] ${
                    desktopCollapsed ? "w-8 h-8 p-0 justify-center" : "w-full justify-start"
                  }`}
                />
              }
            >
              <Plus className={`w-3.5 h-3.5 flex-shrink-0 ${desktopCollapsed ? "" : "mr-1.5"}`} />
              {!desktopCollapsed && "Add Document"}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-white border-zinc-200 p-0 overflow-hidden shadow-2xl rounded-2xl">
              <UploadZone onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Section label */}
        {!desktopCollapsed && documents.length > 0 && (
          <div className="px-3.5 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              Documents
              <span className="ml-1.5 bg-zinc-100 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {documents.length}
              </span>
            </p>
          </div>
        )}

        {/* Doc list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-0.5 py-1">
            <AnimatePresence>
              {documents.map((doc) => (
                <motion.div
                  key={doc.documentId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`group flex items-center rounded-lg hover:bg-zinc-50 transition-colors duration-150 ${
                    desktopCollapsed ? "p-1.5 justify-center" : "px-2 py-2 gap-2"
                  }`}
                >
                  <div className="p-1 rounded-md bg-zinc-100 flex-shrink-0">
                    <FileText className="w-3 h-3 text-zinc-500" />
                  </div>
                  {!desktopCollapsed && (
                    <>
                      <p className="text-[12px] font-medium text-zinc-700 truncate flex-1 min-w-0">
                        {doc.filename}
                      </p>
                      <button
                        onClick={() => removeDoc(doc.documentId)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 hover:text-red-500 text-zinc-300 transition-all duration-150"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {documents.length === 0 && !desktopCollapsed && (
              <div className="flex flex-col items-center py-10 gap-2 text-center">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-zinc-300" />
                </div>
                <p className="text-[11px] text-zinc-400">No documents yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setDesktopCollapsed((v) => !v)}
          className="absolute -right-3 top-[62px] w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all z-30"
        >
          {desktopCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.div>

      {/* ════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 relative pt-12 sm:pt-0">
        {documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-zinc-300" />
              </div>
              <motion.div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Plus className="w-3 h-3 text-white" />
              </motion.div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-800 mb-1.5">
                Upload a document to begin
              </h2>
              <p className="text-[13px] text-zinc-500 max-w-xs leading-relaxed">
                Add PDF, DOCX, or TXT files and get AI-powered answers with exact citations.
              </p>
            </div>

            <Button
              onClick={() => {
                setIsUploadOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-lg px-5 h-10 text-[13px] shadow-sm shadow-blue-500/20 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Upload document
            </Button>

            <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap justify-center">
              <span>PDF · DOCX · TXT</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span>Max 10 MB</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span>Cited answers</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex p-3 sm:p-4 pb-0 overflow-hidden"
          >
            <ChatInterface documents={documents} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
