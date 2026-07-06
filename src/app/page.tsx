"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, FileText, Zap, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (heroRef.current) {
      gsap.from(Array.from(heroRef.current.children), {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.05,
      });
    }

    gsap.utils.toArray<Element>(".feat-card").forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
        y: 24,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        delay: i * 0.12,
      });
    });
  }, { scope: rootRef });

  return (
    <main
      ref={rootRef}
      className="flex min-h-screen flex-col items-center bg-zinc-50 text-zinc-900 overflow-x-hidden"
    >
      {/* ── Hero ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[88vh] text-center px-4 w-full max-w-4xl mx-auto">
        <div ref={heroRef} className="flex flex-col items-center gap-0">

          {/* Label chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-zinc-600 tracking-wide">
              Document based AI assistant
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 leading-[1.05] mb-6">
            Chat with your
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                documents
              </span>
              <svg
                className="absolute -bottom-1.5 left-0 w-full"
                height="6"
                viewBox="0 0 200 6"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 4 Q50 0 100 3 Q150 6 200 2"
                  stroke="url(#eg)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-[15px] md:text-lg text-zinc-500 max-w-xl mb-10 leading-relaxed font-medium">
            Upload PDFs and text files, then ask questions in plain language.
            Every answer includes{" "}
            <span className="text-zinc-800 font-semibold">exact source citations</span>.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/app">
              <Button
                size="lg"
                className="h-12 px-7 text-[14px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px transition-all duration-200 border-0"
              >
                Open App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-400 animate-bounce">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* ── Features ── */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-20 pb-40">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-3">
            How it works
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
            Three steps to cited answers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: FileText,
              step: "01",
              title: "Upload documents",
              body: "Drag and drop PDFs or TXT files. Each file is chunked, embedded, and indexed for retrieval.",
            },
            {
              icon: Search,
              step: "02",
              title: "Ask a question",
              body: "Type naturally. The system retrieves the most relevant passages from your knowledge base.",
            },
            {
              icon: Zap,
              step: "03",
              title: "Get cited answers",
              body: "The LLM answers grounded strictly in your documents — every claim is numbered and clickable.",
            },
          ].map(({ icon: Icon, step, title, body }) => (
            <div
              key={step}
              className="feat-card group flex flex-col p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors duration-250">
                  <Icon className="w-5 h-5 text-zinc-500 group-hover:text-blue-600 transition-colors duration-250" />
                </div>
                <span className="text-[11px] font-bold text-zinc-300 tracking-widest">{step}</span>
              </div>
              <h3 className="text-[14px] font-semibold text-zinc-800 mb-2">{title}</h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <Link href="/app">
            <Button
              size="lg"
              className="h-11 px-7 text-[13px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-sm hover:-translate-y-px transition-all duration-200"
            >
              Get started →
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
