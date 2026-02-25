"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Close } from "@carbon/icons-react";
import themeClasses from "../theme-utility-classes.json";

export default function EditJobModal({ isOpen, onClose, job, onSaved, jobApiPrefix = "/api/jobs" }) {
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [assistRelocation, setAssistRelocation] = useState(false);
  const [seniorityLevel, setSeniorityLevel] = useState("");
  const [yearsRequired, setYearsRequired] = useState(0);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [perks, setPerks] = useState([]);
  const [holidays, setHolidays] = useState("");
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState("");
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const brand = themeClasses.brand;
  const inputClasses = "w-full px-3 py-2 rounded-lg border border-brand-stroke-weak text-sm text-brand-text-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

  useEffect(() => {
    if (job && isOpen) {
      setTitle(job.title || "");
      setJobDescription(job.jobDescription || "");
      setRemoteType(job.remoteType || "");
      setAssistRelocation(job.assistRelocation || false);
      setSeniorityLevel(job.seniorityLevel || "");
      setYearsRequired(job.yearsRequired || 0);
      setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : "");
      setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : "");
      setTeamSize(job.teamSize || "");
      setPerks(job.perks || []);
      setHolidays(job.holidays || "");
      setCompanyWebsiteUrl(job.company?.websiteUrl || "");
      setCompanyLogoFile(null);
      setError(null);
    }
  }, [job, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Job title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${jobApiPrefix}/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          jobDescription: jobDescription.trim(),
          remoteType: remoteType || null,
          assistRelocation,
          seniorityLevel: seniorityLevel || null,
          yearsRequired: parseFloat(yearsRequired) || 0,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
          salaryMax: salaryMax ? parseInt(salaryMax) : null,
          teamSize: teamSize || null,
          perks,
          holidays: holidays.trim() || null,
        }),
        credentials: "same-origin",
      });

      if (res.ok) {
        const data = await res.json();
        const updatedJob = data.job;
        if (job.company?.id) {
          const websiteChanged = (companyWebsiteUrl || "").trim() !== (job.company?.websiteUrl || "").trim();
          const hasLogoFile = companyLogoFile && companyLogoFile instanceof File && companyLogoFile.size > 0;
          if (websiteChanged || hasLogoFile) {
            const formData = new FormData();
            if (websiteChanged) formData.append("websiteUrl", (companyWebsiteUrl || "").trim());
            if (hasLogoFile) formData.append("logo", companyLogoFile);
            const companyRes = await fetch(`/api/onboarding/company/${job.company.id}`, {
              method: "PATCH",
              body: formData,
              credentials: "same-origin",
            });
            if (companyRes.ok && !hasLogoFile && websiteChanged && (companyWebsiteUrl || "").trim()) {
              try {
                const logoRes = await fetch(`/api/onboarding/fetch-logo?url=${encodeURIComponent((companyWebsiteUrl || "").trim())}`);
                if (logoRes.ok) {
                  const logoData = await logoRes.json();
                  if (logoData.success && logoData.logoUrl) {
                    const logoForm = new FormData();
                    logoForm.append("logoPath", logoData.logoUrl);
                    await fetch(`/api/onboarding/company/${job.company.id}`, {
                      method: "PATCH",
                      body: logoForm,
                      credentials: "same-origin",
                    });
                  }
                }
              } catch (_) {}
            }
          }
        }
        if (onSaved) onSaved(updatedJob);
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to update job");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div 
        className="fixed left-1/2 top-1/2 z-[1002] flex h-[85vh] max-h-[85vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-brand-stroke-border bg-brand-bg-white p-6 shadow-lg"
        style={{ fontFamily: "Open Sans, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-stroke-weak pb-4">
          <h2 className={`text-xl font-semibold ${brand.text.strong}`}>
            Edit Job Posting
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-brand-bg-fill transition-colors"
            aria-label="Close"
          >
            <Close size={24} className="text-brand-stroke-strong" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Company (when job has company) */}
          {job?.company && (
            <div className="rounded-lg border border-brand-stroke-weak bg-brand-bg-fill/50 p-4 space-y-3">
              <p className={`text-sm font-medium ${brand.text.strong}`}>Company</p>
              <div>
                <label className={`block text-xs font-medium ${brand.text.weak} mb-1`}>Company name</label>
                <p className={`text-sm ${brand.text.strong}`}>{job.company.name || "—"}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>Company website</label>
                <input
                  type="url"
                  value={companyWebsiteUrl}
                  onChange={(e) => setCompanyWebsiteUrl(e.target.value)}
                  className={inputClasses}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>Company logo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCompanyLogoFile(e.target.files?.[0] ?? null)}
                  className={inputClasses}
                />
                {companyLogoFile && (
                  <p className={`text-xs ${brand.text.weak} mt-1`}>
                    {companyLogoFile.name} — will replace favicon/logo when you save
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Job Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              className={`${inputClasses} resize-none`}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          {/* Remote Type */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Work Type
            </label>
            <select
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select work type</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          {/* Seniority Level */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Seniority Level
            </label>
            <select
              value={seniorityLevel}
              onChange={(e) => setSeniorityLevel(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select seniority level</option>
              <option value="Internship">Internship</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior Level">Senior Level</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
              <option value="Director">Director</option>
              <option value="VP">VP</option>
              <option value="C-Level">C-Level</option>
            </select>
          </div>

          {/* Years of Experience */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Years of Experience Required
            </label>
            <input
              type="number"
              value={yearsRequired}
              onChange={(e) => setYearsRequired(e.target.value)}
              className={inputClasses}
              min="0"
              step="0.5"
            />
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
                Min Salary (Lakhs)
              </label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className={inputClasses}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
                Max Salary (Lakhs)
              </label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className={inputClasses}
                placeholder="e.g., 20"
              />
            </div>
          </div>

          {/* Team Size */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Team Size
            </label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select team size</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501-1000">501-1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>

          {/* Relocation Assistance */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="assistRelocation"
              checked={assistRelocation}
              onChange={(e) => setAssistRelocation(e.target.checked)}
              className="w-4 h-4 rounded border-brand-stroke-border text-brand focus:ring-2 focus:ring-brand"
            />
            <label htmlFor="assistRelocation" className={`text-sm ${brand.text.strong}`}>
              Assist with relocation
            </label>
          </div>

          {/* Holidays */}
          <div>
            <label className={`block text-sm font-medium ${brand.text.strong} mb-2`}>
              Holidays (Optional)
            </label>
            <input
              type="text"
              value={holidays}
              onChange={(e) => setHolidays(e.target.value)}
              className={inputClasses}
              placeholder="e.g., 25 days paid leave"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-brand-stroke-weak pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-brand-stroke-border text-sm font-medium text-brand-text-strong hover:bg-brand-bg-fill transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
