export const SKILL_PROFICIENCIES = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const EMPLOYMENT_TYPES = ["FullTime", "PartTime", "Contract", "Internship", "Freelance"];
export const WORK_MODES = ["Onsite", "Remote", "Hybrid"];
export const LANGUAGE_PROFICIENCIES = ["Basic", "Intermediate", "Fluent", "Native"];
export const JOB_LOOKING_FOR = ["FullTime", "PartTime", "Freelance", "Internship"];
export const NOTICE_PERIODS = ["Immediate", "Days15", "Days30", "Days60", "Custom"];
export const GENDERS = ["Male", "Female", "Other", "PreferNotToSay"];

export function isValidEnum(value, allowed) {
  return typeof value === "string" && allowed.includes(value);
}

export function parseEnumArray(values, allowed) {
  if (!Array.isArray(values)) return [];
  return values.filter((v) => isValidEnum(v, allowed));
}

export function isValidUrl(value) {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^https?:\/\/.+/i.test(trimmed);
}
