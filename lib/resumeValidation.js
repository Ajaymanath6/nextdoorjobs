import {
  SKILL_PROFICIENCIES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
  LANGUAGE_PROFICIENCIES,
  JOB_LOOKING_FOR,
  NOTICE_PERIODS,
  isValidEnum,
  parseEnumArray,
  isValidUrl,
} from "./constants/profileEnums.js";

export const MAX_WORK = 5;
export const MAX_EDUCATION = 5;
export const MAX_SKILLS = 20;
export const MAX_CERTIFICATIONS = 10;
export const MAX_LANGUAGES = 10;
export const ABOUT_ME_MIN = 200;
export const ABOUT_ME_MAX = 500;

export function trimString(value, maxLen) {
  return typeof value === "string" ? value.trim().slice(0, maxLen) || null : null;
}

export function validateAboutMe(value) {
  if (value == null || value === "") return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length < ABOUT_ME_MIN || trimmed.length > ABOUT_ME_MAX) {
    return { error: `About me must be between ${ABOUT_ME_MIN} and ${ABOUT_ME_MAX} characters` };
  }
  return trimmed;
}

export function parseOtherLinks(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return null;
      return JSON.stringify(
        parsed
          .filter((item) => item && typeof item.label === "string" && typeof item.url === "string")
          .slice(0, 10)
          .map((item) => ({
            label: item.label.trim().slice(0, 100),
            url: item.url.trim().slice(0, 500),
          }))
          .filter((item) => item.label && item.url && isValidUrl(item.url))
      );
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    return parseOtherLinks(JSON.stringify(value));
  }
  return null;
}

export function mapWorkExperience(w, index) {
  const responsibilities =
    typeof w.responsibilities === "string"
      ? w.responsibilities.trim().slice(0, 5000) || null
      : typeof w.duties === "string"
        ? w.duties.trim().slice(0, 5000) || null
        : null;
  const startDate = trimString(w.startDate, 10);
  const endDate = trimString(w.endDate, 10);
  const year = trimString(w.year, 20) || (startDate ? startDate.slice(0, 4) : null);

  return {
    companyName: trimString(w.companyName, 255),
    companyUrl: trimString(w.companyUrl, 500),
    position: trimString(w.position, 255),
    duties: responsibilities,
    responsibilities,
    keyAchievements: trimString(w.keyAchievements, 5000),
    year,
    startDate,
    endDate: w.isCurrent ? null : endDate,
    isCurrent: Boolean(w.isCurrent),
    employmentType: isValidEnum(w.employmentType, EMPLOYMENT_TYPES) ? w.employmentType : null,
    orderIndex: index,
  };
}

export function mapEducation(e, index) {
  const endYear = trimString(e.endYear, 10) || trimString(e.yearOfPassing, 20);
  return {
    degree: trimString(e.degree, 255),
    specialization: trimString(e.specialization, 255) || trimString(e.streamName, 255),
    universityName: trimString(e.universityName, 255),
    streamName: trimString(e.streamName, 255) || trimString(e.specialization, 255),
    marksOrScore: trimString(e.marksOrScore, 100),
    yearOfPassing: endYear,
    startYear: trimString(e.startYear, 10),
    endYear,
    orderIndex: index,
  };
}

export function mapSkill(s, index) {
  const name = trimString(s.name, 100);
  if (!name) return null;
  return {
    name,
    isPrimary: Boolean(s.isPrimary),
    proficiency: isValidEnum(s.proficiency, SKILL_PROFICIENCIES) ? s.proficiency : "Intermediate",
    orderIndex: index,
  };
}

export function mapCertification(c, index) {
  const name = trimString(c.name, 255);
  if (!name) return null;
  const certificateUrl = trimString(c.certificateUrl, 500);
  if (certificateUrl && !isValidUrl(certificateUrl)) return null;
  return {
    name,
    issuingOrg: trimString(c.issuingOrg, 255),
    year: trimString(c.year, 10),
    certificateUrl,
    orderIndex: index,
  };
}

export function mapLanguage(l, index) {
  const language = trimString(l.language, 100);
  if (!language) return null;
  return {
    language,
    proficiency: isValidEnum(l.proficiency, LANGUAGE_PROFICIENCIES)
      ? l.proficiency
      : "Intermediate",
    orderIndex: index,
  };
}

export function buildResumeData(body) {
  const aboutMeResult = validateAboutMe(body.aboutMe);
  if (aboutMeResult && typeof aboutMeResult === "object" && aboutMeResult.error) {
    return { error: aboutMeResult.error };
  }

  const urlFields = [
    ["linkedInUrl", body.linkedInUrl],
    ["githubUrl", body.githubUrl],
    ["portfolioUrl", body.portfolioUrl],
    ["behanceUrl", body.behanceUrl],
    ["dribbbleUrl", body.dribbbleUrl],
  ];
  for (const [field, value] of urlFields) {
    if (value && !isValidUrl(value)) {
      return { error: `Invalid URL for ${field}` };
    }
  }

  return {
    data: {
      firstName: trimString(body.firstName, 255),
      lastName: trimString(body.lastName, 255),
      emailOverride: trimString(body.emailOverride, 255),
      currentPosition: trimString(body.currentPosition, 255),
      professionalHeadline: trimString(body.professionalHeadline, 255),
      aboutMe: aboutMeResult,
      yearsExperience: trimString(body.yearsExperience, 50),
      expectedSalaryPackage: trimString(body.expectedSalaryPackage, 100),
      currentSalaryPackage: trimString(body.currentSalaryPackage, 100),
      currentSalaryVisibleToRecruiter:
        typeof body.currentSalaryVisibleToRecruiter === "boolean"
          ? body.currentSalaryVisibleToRecruiter
          : false,
      salaryCurrency: trimString(body.salaryCurrency, 10) || "INR",
      salaryNegotiable:
        typeof body.salaryNegotiable === "boolean" ? body.salaryNegotiable : null,
      hourlyRate: trimString(body.hourlyRate, 100),
      dailyRate: trimString(body.dailyRate, 100),
      projectRate: trimString(body.projectRate, 100),
      lookingFor: parseEnumArray(body.lookingFor, JOB_LOOKING_FOR),
      preferredJobRole: trimString(body.preferredJobRole, 255),
      preferredIndustry: trimString(body.preferredIndustry, 255),
      workMode: isValidEnum(body.workMode, WORK_MODES) ? body.workMode : null,
      noticePeriod: isValidEnum(body.noticePeriod, NOTICE_PERIODS) ? body.noticePeriod : null,
      noticePeriodCustom: trimString(body.noticePeriodCustom, 50),
      linkedInUrl: trimString(body.linkedInUrl, 500),
      githubUrl: trimString(body.githubUrl, 500),
      portfolioUrl: trimString(body.portfolioUrl, 500),
      behanceUrl: trimString(body.behanceUrl, 500),
      dribbbleUrl: trimString(body.dribbbleUrl, 500),
      otherLinks: parseOtherLinks(body.otherLinks),
    },
  };
}

export const RESUME_INCLUDE = {
  workExperiences: { orderBy: { orderIndex: "asc" } },
  educations: { orderBy: { orderIndex: "asc" } },
  skills: { orderBy: { orderIndex: "asc" } },
  certifications: { orderBy: { orderIndex: "asc" } },
  languages: { orderBy: { orderIndex: "asc" } },
};
