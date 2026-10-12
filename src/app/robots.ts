import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api/", "/auth/", "/login", "/company/*/review", "/company/*/claim"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
