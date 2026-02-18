"use client";

import { Close } from "@carbon/icons-react";
import JobDetailCard from "./JobDetailCard";

export default function CompanyJobsSidebar({ company, jobs, isOpen, onClose }) {
  if (!isOpen || !company) return null;

  return (
    <div 
      className="fixed top-0 right-0 h-screen w-[400px] bg-brand-bg-white border-l border-brand-stroke-weak shadow-lg z-[1000] overflow-y-auto"
      style={{ 
        marginRight: isOpen ? "16px" : "-400px",
        transition: "margin-right 0.3s ease",
        fontFamily: "Open Sans, sans-serif"
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-brand-bg-white border-b border-brand-stroke-weak px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-text-strong">
          Recent Jobs
        </h2>
        <div className="flex items-center gap-4">
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
            <Close size={20} className="text-brand-stroke-strong" />
          </button>
        </div>
      </div>

      {/* Job Cards */}
      <div className="px-6 py-6 space-y-4">
        {jobs.length === 0 ? (
          <p className="text-sm text-brand-text-weak">No jobs posted yet.</p>
        ) : (
          jobs.map((job) => (
            <JobDetailCard key={job.id} job={job} company={company} />
          ))
        )}
      </div>
    </div>
  );
}
