"use client";

/**
 * Asks the user to confirm they submitted an external application.
 * Only "Yes, I applied" should trigger persistence.
 */
export default function ConfirmAppliedModal({
  isOpen,
  jobTitle,
  companyName,
  submitting = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const title = jobTitle?.trim() || "this job";
  const company = companyName?.trim() || null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[3000] bg-black/30 border-0 cursor-default"
        aria-label="Close"
        onClick={onCancel}
        disabled={submitting}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-applied-title"
        aria-describedby="confirm-applied-desc"
        className="fixed left-1/2 top-1/2 z-[3001] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-brand-stroke-weak bg-brand-bg-white p-5 shadow-xl"
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        <h2
          id="confirm-applied-title"
          className="text-base font-semibold text-brand-text-strong"
        >
          Did you submit your application?
        </h2>
        <p
          id="confirm-applied-desc"
          className="mt-2 text-sm text-brand-text-weak"
        >
          Confirm only if you applied for{" "}
          <span className="font-medium text-brand-text-strong">{title}</span>
          {company ? (
            <>
              {" "}
              at <span className="font-medium text-brand-text-strong">{company}</span>
            </>
          ) : null}
          . We&apos;ll add it to your Applied list.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-md border border-brand-stroke-weak text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill transition-colors disabled:opacity-50"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Yes, I applied"}
          </button>
        </div>
      </div>
    </>
  );
}
