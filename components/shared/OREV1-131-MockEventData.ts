// THIS FILE GOES IN: components/shared/OREV1-131-MockEventData.ts (NEW FILE — temporary, delete once API is wired)
export const MOCK_EVENT = {
  name: "Sunset Jazz Night",
  category_name: "Music",
  sub_category_name: "Live Concert",
  languages: ["English", "Tamil"],
  min_age: 18,
  event_duration_minutes: 120,
  refund_allowed: true,
  description: "<p>An evening of soulful jazz under the stars, featuring top artists from across the country.</p>",
  terms_conditions: "<p>Standard event terms apply. Entry subject to age verification.</p>",
  organiser_name: "Chennai Live Events",
  organiser_logo_url: "",
  banners: [
    { id: "b1", file_url: "/placeholder-banner.jpg", media_type: "image", is_default_banner: true },
    { id: "b2", file_url: "/placeholder-banner2.jpg", media_type: "image", is_default_banner: false },
  ],
  gallery: [
    { id: "g1", file_url: "/placeholder-gallery1.jpg", caption: "Last year's crowd" },
    { id: "g2", file_url: "/placeholder-gallery2.jpg", caption: "Stage setup" },
  ],
  venues: [
    {
      id: "v1", external_name: "Marina Beach Amphitheatre", line1: "Marina Beach Road", area: "Triplicane",
      city_name: "Chennai", state_name: "Tamil Nadu", country_name: "India",
      dates: [{ event_date: "2026-08-25", times: [{ id: "t1", start_time: "18:00" }, { id: "t2", start_time: "21:00" }] }],
    },
  ],
  ticketsBySlot: {
    t1: [{ id: "tk1", name: "General", price: 500 }, { id: "tk2", name: "VIP", price: 1200 }],
    t2: [{ id: "tk1", name: "General", price: 500 }],
  },
  artists: [{ id: "a1", name: "Ravi Menon", role: "Singer", photo_url: "" }],
  sponsors: [{ id: "s1", name: "Zomato", logo_url: "" }],
  payment: {
    upi_enabled: true, upi: [{ upi_id: "orgzify@upi", display_name: "Orgzify Events" }],
    qr_enabled: true, qr_image_url: "",
    bank_enabled: true, bank_account_name: "Orgzify Events Pvt Ltd", bank_account_number: "1234567890", bank_name: "HDFC Bank", bank_ifsc_swift: "HDFC0001234",
    url_enabled: false, external_url: "",
  },
  recommendations: [
    { id: "r1", slug: "acoustic-night", name: "Acoustic Night", banner_url: "", city: "Chennai" },
    { id: "r2", slug: "food-fest", name: "Food Fest", banner_url: "", city: "Chennai" },
  ],
};