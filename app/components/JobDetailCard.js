"use client";

import { useState } from "react";
import { FileText } from "@phosphor-icons/react";

function truncateText(text, maxWords = 15) {
  if (!text) return "";
  const words = text.split(" ");
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

function getTimeAgo(dateString) {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export default function JobDetailCard({
  job,
  company,
  onApply,
  onMarkApplied,
  onSave,
  hasApplied = false,
  hasSaved = false,
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const description = showFullDescription
    ? job.jobDescription
    : truncateText(job.jobDescription, 12);

  const needsTruncation = job.jobDescription && job.jobDescription.split(" ").length > 12;
  const applied = hasApplied || job?.hasApplied;
  const saved = hasSaved || job?.hasSaved;

  return (
    <div className="border border-brand-stroke-weak rounded-lg p-2.5 bg-brand-bg-white space-y-1.5 flex flex-col">
      {/* Header: Icon + Title + Seniority + Time - compact */}
      <div className="flex items-start gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-brand-bg-fill flex items-center justify-center shrink-0">
          <FileText size={16} className="text-brand-stroke-strong" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-brand-text-strong truncate">
            {job.title}
          </h3>
          {job.seniorityLevel && (
            <p className="text-xs text-brand-text-weak">
              {job.seniorityLevel}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {saved && (
              <span className="text-[10px] font-medium text-brand px-1.5 py-0.5 rounded bg-brand/10">
                Saved
              </span>
            )}
            {applied && (
              <span className="text-[10px] font-medium text-brand px-1.5 py-0.5 rounded bg-brand/10">
                Applied
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-brand-text-weak shrink-0">
          {getTimeAgo(job.createdAt)}
        </span>
      </div>

      <div className="border-t border-brand-stroke-weak shrink-0" />

      {/* Job Description: collapsed = 2-line clamp, no overflow; expanded = full content, card grows */}
      <div className={`space-y-0.5 flex flex-col ${showFullDescription ? "" : "min-h-0"}`}>
        <div className="flex items-start gap-1.5 min-w-0">
          <FileText size={14} className="text-brand-stroke-strong shrink-0 mt-0.5" />
          <div className={`flex-1 min-w-0 ${showFullDescription ? "" : "overflow-hidden"}`}>
            <p className={`text-xs text-brand-text-strong ${showFullDescription ? "whitespace-pre-wrap" : "line-clamp-2 overflow-hidden"}`}>
              {description}
            </p>
            {needsTruncation && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs text-brand underline mt-0.5 shrink-0"
              >
                {showFullDescription ? "See less" : "See more"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Grid - compact */}
      <div className="space-y-1 text-xs shrink-0">
        {job.remoteType && (
          <div className="flex justify-between">
            <span className="text-brand-text-weak">Work Type</span>
            <span className="text-brand-text-strong">{job.remoteType}</span>
          </div>
        )}
        {job.yearsRequired != null && (
          <div className="flex justify-between">
            <span className="text-brand-text-weak">Experience</span>
            <span className="text-brand-text-strong">{job.yearsRequired} years</span>
          </div>
        )}
        {(job.salaryMin || job.salaryMax) && (
          <div className="flex justify-between">
            <span className="text-brand-text-weak">Salary</span>
            <span className="text-brand-text-strong">
              {job.salaryMin && job.salaryMax 
                ? `₹${job.salaryMin}L - ₹${job.salaryMax}L`
                : job.salaryMin 
                ? `₹${job.salaryMin}L+`
                : `Up to ₹${job.salaryMax}L`}
            </span>
          </div>
        )}
        {job.teamSize && (
          <div className="flex justify-between">
            <span className="text-brand-text-weak">Team Size</span>
            <span className="text-brand-text-strong">{job.teamSize}</span>
          </div>
        )}
        {job.assistRelocation != null && (
          <div className="flex justify-between">
            <span className="text-brand-text-weak">Relocation</span>
            <span className="text-brand-text-strong">
              {job.assistRelocation ? "Yes" : "No"}
            </span>
          </div>
        )}
      </div>

      {/* Apply / Save / mark applied */}
      <div className="pt-1.5 shrink-0 space-y-1.5">
        {applied ? (
          <div className="w-full py-2 rounded-md text-sm font-medium text-center text-brand bg-brand/10">
            Applied
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApply?.(job)}
              className="flex-1 py-2 rounded-md text-sm font-medium text-brand border-0 transition-opacity hover:opacity-90"
              style={{ background: "var(--brand-primary-light)" }}
            >
              Apply
            </button>
            {onSave && (
              <button
                type="button"
                onClick={() => onSave(job, !saved)}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  saved
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill"
                }`}
              >
                {saved ? "Saved" : "Save"}
              </button>
            )}
          </div>
        )}
        {!applied && onMarkApplied && (
          <button
            type="button"
            onClick={() => onMarkApplied(job)}
            className="w-full text-xs font-medium text-brand-text-weak hover:text-brand underline"
          >
            Mark as applied
          </button>
        )}
        {applied && onSave && (
          <button
            type="button"
            onClick={() => onSave(job, !saved)}
            className={`w-full py-2 rounded-md text-sm font-medium border transition-colors ${
              saved
                ? "border-brand bg-brand/10 text-brand"
                : "border-brand-stroke-weak text-brand-text-strong hover:bg-brand-bg-fill"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}

