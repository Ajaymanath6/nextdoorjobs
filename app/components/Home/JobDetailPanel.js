"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Buildings,
  ShareNetwork,
  BookmarkSimple,
} from "@phosphor-icons/react";

function formatSalary(job) {
  if (!job?.salaryMin && !job?.salaryMax) return null;
  if (job.salaryMin && job.salaryMax) return `₹${job.salaryMin}L – ₹${job.salaryMax}L`;
  if (job.salaryMin) return `₹${job.salaryMin}L+`;
  return `Up to ₹${job.salaryMax}L`;
}

function getSkills(job) {
  if (Array.isArray(job?.skills) && job.skills.length > 0) return job.skills;
  if (Array.isArray(job?.mustHaveSkills) && job.mustHaveSkills.length > 0) {
    return job.mustHaveSkills;
  }
  return [];
}

export default function JobDetailPanel({
  job,
  hasSaved = false,
  hasApplied = false,
  onBack,
  onSave,
  onApply,
}) {
  const [shareLabel, setShareLabel] = useState("Share");

  const company = job?.company || {};
  const companyName = company.name || "Company";
  const logoUrl = company.logoPath || company.logoUrl || null;
  const location = [company.district, company.state].filter(Boolean).join(", ");
  const experience =
    job?.yearsRequired != null ? `${job.yearsRequired} years` : null;
  const salary = formatSalary(job);
  const skills = getSkills(job);
  const applied = hasApplied || job?.hasApplied;
  const saved = hasSaved || job?.hasSaved;
  const perks = Array.isArray(job?.perks) ? job.perks.filter(Boolean) : [];

  const detailRows = [
    job?.remoteType ? { label: "Work type", value: job.remoteType } : null,
    job?.employmentType
      ? { label: "Employment", value: job.employmentType }
      : null,
    experience ? { label: "Experience", value: experience } : null,
    salary ? { label: "Salary", value: salary } : null,
    job?.seniorityLevel
      ? { label: "Seniority", value: job.seniorityLevel }
      : null,
    job?.teamSize ? { label: "Team size", value: job.teamSize } : null,
    job?.assistRelocation != null
      ? {
          label: "Relocation",
          value: job.assistRelocation ? "Yes" : "No",
        }
      : null,
  ].filter(Boolean);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/?jobId=${job?.id ?? ""}`
        : "";
    const title = job?.title || "Job on mapmyGig";
    const text = `${title} at ${companyName}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareLabel("Copied");
        setTimeout(() => setShareLabel("Share"), 1500);
      }
    } catch {
      // user cancelled share or clipboard failed
    }
  };

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col bg-white"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      {/* Header: Back left | Share + Save right */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-[200px] pt-6 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-text-strong hover:text-brand transition-colors px-2 py-2 rounded-md hover:bg-brand-bg-fill"
          aria-label="Back to jobs list"
        >
          <ArrowLeft size={20} className="shrink-0" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium text-brand-text-strong border border-brand-stroke-weak hover:bg-brand-bg-fill transition-colors"
            aria-label="Share job"
            title="Share"
          >
            <ShareNetwork size={18} className="shrink-0" />
            <span className="hidden sm:inline">{shareLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => onSave?.(job, !saved)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium border border-brand-stroke-weak transition-colors ${
              saved
                ? "text-brand bg-brand/10"
                : "text-brand-text-strong hover:bg-brand-bg-fill"
            }`}
            aria-label={saved ? "Unsave job" : "Save job"}
            title={saved ? "Saved" : "Save"}
          >
            <BookmarkSimple
              size={18}
              weight={saved ? "fill" : "regular"}
              className="shrink-0"
            />
            <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="border-b border-brand-stroke-weak shrink-0" />

      <div className="flex-1 min-h-0 overflow-y-auto px-[200px] py-6 space-y-6">
        {/* Apply below header */}
        <div className="flex justify-end">
          {applied ? (
            <span className="px-4 py-2 rounded-md text-sm font-medium text-brand bg-brand/10">
              Applied
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onApply?.(job)}
              className="px-4 py-2 rounded-md text-sm font-medium text-brand border-0 transition-opacity hover:opacity-90"
              style={{ background: "var(--brand-primary-light)" }}
            >
              Apply
            </button>
          )}
        </div>

        {/* Company strip: logo + name only */}
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-stroke-weak bg-brand-bg-fill">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${companyName} logo`}
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
            <p className="text-base font-semibold text-brand-text-strong truncate">
              {companyName}
            </p>
            <p className="text-xs font-medium text-brand-text-weak mt-0.5">Jobs</p>
          </div>
        </div>

        {/* Role + meta */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-semibold text-brand-text-strong">
            {job?.title || "Untitled role"}
          </h1>
          <p className="text-sm text-brand-text-weak">{companyName}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-brand-text-weak">
            {location ? <span>{location}</span> : null}
            {location && experience ? (
              <span className="text-brand-stroke-weak" aria-hidden>
                ·
              </span>
            ) : null}
            {experience ? <span>{experience} experience</span> : null}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-text-strong">
              Must-have skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-bg-fill text-brand-text-strong border border-brand-stroke-weak"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {job?.jobDescription ? (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-text-strong">
              About the opportunity
            </h2>
            <p className="text-sm text-brand-text-strong whitespace-pre-wrap leading-relaxed">
              {job.jobDescription}
            </p>
          </div>
        ) : null}

        {(detailRows.length > 0 || perks.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-text-strong">Details</h2>
            <div className="space-y-2">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 text-sm"
                >
                  <span className="text-brand-text-weak shrink-0">{row.label}</span>
                  <span className="text-brand-text-strong text-right">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {perks.length > 0 && (
              <div className="pt-1">
                <p className="text-sm text-brand-text-weak mb-2">Perks</p>
                <div className="flex flex-wrap gap-2">
                  {perks.map((perk) => (
                    <span
                      key={perk}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-bg-fill text-brand-text-strong border border-brand-stroke-weak"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
