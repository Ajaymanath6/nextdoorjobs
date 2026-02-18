"use client";

import { useState } from "react";
import { Document } from "@carbon/icons-react";

function truncateText(text, maxWords = 30) {
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

export default function JobDetailCard({ job, company }) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const description = showFullDescription 
    ? job.jobDescription 
    : truncateText(job.jobDescription, 30);

  const needsTruncation = job.jobDescription && job.jobDescription.split(" ").length > 30;

  return (
    <div className="border border-brand-stroke-weak rounded-lg p-4 bg-brand-bg-white space-y-3">
      {/* Header: Icon + Title + Seniority + Time */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-bg-fill flex items-center justify-center shrink-0">
          <Document size={20} className="text-brand-stroke-strong" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-brand-text-strong truncate">
            {job.title}
          </h3>
          {job.seniorityLevel && (
            <p className="text-sm text-brand-text-weak">
              {job.seniorityLevel}
            </p>
          )}
        </div>
        <span className="text-xs text-brand-text-weak shrink-0">
          {getTimeAgo(job.createdAt)}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-brand-stroke-weak" />

      {/* Job Description */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Document size={16} className="text-brand-stroke-strong shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-text-strong whitespace-pre-wrap">
              {description}
            </p>
            {!showFullDescription && needsTruncation && (
              <button
                onClick={() => setShowFullDescription(true)}
                className="text-sm text-brand underline mt-1"
              >
                more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="space-y-2 text-sm">
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
    </div>
  );
}
