export const SERVICE_TYPES = [
  "Arts & Crafts",
  "Beauty & Wellness",
  "Construction & Repair",
  "Education & Tutoring",
  "Engineering & Technical",
  "Event Services",
  "Food & Catering",
  "Healthcare",
  "Home Services",
  "IT & Software",
  "Literature & Writing",
  "Music & Performance",
  "Photography & Videography",
  "Transportation",
  "Other"
];

export const isValidServiceType = (type) => {
  if (!type || typeof type !== "string") return false;
  return true; // Allow any string, including custom entries
};
