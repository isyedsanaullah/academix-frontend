export const dynamic = 'force-static';

const BASE_URL = 'https://www.collegeshub.org';

export default async function sitemap() {
  const currentDate = new Date().toISOString();

  // Core public static marketing & platform pages
  const staticRoutes = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/join/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/request-subscription/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy-policy/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Optional: Discover public active college profiles
  const collegeRoutes = [];
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://academix-backend-8zcg.onrender.com/api').replace(/\/api\/?$/, '');
    const res = await fetch(`${apiUrl}/api/public/colleges`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = json?.data || [];
      for (const col of list) {
        const slug = col.slug || col.code;
        if (slug && col.status === 'active') {
          collegeRoutes.push({
            url: `${BASE_URL}/college/${slug}`,
            lastModified: col.updated_at || col.updatedAt || currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }
    }
  } catch (err) {
    // Graceful fallback to static routes if backend is uncontactable at build time
  }

  return [...staticRoutes, ...collegeRoutes];
}
