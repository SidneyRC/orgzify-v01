// THIS FILE GOES IN: app/biz/[slug]/events/media/api/route.ts (REPLACES existing file)
// This was an older second copy of the media route, without the access checks.
// It now simply uses the one locked media route, so the two can never differ.
export { GET, POST, PATCH, DELETE } from '@/app/biz/events/media/api/route'
