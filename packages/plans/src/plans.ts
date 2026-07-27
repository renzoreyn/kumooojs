export type PlanId = "free" | "pro" | "team" | "scale";

export type PlanStatus = "live" | "coming_soon" | "sales";

export type BillingInterval = "monthly" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  /** USD charged per month when billed monthly. Null = custom / free label only. */
  priceMonthlyUsd: number | null;
  /** USD per month equivalent when billed annually. Null = same as monthly or N/A. */
  priceAnnualMonthlyUsd: number | null;
  blurb: string;
  status: PlanStatus;
  sites: number | null;
  mediaBytes: number | null;
  /** Soft monthly bandwidth cap. Null = fair-use (free) or custom (scale). */
  bandwidthBytes: number | null;
  customDomains: number | null;
  buildsPerDay: number | null;
  seats: number | null;
  support: string;
  features: string[];
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Nimbus",
    priceMonthlyUsd: 0,
    priceAnnualMonthlyUsd: 0,
    blurb: "Two hosted sites on kumooo.site while you learn the product.",
    status: "live",
    sites: 2,
    mediaBytes: 150 * MB,
    bandwidthBytes: null,
    customDomains: 0,
    buildsPerDay: 20,
    seats: 1,
    support: "Docs",
    features: [
      "2 sites on {slug}.kumooo.site",
      "150 MB storage",
      "Fair-use bandwidth",
      "Made-with kumooo badge",
      "1 seat",
      "Docs support",
    ],
  },
  pro: {
    id: "pro",
    name: "Cumulus",
    priceMonthlyUsd: 10,
    priceAnnualMonthlyUsd: 7,
    blurb: "For freelancers and small crews who need custom domains and room to grow.",
    status: "live",
    sites: 10,
    mediaBytes: 25 * GB,
    bandwidthBytes: 50 * GB,
    customDomains: 5,
    buildsPerDay: 100,
    seats: 5,
    support: "Email",
    features: [
      "10 sites",
      "25 GB storage",
      "50 GB bandwidth",
      "5 custom domains",
      "No made-with badge",
      "5 seats",
      "Email support",
    ],
  },
  team: {
    id: "team",
    name: "Stratus",
    priceMonthlyUsd: 17,
    priceAnnualMonthlyUsd: 15,
    blurb: "For studios and small agencies that run a lot of sites.",
    status: "live",
    sites: 50,
    mediaBytes: 100 * GB,
    bandwidthBytes: 500 * GB,
    customDomains: null,
    buildsPerDay: 500,
    seats: null,
    support: "Priority",
    features: [
      "50 sites",
      "100 GB storage",
      "500 GB bandwidth",
      "Unlimited custom domains",
      "No made-with badge",
      "Unlimited seats",
      "Priority support",
    ],
  },
  scale: {
    id: "scale",
    name: "Cumulonimbus",
    priceMonthlyUsd: null,
    priceAnnualMonthlyUsd: null,
    blurb: "For teams where hosting is part of the product.",
    status: "sales",
    sites: null,
    mediaBytes: null,
    bandwidthBytes: null,
    customDomains: null,
    buildsPerDay: null,
    seats: null,
    support: "Dedicated + SLA",
    features: [
      "Unlimited sites",
      "Custom storage & bandwidth",
      "Unlimited custom domains",
      "No made-with badge",
      "Unlimited seats",
      "Dedicated support + SLA",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "team", "scale"];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function listPlans(): Plan[] {
  return PLAN_ORDER.map((id) => PLANS[id]);
}

export function priceForInterval(plan: Plan, interval: BillingInterval): number | null {
  if (plan.priceMonthlyUsd === null) return null;
  if (interval === "annual") {
    return plan.priceAnnualMonthlyUsd ?? plan.priceMonthlyUsd;
  }
  return plan.priceMonthlyUsd;
}

export function formatPriceLabel(plan: Plan, interval: BillingInterval): string {
  const amount = priceForInterval(plan, interval);
  if (amount === null) return "Custom";
  if (amount === 0) return "$0";
  if (interval === "annual") return `$${amount}/mo`;
  return `$${amount}/mo`;
}

export function formatPriceHint(plan: Plan, interval: BillingInterval): string | null {
  const amount = priceForInterval(plan, interval);
  if (amount === null || amount === 0) return null;
  if (interval === "annual") return "billed yearly";
  return null;
}

/** Whether an account on `planId` may create another site given current count. */
export function canCreateSite(planId: PlanId, currentSiteCount: number): boolean {
  const limit = PLANS[planId].sites;
  if (limit === null) return true;
  return currentSiteCount < limit;
}

export function mediaLimitBytes(planId: PlanId): number | null {
  return PLANS[planId].mediaBytes;
}

export function bandwidthLimitBytes(planId: PlanId): number | null {
  return PLANS[planId].bandwidthBytes;
}

/** Nimbus shows the pill. Cumulus and above do not. */
export function showsMadeWithCredit(planId: PlanId | string | null | undefined): boolean {
  return planId === "free" || planId == null || planId === "";
}

export function customDomainLimit(planId: PlanId): number | null {
  return PLANS[planId].customDomains;
}

/** Entitlement only. PlanStatus (e.g. coming_soon) is ignored so ops can grant Cumulus before self-serve checkout is live. */
export function canUseCustomDomains(planId: PlanId): boolean {
  const limit = PLANS[planId].customDomains;
  return limit === null || limit > 0;
}

export function seatLimit(planId: PlanId): number | null {
  return PLANS[planId].seats;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes >= GB) {
    const n = bytes / GB;
    return `${n >= 10 ? Math.round(n) : Math.round(n * 10) / 10} GB`;
  }
  if (bytes < 10 * 1024) return `${bytes} B`;
  const mb = bytes / MB;
  return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
}
