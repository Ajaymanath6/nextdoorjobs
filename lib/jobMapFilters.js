export const RADIUS_OPTIONS = [
  { label: "Within 2 km", value: 2 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 10 km", value: 10 },
  { label: "Within 25 km", value: 25 },
];

export const WORK_MODE_OPTIONS = [
  { label: "Onsite", apiValue: "Work from office" },
  { label: "Remote", apiValue: "Remote" },
  { label: "Hybrid", apiValue: "Hybrid" },
];

export const EMPLOYMENT_OPTIONS = [
  { label: "Full-time", value: "FullTime" },
  { label: "Part-time", value: "PartTime" },
  { label: "Contract", value: "Contract" },
  { label: "Internship", value: "Internship" },
  { label: "Freelance", value: "Freelance" },
];

export const SALARY_BANDS = [
  { label: "₹0–3 LPA", salaryMin: 0, salaryMax: 300000 },
  { label: "₹3–6 LPA", salaryMin: 300000, salaryMax: 600000 },
  { label: "₹6–10 LPA", salaryMin: 600000, salaryMax: 1000000 },
  { label: "₹10–15 LPA", salaryMin: 1000000, salaryMax: 1500000 },
  { label: "₹15+ LPA", salaryMin: 1500000, salaryMax: null },
];

export const GIG_SALARY_BANDS = ["₹500/day", "₹1000/day", "₹5000/project"];

export const EXPERIENCE_OPTIONS = [
  { label: "Fresher", yearsMin: 0, yearsMax: 0 },
  { label: "1–3 Years", yearsMin: 1, yearsMax: 3 },
  { label: "3–5 Years", yearsMin: 3, yearsMax: 5 },
  { label: "5–10 Years", yearsMin: 5, yearsMax: 10 },
  { label: "10+ Years", yearsMin: 10, yearsMax: null },
];

export const COMPANY_TYPE_OPTIONS = [
  { label: "Startup", value: "Startup" },
  { label: "SME", value: "SME" },
  { label: "Enterprise", value: "Enterprise" },
];

export const POSTED_WITHIN_OPTIONS = [
  { label: "Today", days: 1 },
  { label: "Last 3 Days", days: 3 },
  { label: "Last Week", days: 7 },
  { label: "Last Month", days: 30 },
];

export function workModeToApi(label) {
  const found = WORK_MODE_OPTIONS.find((o) => o.label === label);
  return found?.apiValue || label;
}

function appendJobFilterParams(params, filters = {}) {
  const {
    workMode,
    employmentType,
    industryCategory,
    roleTitle,
    salaryBand,
    moreFilters = {},
    q,
  } = filters;

  if (workMode) {
    params.set("remoteType", workModeToApi(workMode));
  }
  if (employmentType) {
    params.set("employmentType", employmentType);
  }
  if (industryCategory) {
    params.set("category", industryCategory);
  }
  if (roleTitle) {
    params.set("title", roleTitle);
  }
  if (salaryBand) {
    if (salaryBand.salaryMin != null) params.set("salaryMin", String(salaryBand.salaryMin));
    if (salaryBand.salaryMax != null) params.set("salaryMax", String(salaryBand.salaryMax));
  }

  const experience = EXPERIENCE_OPTIONS.find((e) => e.label === moreFilters.experience);
  if (experience) {
    if (experience.yearsMin != null) params.set("yearsMin", String(experience.yearsMin));
    if (experience.yearsMax != null) params.set("yearsMax", String(experience.yearsMax));
    if (experience.yearsMax == null && experience.yearsMin != null) {
      params.delete("yearsMax");
    }
  }

  if (moreFilters.companyType) {
    params.set("companyFunding", moreFilters.companyType);
  }
  const posted = POSTED_WITHIN_OPTIONS.find((p) => p.label === moreFilters.postedWithin);
  if (posted) {
    params.set("postedWithinDays", String(posted.days));
  }

  if (q && String(q).trim()) {
    params.set("q", String(q).trim());
  }
}

export function buildCompaniesQuery(filters = {}) {
  const params = new URLSearchParams();
  appendJobFilterParams(params, filters);
  const qs = params.toString();
  return qs ? `/api/companies?${qs}` : "/api/companies";
}

/** Flat jobs feed for Home list view — same filters as companies + optional q. */
export function buildJobsFeedQuery(filters = {}) {
  const params = new URLSearchParams();
  appendJobFilterParams(params, filters);
  const qs = params.toString();
  return qs ? `/api/jobs/feed?${qs}` : "/api/jobs/feed";
}

export function gigMatchesSalaryBand(gig, bandLabel) {
  if (!bandLabel || !gig?.expectedSalary) return true;
  const salary = String(gig.expectedSalary).toLowerCase();
  if (bandLabel === "₹500/day") return salary.includes("500");
  if (bandLabel === "₹1000/day") return salary.includes("1000");
  if (bandLabel === "₹5000/project") return salary.includes("5000");
  return true;
}
