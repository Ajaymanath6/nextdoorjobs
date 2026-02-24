"use client";

import { Close } from "@carbon/icons-react";
import JobDetailCard from "./JobDetailCard";

export default function CompanyJobsSidebar({ company, jobs, isOpen, onClose }) {
  if (!isOpen || !company) return null;

  const companyName = company.company_name || company.name || "Company";
  const logoUrl = company.logoPath || company.logoUrl || null;

  return (
    <div 
      className="fixed top-0 right-0 h-screen w-[400px] bg-brand-bg-white border-l border-brand-stroke-weak shadow-lg z-[2000] overflow-y-auto"
      style={{ 
        marginRight: isOpen ? "0" : "-400px",
        transition: "margin-right 0.3s ease",
        fontFamily: "Open Sans, sans-serif"
      }}
    >
      {/* Header: logo + company name */}
      <div className="sticky top-0 bg-brand-bg-white border-b border-brand-stroke-weak px-6 py-4 flex items-center justify-between gap-3">
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
            <Close size={20} className="text-brand-stroke-strong" />
          </button>
        </div>
      </div>

      {/* Label + Job Cards */}
      <div className="px-6 py-4">
        <p className="text-sm font-medium text-brand-text-weak mb-3">Recent postings</p>
        <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="text-sm text-brand-text-weak">No jobs posted yet.</p>
        ) : (
          jobs.map((job) => (
            <JobDetailCard key={job.id} job={job} company={company} />
          ))
        )}
        </div>
      </div>
    </div>
  );
}
