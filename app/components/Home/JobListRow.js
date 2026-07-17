"use client";

import Image from "next/image";
import { Buildings } from "@phosphor-icons/react";

function getTimeAgo(dateString) {
  if (!dateString) return "";
  const now = Date.now();
  const posted = new Date(dateString).getTime();
  if (!Number.isFinite(posted)) return "";
  const diffMs = Math.max(0, now - posted);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function formatSalary(job) {
  if (!job?.salaryMin && !job?.salaryMax) return null;
  if (job.salaryMin && job.salaryMax) return `₹${job.salaryMin}L – ₹${job.salaryMax}L`;
  if (job.salaryMin) return `₹${job.salaryMin}L+`;
  return `Up to ₹${job.salaryMax}L`;
}

/**
 * Full-width list row for Home All jobs (not a card).
 */
export default function JobListRow({
  job,
  company,
  onMarkApplied,
  hasApplied = false,
}) {
  const companyData = company || job?.company;
  const companyName = companyData?.name;
  const logoUrl = companyData?.logoPath || companyData?.logoUrl || null;
  const location = [companyData?.district, companyData?.state].filter(Boolean).join(", ");
  const salary = formatSalary(job);
  const details = [
    companyName,
    job?.remoteType,
    job?.yearsRequired != null ? `${job.yearsRequired} yrs` : null,
    salary,
    location || null,
  ].filter(Boolean);

  const applied = hasApplied || job?.hasApplied;

  return (
    <li className="list-none border-b border-brand-stroke-weak last:border-b-0">
      <div className="flex items-center gap-4 py-4 px-1 md:px-2 hover:bg-brand-bg-fill/60 transition-colors">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-stroke-weak bg-brand-bg-fill">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={companyName ? `${companyName} logo` : "Company logo"}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Buildings size={28} className="text-brand-stroke-strong" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-brand-text-strong truncate">
            {job?.title || "Untitled role"}
          </h3>
          {details.length > 0 && (
            <p className="mt-1 text-sm text-brand-text-weak truncate">
              {details.join(" · ")}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-xs text-brand-text-weak whitespace-nowrap">
            {getTimeAgo(job?.createdAt)}
          </span>
          {applied ? (
            <span className="text-xs font-medium text-brand px-2 py-1 rounded-md bg-brand/10">
              Applied
            </span>
          ) : onMarkApplied ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkApplied(job);
              }}
              className="text-xs font-medium text-brand-text-weak hover:text-brand underline"
            >
              Mark as applied
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
