/**
 * Tracks which company is the consultant's practice (e.g. "Proactiva") vs. a
 * client engagement. Used by the root redirect to decide whether to land on
 * the Proactiva operator Dashboard (practice) or the wildvine ClientDashboard
 * (client engagement).
 *
 * Stored in localStorage rather than on the company record because it's a
 * per-install consultant preference, not domain data worth a schema change.
 * Fallback behavior when unset: treat the company as the practice (safe
 * default — doesn't force existing installs into a view they didn't opt into).
 */

const STORAGE_KEY = "proactiva.practiceCompanyId";

export function setPracticeCompanyId(companyId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, companyId);
  } catch {
    // Non-fatal — root redirect falls back to dashboard.
  }
}

export function getPracticeCompanyId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface CompanyLike {
  id: string;
  createdAt: Date | string;
}

function createdAtMs(c: CompanyLike): number {
  const t = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
  return Number.isNaN(t.getTime()) ? 0 : t.getTime();
}

/**
 * Returns true if the given company is the consultant's practice.
 * Fallback when no marker is stored: the oldest company is the practice
 * (matches the "set up your practice first, then onboard clients" flow).
 */
export function isPracticeCompany(
  companyId: string,
  companies: CompanyLike[],
): boolean {
  const stored = getPracticeCompanyId();
  if (stored) return stored === companyId;
  if (companies.length === 0) return true;
  const oldest = [...companies].sort((a, b) => createdAtMs(a) - createdAtMs(b))[0];
  return oldest?.id === companyId;
}
