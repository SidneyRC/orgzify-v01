// THIS FILE GOES IN: lib/stripPrivateEventData.ts (NEW FILE)
// Removes private details from the public event data BEFORE it is sent to the browser,
// so they cannot be read in the page source. The yes/no flags stay, so the Book Now popup
// still knows which options exist. The real details come from /event/booking-details after login.
// Also removes the older approved copies nested inside the approved copy.
export function stripPrivateEventData(data: any) {
  if (!data) return data
  const { last_approved_snapshot, ...rest } = data
  const p = rest.payment
  if (!p) return rest
  return {
    ...rest,
    payment: { ...p, upi: [], qr_image_url: '', qr_display_name: '', bank_account_name: '', bank_account_number: '', bank_name: '', bank_ifsc_swift: '', external_url: p.url_enabled ? p.external_url : '', session_urls: p.url_enabled ? p.session_urls : {} },
  }
}
