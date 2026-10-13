/*
 * EntitlementsService (Part G). Every feature goes through canAccess(). At launch
 * the only active plan is FREE_LAUNCH, which grants everything. Adding paid
 * plans later is a configuration change here plus a hosted adapter, not a rewrite.
 */
import type { User } from "./hosted";

export const FEATURES = ["qbank", "simulator", "analytics", "flashcards", "library", "oce", "planner", "audio"] as const;
export type Feature = (typeof FEATURES)[number];

export interface Plan {
  id: string;
  name: string;
  active: boolean;
  features: readonly Feature[] | "all";
  months?: number;
}

export const PLANS: Plan[] = [
  { id: "FREE_LAUNCH", name: "Free during launch", active: true, features: "all" },
  // Future plans: defined but INACTIVE. Nothing here is shown in the UI.
  { id: "M3", name: "3 months", active: false, features: "all", months: 3 },
  { id: "M6", name: "6 months", active: false, features: "all", months: 6 },
  { id: "M12", name: "12 months", active: false, features: "all", months: 12 },
  { id: "OCE_ADDON", name: "OCE add-on", active: false, features: ["oce"] },
  { id: "BUNDLE", name: "Bundle", active: false, features: "all" },
];

export interface EntitlementsService {
  canAccess(user: User | null, feature: Feature): Promise<boolean>;
}

export const entitlements: EntitlementsService = {
  async canAccess(_user, feature) {
    return PLANS.some((p) => p.active && (p.features === "all" || p.features.includes(feature)));
  },
};
