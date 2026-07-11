import type { Metadata } from "next";
import CategorySection from "@/components/CategorySection";
import Navbar from "@/components/shared/OREV1-026-Navbar";

const BASE_URL = "https://www.orgzify.com";

export const metadata: Metadata = {
  title: "Orgzify — Smart Event Management Platform for India",
  description:
    "Orgzify is India's smartest event management platform. Consolidate tickets, mark attendance, publish results and generate e-certificates — all in one place. Free forever for attendance.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Orgzify — Smart Event Management Platform for India",
    description:
      "Manage events end-to-end — tickets, attendance, results and e-certificates. Free forever for attendance. India's smartest event platform.",
    url: BASE_URL,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Orgzify — Smart Event Management Platform",
      },
    ],
  },
};

// JSON-LD for homepage — SoftwareApplication schema
const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Orgzify",
  operatingSystem: "Web, iOS, Android",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "50",
  },
  description:
    "India's smartest event management platform for organisers. Manage tickets, attendance, results and e-certificates in one place.",
  url: BASE_URL,
};

export default function Home() {
  return (
    <>
      {/* JSON-LD for this page */}
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />

      <div className="min-h-screen bg-white flex flex-col">

        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white text-center px-6 py-10 md:py-16">
          <p className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-3">
            India's Event Management Platform
          </p>
          <h1 className="text-2xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto mb-8">
            One Platform for All Your Event Needs
          </h1>
          <a
            href="/register"
            className="inline-block bg-yellow-400 text-blue-900 px-8 md:px-12 py-3 md:py-4 rounded-full font-bold text-sm md:text-lg hover:bg-yellow-300 transition shadow-lg"
          >
            Get Started Free - No Credit Card Needed
          </a>
        </section>

        {/* Category Section */}
        <CategorySection />

        {/* Features */}
        <section id="features" className="px-4 md:px-6 py-10 max-w-6xl mx-auto w-full">
          <h2 className="text-center text-xl md:text-2xl font-bold text-blue-900 mb-2">Everything You Need</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-8">
            Powerful tools for organisers. Simple experience for participants.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: "🎟️", title: "Ticket Consolidation", desc: "Manage tickets from multiple platforms in one place" },
              { icon: "✅", title: "Attendance Marking", desc: "Mark attendance easily — always free forever" },
              { icon: "🏅", title: "E-Certificates", desc: "Auto-generate and distribute certificates instantly" },
              { icon: "🏆", title: "Results Publishing", desc: "Publish winners and rankings professionally" },
              { icon: "🎨", title: "AI Posters", desc: "Auto-generate event posters and post to social media" },
              { icon: "👨‍👧", title: "Family Profiles", desc: "Parents manage profiles for entire family easily" },
              { icon: "🏫", title: "Academy Support", desc: "Academies register and manage their students" },
              { icon: "📊", title: "Analytics", desc: "Track event performance and participant history" },
            ].map((f) => (
              <div
                key={f.title}
                className="border border-gray-100 rounded-2xl p-4 md:p-6 hover:shadow-md transition hover:border-blue-100"
              >
                <div className="text-2xl md:text-3xl mb-2 md:mb-3" aria-hidden="true">{f.icon}</div>
                <h3 className="font-semibold text-blue-900 text-xs md:text-sm">{f.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="bg-blue-50 px-4 md:px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center text-xl md:text-2xl font-bold text-blue-900 mb-8 md:mb-10">
              How It Works
            </h2>
            <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8 md:text-center">
              {[
                { step: "1", title: "Register Free", desc: "Create your account in minutes. No credit card needed." },
                { step: "2", title: "Create Your Event", desc: "Add your event details, categories and participants." },
                { step: "3", title: "Manage Everything", desc: "Mark attendance, publish results, generate certificates." },
              ].map((s) => (
                <div key={s.step} className="flex md:flex-col items-start md:items-center gap-4">
                  <div className="w-10 h-10 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-base flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm">{s.title}</h3>
                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 md:px-6 py-10 max-w-6xl mx-auto w-full">
          <h2 className="text-center text-xl md:text-2xl font-bold text-blue-900 mb-2">What Organisers Say</h2>
          <p className="text-center text-gray-500 text-xs md:text-sm mb-8">
            Trusted by event organisers across India
          </p>
          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6">
            {[
              { name: "Ramesh Kumar", role: "Sports Academy", location: "Chennai", initials: "RK", text: "Orgzify made managing our annual sports day so much easier. Attendance and certificates in minutes!" },
              { name: "Priya Sharma", role: "Chess Club", location: "Bangalore", initials: "PS", text: "The fixture planning and results publishing saved us hours of manual work. Highly recommended!" },
              { name: "Abdul Kalam", role: "Athletics Club", location: "Madurai", initials: "AK", text: "Best platform for managing large events. Our parents love the e-certificate feature!" },
            ].map((t) => (
              <article
                key={t.name}
                className="border border-gray-100 rounded-2xl p-4 md:p-6 hover:shadow-md transition flex gap-3 md:gap-4"
              >
                <div
                  className="w-12 md:w-20 min-h-full rounded-xl bg-blue-900 text-white flex items-center justify-center text-base md:text-2xl font-bold flex-shrink-0"
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div className="flex flex-col justify-between">
                  <blockquote className="text-gray-600 text-xs md:text-sm italic">"{t.text}"</blockquote>
                  <div className="mt-2 md:mt-3">
                    <p className="font-semibold text-blue-900 text-xs md:text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role} • {t.location}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-blue-900 px-4 py-8 md:py-10" aria-label="Orgzify platform statistics">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {[
              { number: "500+", label: "Events Managed" },
              { number: "10,000+", label: "Participants" },
              { number: "50+", label: "Organisers" },
              { number: "25+", label: "Cities" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-yellow-400 text-2xl md:text-3xl font-bold">{s.number}</p>
                <p className="text-blue-200 text-xs md:text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-10 text-center bg-white">
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">Ready to Get Started?</h2>
          <p className="text-gray-500 text-sm mb-6">Join 50+ organisers managing events on Orgzify</p>
          <a
            href="/register"
            className="inline-block bg-yellow-400 text-blue-900 px-10 py-3 rounded-full font-bold text-sm hover:bg-yellow-300 transition shadow-lg"
          >
            Get Started Free
          </a>
        </section>

        {/* Footer */}
        <footer className="bg-blue-900 text-white px-4 md:px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6">
              <div className="col-span-2 md:col-span-1">
                <h2 className="text-xl font-bold mb-2">Orgz<span className="text-yellow-400">ify</span></h2>
                <p className="text-blue-200 text-xs md:text-sm">
                  India's smartest event management and participant tracking platform.
                </p>
                <div className="flex gap-3 mt-4">
                  {[
                    { icon: "f", label: "Facebook", href: "https://facebook.com/orgzify" },
                    { icon: "in", label: "Instagram", href: "https://instagram.com/orgzify" },
                    { icon: "X", label: "Twitter", href: "https://twitter.com/orgzify" },
                    { icon: "▶", label: "YouTube", href: "#" },
                    { icon: "li", label: "LinkedIn", href: "https://linkedin.com/company/orgzify" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={`Orgzify on ${s.label}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition text-xs font-bold"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm mb-3">Platform</p>
                <nav aria-label="Platform links" className="flex flex-col gap-2 text-xs md:text-sm text-blue-200">
                  <a href="/events" className="hover:text-white transition">Events</a>
                  <a href="/login" className="hover:text-white transition">Login</a>
                  <a href="/register" className="hover:text-white transition">Register</a>
                  <a href="#features" className="hover:text-white transition">Features</a>
                </nav>
              </div>
              <div>
                <p className="font-semibold text-sm mb-3">Support</p>
                <nav aria-label="Support links" className="flex flex-col gap-2 text-xs md:text-sm text-blue-200">
                  <a href="#" className="hover:text-white transition">FAQ</a>
                  <a href="#" className="hover:text-white transition">Contact Us</a>
                  <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
                  <a href="/terms-of-service" className="hover:text-white transition">Terms of Service</a>
                  <a href="/cookie-policy" className="hover:text-white transition">Cookie Policy</a>
                </nav>
              </div>
              <div>
                <p className="font-semibold text-sm mb-3">Newsletter</p>
                <p className="text-blue-200 text-xs mb-3">Stay updated with events in your city</p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="Your email"
                    aria-label="Email for newsletter"
                    className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:border-white"
                  />
                  <button className="bg-yellow-400 text-blue-900 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-blue-300 text-xs">© 2025 Orgzify. All rights reserved.</p>
              <p className="text-blue-300 text-xs text-center md:text-right">
                Orgzify is a free platform. We support our services through Google advertising revenue.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
