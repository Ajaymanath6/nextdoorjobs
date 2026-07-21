"use client";

import { X } from "@phosphor-icons/react";
import JobDetailCard from "./JobDetailCard";
import { useConfirmApplied } from "../hooks/useConfirmApplied";
import { useState, useCallback, useEffect } from "react";

const ABOUT_COMPANY_TEXT = `UniCourt is a leader in making court data more accessible and useful with our Legal Data as a Service (LDaaS). We provide real-time access to court data through our APIs and online app for business development and intelligence, litigation analytics, litigation tracking, case research, investigations, background checks, due diligence, compliance, underwriting, machine learning models, and process automation.

We provide access to court data from state and federal courts to a diverse list of clients, including Fortune 500 companies and AmLaw firms and industries such as legal, insurance, finance, investigations, government, education, nonprofits, and consumers.

UniCourt is a legal technology company focused on using technology to unlock the potential of legal data. We are based in both California and Mangalore, India and our team includes legal professionals, data scientists, physicists, computer engineers, and sales and marketing, professionals.`;

export default function CompanyJobsSidebar({ company, jobs, isOpen, onClose, onApplied, onSaved }) {
  const [appliedIds, setAppliedIds] = useState(() => new Set());
  const [savedIds, setSavedIds] = useState(() => new Set());

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/job-saves", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success || !Array.isArray(data.jobs)) return;
        setSavedIds(new Set(data.jobs.map((j) => j.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleApplied = useCallback(
    (job) => {
      if (job?.id != null) {
        setAppliedIds((prev) => new Set(prev).add(job.id));
      }
      onApplied?.(job);
    },
    [onApplied]
  );

  const handleSave = useCallback(
    async (job, shouldSave) => {
      if (job?.id == null) return;
      const method = shouldSave ? "POST" : "DELETE";
      try {
        const res = await fetch("/api/job-saves", {
          method,
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: job.id }),
        });
        if (!res.ok) return;
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (shouldSave) next.add(job.id);
          else next.delete(job.id);
          return next;
        });
        onSaved?.(job, shouldSave);
      } catch {
        // ignore
      }
    },
    [onSaved]
  );

  const { startApply, modal } = useConfirmApplied({ onApplied: handleApplied });

  if (!isOpen || !company) return null;

  const companyName = company.company_name || company.name || "Company";
  const logoUrl = company.logoPath || company.logoUrl || null;
  const positionsCount = jobs.length;
  const positionsLabel = positionsCount === 1 ? "1 position" : `${positionsCount} positions`;
  const aboutText = company.description ?? ABOUT_COMPANY_TEXT;
  const showAbout = aboutText.trim().length > 0;

  return (
    <>
      <div
        className="absolute inset-y-0 right-0 h-full w-[min(400px,100%)] bg-brand-bg-white border-l border-brand-stroke-weak shadow-lg z-[2000] flex flex-col"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        {/* Header: logo + company name + close */}
        <div className="shrink-0 bg-brand-bg-white border-b border-brand-stroke-weak px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-bg-fill flex items-center justify-center shrink-0 overflow-hidden border border-brand-stroke-weak">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand text-sm font-semibold">
                    {(companyName || "C").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-brand-text-strong truncate">
                {companyName}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose}
                className="text-sm text-brand-text-weak hover:text-brand-text-strong underline"
                style={{ textDecorationStyle: "dotted" }}
              >
                View all
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-brand-bg-fill rounded-md transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-brand-stroke-strong" />
              </button>
            </div>
          </div>
          {/* Two badges: first white, second light primary */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-brand-stroke-weak text-brand-text-strong">
              Company
            </span>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-brand border-0"
              style={{ background: "var(--brand-primary-light)" }}
            >
              {positionsLabel}
            </span>
          </div>
        </div>

        {/* About the company - max 4 lines; hide if no description */}
        {showAbout && (
          <div className="shrink-0 px-6 py-3 border-b border-brand-stroke-weak">
            <p className="text-xs font-medium text-brand-text-weak mb-1.5">About the company</p>
            <p className="text-[12px] leading-relaxed text-brand-text-weak whitespace-pre-line line-clamp-4 overflow-hidden break-words">
              {aboutText}
            </p>
          </div>
        )}

        {/* Scrollable job cards - minimal scrollbar */}
        <div className="flex-1 min-h-0 overflow-y-auto company-jobs-sidebar-scroll px-6 py-4">
          <p className="text-sm font-medium text-brand-text-weak mb-3">Recent postings</p>
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-brand-text-weak">No jobs posted yet.</p>
            ) : (
              jobs.map((job) => (
                <JobDetailCard
                  key={job.id}
                  job={job}
                  company={company}
                  hasApplied={appliedIds.has(job.id) || job.hasApplied}
                  hasSaved={savedIds.has(job.id) || job.hasSaved}
                  onApply={(j) =>
                    startApply(
                      { ...j, company: j.company || company },
                      { openUrl: true }
                    )
                  }
                  onMarkApplied={(j) =>
                    startApply(
                      { ...j, company: j.company || company },
                      { openUrl: false }
                    )
                  }
                  onSave={handleSave}
                />
              ))
            )}
          </div>
        </div>
      </div>
      {modal}
    </>
  );
}
