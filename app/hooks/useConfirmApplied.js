"use client";

import { useState, useCallback } from "react";
import ConfirmAppliedModal from "../components/ConfirmAppliedModal";

/**
 * Shared apply flow: optionally open application URL, then confirm before marking applied.
 */
export function useConfirmApplied({ onApplied } = {}) {
  const [pendingJob, setPendingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const startApply = useCallback((job, { openUrl = true } = {}) => {
    if (!job?.id) return;
    setError(null);
    if (openUrl && job.applicationUrl) {
      window.open(job.applicationUrl, "_blank", "noopener,noreferrer");
    }
    setPendingJob(job);
  }, []);

  const cancel = useCallback(() => {
    if (submitting) return;
    setPendingJob(null);
    setError(null);
  }, [submitting]);

  const confirm = useCallback(async () => {
    if (!pendingJob?.id || submitting) return;
    const job = pendingJob;
    setSubmitting(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (res.status === 401
              ? "Please sign in again to save this application"
              : "Failed to mark as applied")
        );
      }
      onApplied?.(job);
      setPendingJob(null);
      setError(null);
    } catch (e) {
      const message =
        e?.name === "AbortError"
          ? "Request timed out. Please try again."
          : e?.message || "Failed to mark as applied";
      setError(message);
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }, [pendingJob, submitting, onApplied]);

  const modal = (
    <ConfirmAppliedModal
      isOpen={Boolean(pendingJob)}
      jobTitle={pendingJob?.title}
      companyName={
        pendingJob?.company?.name ||
        pendingJob?.company?.company_name ||
        null
      }
      submitting={submitting}
      error={error}
      onConfirm={confirm}
      onCancel={cancel}
    />
  );

  return {
    startApply,
    cancel,
    confirm,
    pendingJob,
    submitting,
    error,
    modal,
  };
}
