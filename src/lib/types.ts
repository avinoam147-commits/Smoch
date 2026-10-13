export type CategoryId = "courses" | "signals" | "mentoring" | "algo";

export type CompanyStats = {
  reviewCount: number;
  /** counts for 1..5 stars */
  distribution: [number, number, number, number, number];
  rawAverage: number;
  trustScore: number;
  /** published ratings that include written text */
  textCount: number;
};

export type Company = {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  tagline: string;
  about: string;
  website: string | null;
  socialUrl: string | null;
  logoUrl: string | null;
  registryId: string | null;
  registryVerified: boolean;
  city: string | null;
  founded: number | null;
  priceRange: string | null;
  claimed: boolean;
  stats: CompanyStats;
};

export type Reply = { body: string; createdAt: string; updatedAt: string };

export type Review = {
  id: string;
  companyId: string;
  authorName: string;
  rating: number;
  /** null for a rating without written text */
  body: string | null;
  paid: boolean;
  amountPaid: number | null;
  experienceDate: string | null;
  verifiedPurchase: boolean;
  source: "user" | "staff";
  helpfulCount: number;
  createdAt: string;
  editedAt: string | null;
  reply: Reply | null;
};

export type ReviewWithCompany = Review & { company: Pick<Company, "slug" | "name"> };

export type Viewer = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  phone: string | null;
  phoneVerified: boolean;
  notifyEmail: boolean;
};

export type ActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> } | null;
