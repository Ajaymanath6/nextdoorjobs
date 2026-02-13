/**
 * Account type options for "Who are you?" flow.
 * Values must match Prisma enum AccountType.
 */
export const ACCOUNT_TYPES = [
  { value: "Company", label: "Company / Organisation" },
  { value: "Individual", label: "Job seeker & Gig worker" },
];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((a) => a.value);

export function isValidAccountType(value) {
  return ACCOUNT_TYPE_VALUES.includes(value);
}
