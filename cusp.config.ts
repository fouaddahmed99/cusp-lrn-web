/**
 * CUSP LRN — the ONE brand + product-line configuration file.
 *
 * Add more exams/specialties later as additional product lines.
 * Items marked TEMPORARY are placeholders until the official assets are provided.
 */
export const brand = {
  name: "CUSP LRN",
  /** TEMPORARY wordmark. Replace public/brand/wordmark-temporary.svg with the official logo. */
  logo: { src: "/brand/wordmark-temporary.svg", alt: "CUSP LRN", TEMPORARY: true },
  /** TEMPORARY neutral palette (also mirrored in src/app/globals.css). */
  colors: { TEMPORARY: true, primary: "#1f5f8b", primaryDark: "#7cc0ec", accent: "#2f8f6b", ink: "#17202a", paper: "#ffffff" },
  /** Legal placeholders: the owner fills these in. Do not invent entity type, address or registration details. */
  legalEntityName: "[LEGAL ENTITY NAME]",
  address: "[ADDRESS]",
  contactEmail: "[CONTACT EMAIL]",
  copyright: (year: number) => `© ${year} CUSP LRN`,
} as const;

export const productLines = [
  {
    id: "pdb",
    name: "CUSP LRN Pediatric Dentistry Boards",
    shortName: "Pediatric Dentistry Boards",
    exams: ["ABPD Qualifying Exam (QE)", "ABPD Oral Clinical Exam (OCE)"],
    active: true,
  },
] as const;

export const activeProductLine = productLines[0];

/** Where error reports and feedback go (public Issues). Fill in githubOwner once the GitHub account exists. */
export const feedback = {
  githubOwner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? "[GITHUB OWNER]",
  feedbackRepo: "cusp-lrn-feedback",
  /** Shown as plain text for people without a GitHub account. */
  email: brand.contactEmail,
};

/** Feature flags. Everything that needs a server is OFF in the GitHub-only edition. */
export const flags = {
  PAYMENTS_ENABLED: false,
  ACCOUNTS_ENABLED: false,
  DONATIONS_ENABLED: false,
  DONATION_URL: "",
  ANALYTICS_ENABLED: false,
  AI_EXAMINER_ENABLED: false,
  PERCENTILES_ENABLED: false,
} as const;
