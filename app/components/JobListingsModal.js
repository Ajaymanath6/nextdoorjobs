"use client";

import { useState } from "react";
import { Close, Edit, TrashCan, Time } from "@carbon/icons-react";
import LoadingSpinner from "./LoadingSpinner";

function getTimeAgo(dateString) {
  const now = new Date();
  const posted = new Date(dateString);
  const diffMs = now - posted;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function getExpiryDate(createdAt, extensionCount) {
  const created = new Date(createdAt);
  const weeksToAdd = 2 + (extensionCount * 2); // Initial 2 weeks + 2 weeks per extension
  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + (weeksToAdd * 7));
  
  const now = new Date();
  const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return "expired";
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "in 1 day";
  return `in ${daysLeft} days`;
}

export default function JobListingsModal({ isOpen, onClose, jobs = [], onEdit, onDelete, onExtend, isLoading = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-brand-bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "Open Sans, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-stroke-weak">
          <h2 className="text-lg font-semibold text-brand-text-strong">
            Your Job Postings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-bg-fill rounded-lg transition-colors"
            aria-label="Close"
          >
            <Close size={20} className="text-brand-stroke-strong" />
          </button>
        </div>

        {/* Job Cards - Full Width */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-brand-text-weak mb-2">
                No job postings yet.
              </p>
              <p className="text-xs text-brand-text-weak">
                Click &quot;Post your job&quot; to create your first job posting.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="w-full border border-brand-stroke-weak rounded-lg p-4 bg-brand-bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-brand-text-strong">
                      {job.title}
                    </h3>
                    <p className="text-sm text-brand-text-weak mt-1 line-clamp-2">
                      {job.jobDescription}
                    </p>
                    <p className="text-xs text-brand-text-weak mt-2">
                      Posted {getTimeAgo(job.createdAt)} • 
                      Expires {getExpiryDate(job.createdAt, job.extensionCount || 0)}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(job)}
                        className="p-2 hover:bg-brand-bg-fill rounded-lg transition-colors"
                        title="Edit job"
                        aria-label="Edit job"
                      >
                        <Edit size={20} className="text-brand-stroke-strong" />
                      </button>
                    )}
                    {onExtend && (
                      <button
                        onClick={() => onExtend(job)}
                        className="px-3 py-2 bg-brand text-brand-bg-white rounded-md hover:bg-brand-hover transition-colors text-sm font-medium"
                        title="Extend for 2 weeks"
                        aria-label="Extend for 2 weeks"
                      >
                        <Time size={16} className="inline mr-1" />
                        Extend
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(job)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete job"
                        aria-label="Delete job"
                      >
                        <TrashCan size={20} className="text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
