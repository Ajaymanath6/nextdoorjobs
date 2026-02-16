export const SERVICE_TYPES = [
  "Accounting & Finance",
  "Arts & Crafts",
  "Beauty & Wellness",
  "Carpentry & Woodwork",
  "Cleaning Services",
  "Construction & Repair",
  "Delivery & Courier",
  "Education & Tutoring",
  "Electrical Work",
  "Engineering & Technical",
  "Event Services",
  "Food & Catering",
  "Graphic Design",
  "Healthcare",
  "Home Services",
  "Interior Design",
  "IT & Software",
  "Legal Services",
  "Literature & Writing",
  "Marketing & Advertising",
  "Music & Performance",
  "Painting & Decoration",
  "Pet Care",
  "Photography & Videography",
  "Plumbing",
  "Real Estate",
  "Security Services",
  "Tailoring & Fashion",
  "Transportation",
  "Other"
];

export const isValidServiceType = (type) => {
  if (!type || typeof type !== "string") return false;
  return true; // Allow any string, including custom entries
};
