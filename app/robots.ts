// THIS FILE GOES IN: app/robots.ts (NEW FILE)
// Makes orgzify.com/robots.txt. Lets Google see public pages,
// keeps it out of private areas, and points it to the sitemap.
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.orgzify.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/biz', '/profile', '/profiles', '/bookings', '/company'] },
    sitemap: BASE_URL + '/sitemap.xml',
  }
}
