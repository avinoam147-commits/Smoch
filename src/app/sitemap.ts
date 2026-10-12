import type { MetadataRoute } from "next";
import { getPublishedCompanies } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const companies = await getPublishedCompanies();
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/companies`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/guidelines`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    ...companies.map((c) => ({
      url: `${siteUrl}/company/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
