import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/models",
    "/benchmarks",
    "/pricing",
    "/tools",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${siteUrl.replace(/\/$/, "")}${route || "/"}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}