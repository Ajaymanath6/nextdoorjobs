"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import JobListRow from "../components/Home/JobListRow";
import { useConfirmApplied } from "../hooks/useConfirmApplied";

const TABS = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
];

function SavedJobsContent() {
  const [activeTab, setActiveTab] = useState("saved");
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [appliedLoading, setAppliedLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [appliedIds, setAppliedIds] = useState(() => new Set());

  const fetchSavedJobs = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/job-saves", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setSavedJobs([]);
        return;
      }
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      setSavedJobs(list);
      setSavedIds(new Set(list.map((j) => j.id)));
    } catch {
      setSavedJobs([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const fetchAppliedJobs = useCallback(async () => {
    setAppliedLoading(true);
    try {
      const res = await fetch("/api/job-applications", {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setAppliedJobs([]);
        return;
      }
      const list = Array.isArray(data.jobs) ? data.jobs : [];
      setAppliedJobs(list);
      setAppliedIds(new Set(list.map((j) => j.id)));
    } catch {
      setAppliedJobs([]);
    } finally {
      setAppliedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
    fetchAppliedJobs();
  }, [fetchSavedJobs, fetchAppliedJobs]);

  const handleJobSave = useCallback(async (job, shouldSave) => {
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
      setSavedJobs((prev) => {
        if (shouldSave) {
          if (prev.some((j) => j.id === job.id)) return prev;
          return [
            { ...job, hasSaved: true, savedAt: new Date().toISOString() },
            ...prev,
          ];
        }
        return prev.filter((j) => j.id !== job.id);
      });
      setAppliedJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, hasSaved: shouldSave } : j))
      );
    } catch {
      // ignore
    }
  }, []);

  const handleJobApplied = useCallback((job) => {
    if (job?.id == null) return;
    setAppliedIds((prev) => new Set(prev).add(job.id));
    setAppliedJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev;
      return [
        { ...job, hasApplied: true, appliedAt: new Date().toISOString() },
        ...prev,
      ];
    });
    setSavedJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, hasApplied: true } : j))
    );
    setActiveTab("applied");
  }, []);

  const { startApply, modal } = useConfirmApplied({
    onApplied: handleJobApplied,
  });

  const tabCounts = {
    saved: savedJobs.length,
    applied: appliedJobs.length,
  };

  const isLoading = activeTab === "saved" ? savedLoading : appliedLoading;
  const list = activeTab === "saved" ? savedJobs : appliedJobs;
  const emptyCopy =
    activeTab === "saved" ? "No saved jobs yet" : "No applied jobs yet";

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col bg-white overflow-hidden"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <div className="shrink-0 px-6 md:px-12 pt-8 pb-3 space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-brand-text-strong">
            Saved jobs
          </h1>
          <p className="text-sm text-brand-text-weak mt-0.5">
            Jobs you saved and applied to
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-brand-text-weak hover:text-brand-text-strong"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 tabular-nums ${
                    isActive ? "text-brand" : "text-brand-text-placeholder"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-b border-brand-stroke-weak" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-12">
        {isLoading ? (
          <ul className="divide-y divide-brand-stroke-weak">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-3.5">
                <div className="h-4 w-2/3 rounded bg-brand-bg-fill animate-pulse" />
                <div className="mt-2 h-3 w-1/3 rounded bg-brand-bg-fill animate-pulse" />
              </li>
            ))}
          </ul>
        ) : list.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <p className="text-sm text-brand-text-weak">{emptyCopy}</p>
          </div>
        ) : (
          <ul className="w-full">
            {list.map((job) => (
              <JobListRow
                key={job.id}
                job={job}
                company={job.company}
                hasSaved={savedIds.has(job.id) || job.hasSaved}
                hasApplied={appliedIds.has(job.id) || job.hasApplied}
                onSave={handleJobSave}
                onMarkApplied={
                  activeTab === "saved"
                    ? (j) => startApply(j, { openUrl: false })
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </div>
      {modal}
    </div>
  );
}

export default function MyJobsPage() {
  return (
    <AppShell activeItem="manage-jds">
      <SavedJobsContent />
    </AppShell>
  );
}
