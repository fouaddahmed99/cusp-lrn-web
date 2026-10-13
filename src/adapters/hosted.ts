/*
 * Adapters for features that need a server (Part J8). In the GitHub-only edition
 * they are all disabled stubs with NO UI. The hosted edition implements these
 * interfaces (see docs/hosted-edition.md) without touching UI code.
 */
import { flags } from "@config";

export interface User {
  id: string;
  email?: string;
  foundingMember?: boolean;
  signedUpAt?: string;
}

export interface AuthProvider {
  readonly enabled: boolean;
  getUser(): Promise<User | null>;
}

export interface PaymentsProvider {
  readonly enabled: boolean;
  startCheckout(planId: string): Promise<never>;
  openCustomerPortal(): Promise<never>;
}

export interface EmailProvider {
  readonly enabled: boolean;
  subscribe(email: string): Promise<never>;
}

export interface AnalyticsProvider {
  readonly enabled: boolean;
  track(event: string, props?: Record<string, unknown>): void;
}

class NotEnabledError extends Error {
  constructor(feature: string) {
    super(`${feature} is not available in the free GitHub edition`);
  }
}

export const auth: AuthProvider = { enabled: flags.ACCOUNTS_ENABLED, getUser: async () => null };
export const payments: PaymentsProvider = {
  enabled: flags.PAYMENTS_ENABLED,
  startCheckout: async () => {
    throw new NotEnabledError("Payments");
  },
  openCustomerPortal: async () => {
    throw new NotEnabledError("Payments");
  },
};
export const email: EmailProvider = {
  enabled: false,
  subscribe: async () => {
    throw new NotEnabledError("Email");
  },
};
/** No tracking by default. A privacy-friendly, cookie-free provider can be plugged in here later. */
export const analytics: AnalyticsProvider = { enabled: flags.ANALYTICS_ENABLED, track: () => undefined };
