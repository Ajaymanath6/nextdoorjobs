/** @typedef {{ expiresAt?: Date | string | null, createdAt: Date | string, extensionCount?: number | null }} JobExpiryFields */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const INITIAL_DAYS = 14;
export const EXTENSION_DAYS = 14;

/**
 * Effective expiry: stored expiresAt, or createdAt + 14d + extensionCount * 14d.
 * Matches JobListingsModal getExpiryDate logic.
 * @param {JobExpiryFields} job
 * @returns {Date}
 */
export function getEffectiveExpiry(job) {
  if (job.expiresAt) {
    const d = job.expiresAt instanceof Date ? job.expiresAt : new Date(job.expiresAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const created =
    job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt);
  const extensions = job.extensionCount ?? 0;
  const daysToAdd = INITIAL_DAYS + extensions * EXTENSION_DAYS;
  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + daysToAdd);
  return expiry;
}

/**
 * @param {Date} [now]
 */
export function getNewJobExpiresAt(now = new Date()) {
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + INITIAL_DAYS);
  return expiry;
}

/**
 * @param {JobExpiryFields} job
 * @param {Date} [now]
 */
export function isJobExpired(job, now = new Date()) {
  return getEffectiveExpiry(job).getTime() < now.getTime();
}

/**
 * @param {Date} [now]
 */
export function expireJobUpdate(now = new Date()) {
  return {
    isActive: false,
    autoDeletedAt: now,
  };
}

/**
 * Prisma where for live jobs. Prefer expiresAt (set on create/extend); legacy null uses createdAt cutoff.
 * @param {Date} [now]
 */
export function activeJobWhere(now = new Date()) {
  const legacyCutoff = new Date(now.getTime() - INITIAL_DAYS * MS_PER_DAY);
  return {
    isActive: true,
    OR: [
      { expiresAt: { gt: now } },
      {
        AND: [{ expiresAt: null }, { createdAt: { gt: legacyCutoff } }],
      },
    ],
  };
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ allActive?: boolean, now?: Date }} options
 */
export async function expireStaleJobs(prisma, { allActive = false, now = new Date() } = {}) {
  const candidates = await prisma.jobPosition.findMany({
    where: {
      isActive: true,
      autoDeletedAt: null,
    },
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      extensionCount: true,
    },
  });

  const idsToExpire = candidates
    .filter((job) => allActive || isJobExpired(job, now))
    .map((job) => job.id);

  if (idsToExpire.length === 0) {
    return { count: 0, ids: [] };
  }

  const result = await prisma.jobPosition.updateMany({
    where: { id: { in: idsToExpire } },
    data: expireJobUpdate(now),
  });

  return { count: result.count, ids: idsToExpire };
}
