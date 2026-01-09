"use client";

import { JOB_CATEGORIES, FUNDING_SERIES } from "../../../lib/constants/jobCategories";

export default function ReviewStep({ companyData, jobData, onSubmit, onBack }) {
  // Add null checks to prevent errors
  if (!companyData || !jobData) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Missing required data. Please go back and complete all steps.</p>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (value) => {
    const category = JOB_CATEGORIES.find((cat) => cat.value === value);
    return category ? category.label : value;
  };

  const getFundingSeriesLabel = (value) => {
    const series = FUNDING_SERIES.find((s) => s.value === value);
    return series ? series.label : value || "Not specified";
  };

  const formatSalary = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Review Your Submission
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Please review all the information before submitting.
        </p>
      </div>

      {/* Company Information */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Company Information
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
            <p className="text-gray-900 dark:text-gray-100">{companyData?.name || "Not provided"}</p>
          </div>
          {companyData?.logoPreview && (
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Logo:</span>
              <div className="mt-2">
                <img
                  src={companyData.logoPreview}
                  alt="Company logo"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                />
              </div>
            </div>
          )}
          {companyData?.websiteUrl && (
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Website:</span>
              <p className="text-gray-900 dark:text-gray-100">
                <a
                  href={companyData.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F84416] hover:underline"
                >
                  {companyData.websiteUrl}
                </a>
              </p>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Funding Series:</span>
            <p className="text-gray-900 dark:text-gray-100">{getFundingSeriesLabel(companyData?.fundingSeries)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>
            <p className="text-gray-900 dark:text-gray-100">
              {companyData?.district || "Not provided"}, {companyData?.state || "Not provided"}
              {companyData?.pincode && ` - ${companyData.pincode}`}
            </p>
          </div>
          {(companyData?.latitude || companyData?.longitude) && (
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Coordinates:</span>
              <p className="text-gray-900 dark:text-gray-100">
                {companyData?.latitude || "N/A"}, {companyData?.longitude || "N/A"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job Position Information */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4" style={{ fontFamily: "Open Sans, sans-serif" }}>
          Job Position Information
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Title:</span>
            <p className="text-gray-900 dark:text-gray-100">{jobData?.title || "Not provided"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
            <p className="text-gray-900 dark:text-gray-100">{getCategoryLabel(jobData?.category)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Years Required:</span>
            <p className="text-gray-900 dark:text-gray-100">{jobData?.yearsRequired || 0} years</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Salary Range:</span>
            <p className="text-gray-900 dark:text-gray-100">
              {formatSalary(jobData?.salaryMin)} - {formatSalary(jobData?.salaryMax)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Description:</span>
            <p className="text-gray-900 dark:text-gray-100 mt-2 whitespace-pre-wrap">{jobData?.jobDescription || "Not provided"}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 px-6 py-3 bg-[#F84416] text-white rounded-lg hover:bg-[#EA4C00] transition-colors"
          style={{ fontFamily: "Open Sans, sans-serif", fontSize: "14px", fontWeight: 600 }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
