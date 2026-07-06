"use client";

import { useState, useCallback } from "react";
import { UploadCloud, CheckCircle2, FileText, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface UploadResponse {
  document_id: string;
  filename: string;
  num_chunks: number;
  num_pages: number;
}

interface UploadZoneProps {
  onUploadSuccess: (data: UploadResponse) => void;
}

type State = "idle" | "uploading" | "success" | "error";

const ACCEPTED_MIME = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const FILE_TYPE_LABELS = ["PDF", "DOCX", "TXT"];

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMessage, setStatusMessage] = useState("Initializing...");

  const validate = (file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10 MB.");
      return false;
    }
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const validMime = ACCEPTED_MIME.includes(file.type) || isDocx;
    if (!validMime) {
      toast.error("Unsupported file type. Please use PDF, DOCX, or TXT.");
      return false;
    }
    return true;
  };

  const upload = async (file: File) => {
    setState("uploading");
    setProgress(0);
    setErrorMsg("");
    setStatusMessage("Uploading file...");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${url}/upload`, { method: "POST", body: fd });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || "Upload failed");
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "progress") {
                setProgress(data.percent);
                setStatusMessage(data.status);
              } else if (data.type === "success") {
                setProgress(100);
                setResult(data.result);
                setState("success");
                toast.success(`"${data.result.filename}" indexed — ${data.result.num_chunks} chunks`);
                setTimeout(() => onUploadSuccess(data.result), 1200);
                return;
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Failed to parse SSE line", dataStr);
            }
          }
        }
      }
    } catch (err: any) {
      setProgress(0);
      const msg = err.message || "Unexpected error";
      setErrorMsg(msg);
      setState("error");
      toast.error(msg);
    }
  };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validate(file)) await upload(file);
  }, []);

  const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validate(file)) await upload(file);
    e.target.value = "";
  }, []);

  const reset = () => {
    setState("idle");
    setProgress(0);
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-100">
        <h2 className="text-[14px] font-semibold text-zinc-800">Add Document</h2>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          PDF, DOCX, or TXT · max 10 MB per file
        </p>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className={`relative flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
                  isDragging
                    ? "bg-blue-50 border-blue-400 scale-[1.01]"
                    : "bg-zinc-50 border-zinc-200 hover:border-blue-300 hover:bg-blue-50/20"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  id="fu-input"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={onFileSelect}
                />
                <label
                  htmlFor="fu-input"
                  className="absolute inset-0 cursor-pointer rounded-2xl"
                />

                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className={`p-3.5 rounded-2xl border mb-4 transition-colors ${
                    isDragging
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-zinc-200"
                  }`}
                >
                  <UploadCloud
                    className={`w-8 h-8 transition-colors ${
                      isDragging ? "text-blue-500" : "text-zinc-400"
                    }`}
                  />
                </motion.div>

                <p className="text-[13px] font-semibold text-zinc-700 mb-1">
                  {isDragging ? "Release to upload" : "Drop file here"}
                </p>
                <p className="text-[12px] text-zinc-400 mb-4">
                  or{" "}
                  <span className="text-blue-600 font-medium underline underline-offset-2">
                    browse
                  </span>{" "}
                  to select
                </p>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {FILE_TYPE_LABELS.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-semibold text-zinc-500 bg-white border border-zinc-200 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-white border border-zinc-200 rounded-full">
                    Max 10 MB
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── UPLOADING ── */}
          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10 gap-5"
            >
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-[3px] border-zinc-100" />
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-[13px] font-semibold text-zinc-800">Processing…</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[260px] min-h-[16px] leading-tight">
                  {statusMessage}
                </p>
              </div>

              <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[11px] text-zinc-400">{progress}%</p>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {state === "success" && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.35 }}
              className="flex flex-col items-center py-10 gap-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </motion.div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-800">Document ready</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px]">
                  <span className="font-medium text-zinc-700 break-all">
                    {result.filename}
                  </span>
                  {" "}— {result.num_pages} page
                  {result.num_pages !== 1 ? "s" : ""},{" "}
                  {result.num_chunks} chunks indexed
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-500" />
                <p className="text-[10px] text-zinc-400">Added to knowledge base</p>
              </div>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-10 gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-800">Upload failed</p>
                <p className="text-[11px] text-red-500 mt-1 max-w-[240px]">{errorMsg}</p>
              </div>
              <button
                onClick={reset}
                className="text-[12px] font-semibold text-blue-600 hover:underline underline-offset-2 transition-colors"
              >
                Try again →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
