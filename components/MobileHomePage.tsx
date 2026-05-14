"use client";

// Mobile Homepage — handles both logged-out and logged-in states
// Usage:
//   <MobileHomePage user={null} />              — logged out
//   <MobileHomePage user={{ name: "Ramesh Kumar", initials: "RK" }} /> — logged in

import { useState } from "react";
import Link from "next/link";
import MobileNavbar from "./MobileNavbar";

const EVENT_TABS_GUEST = ["All", "Sports", "Chess", "Dance", "More"];
const EVENT_TABS_USER  = ["Active", "Past", "Draft"];

const SAMPLE_EVENTS = [
  { icon: "🏆", title: "Annual Sports Day", location: "Chennai", date: "24 Apr" },
  { icon: "♟️", title: "District Chess Open", location: "Madurai", date: "2 May" },
  { icon: "🏊", title: "Summer Swim Meet", location: "Bangalore", date: "10 May" },
];

const MY_EVENTS = [
  { icon: "🏆", title: "Annual Sports Day", date: "24 Apr", status: "Live" },
  { icon: "♟️", title: "Chess Open 2025", date: "2 May", status: "Upcoming" },
];

const FEATURES = [
  { icon: "🎟️", title: "Ticket Consolidation", desc: "Manage tickets from multiple platforms" },
  { icon: "✅", title: "Attendance Marking", desc: "Always free forever" },
  { icon: "🏅", title: "E-Certificates", desc: "Auto-generate & distribute instantly" },
  { icon: "🏆", title: "Results Publishing", desc: "Publish winners professionally" },
  { icon: "🎨", title: "AI Posters", desc: "Auto-generate & post to social media" },
  { icon: "👨‍👧", title: "Family Profiles", desc: "Manage profiles for whole family" },
  { icon: "🏫", title: "Academy Support", desc: "Register and manage students" },
  { icon: "📊", title: "Analytics", desc: "Track performance & history" },
];

const STEPS = [
  { step: "1", title: "Register Free", desc: "Create your account in minutes. No credit card needed." },
  { step: "2", title: "Create Your Event", desc: "Add event details, categories and participants." },
  { step: "3", title: "Manage Everything", desc: "Mark attendance, publish results, generate certificates." },
];

const TESTIMONIALS = [
  { name: "Ramesh Kumar", role: "Sports Academy", location: "Chennai", initials: "RK", text: "Orgzify made managing our annual sports day so much easier. Attendance and certificates in minutes!" },
  { name: "Priya Sharma", role: "Chess Club", location: "Bangalore", initials: "PS", text: "The fixture planning and results publishing saved us hours of manual work. Highly recommended!" },
  { name: "Abdul Kalam", role: "Athletics Club", location: "Madurai", initials: "AK", text: "Best platform for managing large events. Our parents love the e-certificate feature!" },
];

const STATS = [
  { number: "500+", label: "Events Managed" },
  { number: "10,000+", label: "Participants" },
  { number: "50+", label: "Organisers" },
  { number: "25+", label: "Cities" },
];

const QUICK_ACTIONS = [
  { icon: "✅", label: "Attendance", href: "/attendance" },
  { icon: "🏅", label: "Certificates", href: "/certificates" },
  { icon: "🏆", label: "Results", href: "/results" },
  { icon: "📊", label: "Analytics", href: "/analytics" },
];

interface User { name: string; initials: string; }

export default function MobileHomePage({ user = null }: { user?: User | null }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = user ? EVENT_TABS_USER : EVENT_TABS_GUEST;

  return (
    <div className="min-h-screen bg-white flex flex-col md:hidden">

      {/* ── Navbar (Topbar + Search + Hamburger strip) ── */}
      <MobileNavbar user={user} />

      {/* ── Hero Banner ── */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white px-5 py-8 text-center">
        {user ? (
          <>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
              Hi, {user.name.split(" ")[0]} 👋
            </p>
            <h1 className="text-2xl font-bold leading-tight mb-6">
              Manage Your Events Easily
            </h1>
            <Link
              href="/events/create"
              className="inline-block bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-bold text-sm hover:bg-yellow-300 transition shadow-lg"
            >
              + Create New Event
            </Link>
          </>
        ) : (
          <>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">
              India's Event Management Platform
            </p>
            <h1 className="text-2xl font-bold leading-tight mb-6">
              One Platform for All Your Event Needs
            </h1>
            <Link
              href="/register"
              className="inline-block bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-bold text-sm hover:bg-yellow-300 transition shadow-lg"
            >
              🚀 Get Started Free — No Credit Card Needed
            </Link>
          </>
        )}
      </section>

      {/* ── Events Tab Box ── */}
      <section className="px-4 py-5 bg-gray-50 border-b border-gray-100">
        <h2 className="text-sm font-bold text-blue-900 mb-3">
          {user ? "My Events" : "Events"}
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                activeTab === i
                  ? "bg-blue-900 text-white"
                  : "bg-white border border-gray-200 text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Event cards */}
        <div className="flex flex-col gap-3">
          {user
            ? MY_EVENTS.map((e) => (
                <div
                  key={e.title}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{e.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.date}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      e.status === "Live"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              ))
            : SAMPLE_EVENTS.map((e) => (
                <div
                  key={e.title}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition"
                >
                  <span className="text-xl">{e.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">{e.title}</p>
                    <p className="text-xs text-gray-400">📍 {e.location} · {e.date}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* ── Features (Full Width) ── */}
      <section id="features" className="px-4 py-8">
        <h2 className="text-xl font-bold text-blue-900 text-center mb-1">
          {user ? "Quick Actions" : "Everything You Need"}
        </h2>
        <p className="text-gray-500 text-xs text-center mb-6">
          {user
            ? "Jump straight into what you need"
            : "Powerful tools for organisers. Simple experience for participants."}
        </p>

        {user ? (
          /* Quick action grid for logged-in */
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-100 transition"
              >
                <span className="text-3xl">{a.icon}</span>
                <span className="text-sm font-semibold text-blue-900">{a.label}</span>
              </Link>
            ))}
          </div>
        ) : (
          /* Feature cards for logged-out */
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-100 transition"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-blue-900 text-xs">{f.title}</h3>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── How It Works (Full Width) — guests only; logged-in see personal stats ── */}
      {!user ? (
        <section id="how-it-works" className="bg-blue-50 px-4 py-8">
          <h2 className="text-xl font-bold text-blue-900 text-center mb-8">How It Works</h2>
          <div className="flex flex-col gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
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
        </section>
      ) : (
        /* Personal stats for logged-in user */
        <section className="bg-blue-50 px-4 py-8">
          <h2 className="text-xl font-bold text-blue-900 text-center mb-6">Your Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { number: "12", label: "Events Created" },
              { number: "340", label: "Total Participants" },
              { number: "1,200", label: "Certificates Sent" },
              { number: "8", label: "Cities Covered" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-500">{s.number}</p>
                <p className="text-blue-900 text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── City Filter ── */}
      <section id="city" className="px-4 py-6 border-b border-gray-100">
        <h2 className="text-sm font-bold text-blue-900 mb-3">📍 Events Near You</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["Chennai", "Bangalore", "Madurai", "Coimbatore", "Hyderabad", "Mumbai"].map((city) => (
            <button
              key={city}
              className="flex-shrink-0 px-4 py-2 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-blue-900 hover:text-white hover:border-blue-900 transition"
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-8">
        <h2 className="text-xl font-bold text-blue-900 text-center mb-1">What Organisers Say</h2>
        <p className="text-center text-gray-500 text-xs mb-6">Trusted by event organisers across India</p>
        <div className="flex flex-col gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="border border-gray-100 rounded-2xl p-4 flex gap-3 hover:shadow-md transition"
            >
              <div className="w-14 min-h-full rounded-xl bg-blue-900 text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                {t.initials}
              </div>
              <div className="flex flex-col justify-between">
                <p className="text-gray-600 text-xs italic">"{t.text}"</p>
                <div className="mt-2">
                  <p className="font-semibold text-blue-900 text-xs">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role} · 📍 {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-blue-900 px-4 py-8">
        <div className="grid grid-cols-2 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-yellow-400 text-2xl font-bold">{s.number}</p>
              <p className="text-blue-200 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Get Started CTA ── */}
      {!user && (
        <section className="px-4 py-8 text-center bg-white">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Ready to Get Started?</h2>
          <p className="text-gray-500 text-sm mb-6">Join 50+ organisers managing events on Orgzify</p>
          <Link
            href="/register"
            className="inline-block bg-yellow-400 text-blue-900 px-10 py-3 rounded-full font-bold text-sm hover:bg-yellow-300 transition shadow-lg"
          >
            🚀 Get Started Free
          </Link>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-blue-900 text-white px-4 py-6">
        <h2 className="text-xl font-bold mb-1">Orgz<span className="text-yellow-400">ify</span></h2>
        <p className="text-blue-200 text-xs mb-4">India's smartest event management and participant tracking platform.</p>

        <div className="flex gap-3 mb-5">
          {[
            { icon: "f", label: "Facebook" },
            { icon: "in", label: "Instagram" },
            { icon: "𝕏", label: "Twitter" },
            { icon: "▶", label: "YouTube" },
            { icon: "li", label: "LinkedIn" },
          ].map((s) => (
            <a
              key={s.label}
              href="#"
              aria-label={s.label}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition text-xs font-bold"
            >
              {s.icon}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-5">
          <div>
            <p className="font-semibold text-sm mb-2">Platform</p>
            <div className="flex flex-col gap-1.5 text-xs text-blue-200">
              <Link href="/events" className="hover:text-white transition">Events</Link>
              <Link href="/login" className="hover:text-white transition">Login</Link>
              <Link href="/register" className="hover:text-white transition">Register</Link>
              <a href="#features" className="hover:text-white transition">Features</a>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-2">Support</p>
            <div className="flex flex-col gap-1.5 text-xs text-blue-200">
              <a href="#" className="hover:text-white transition">FAQ</a>
              <a href="#" className="hover:text-white transition">Contact Us</a>
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mb-5">
          <p className="font-semibold text-sm mb-1">Newsletter</p>
          <p className="text-blue-200 text-xs mb-3">Stay updated with events in your city</p>
          <input
            type="email"
            placeholder="Your email"
            className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:border-white mb-2"
          />
          <button className="w-full bg-yellow-400 text-blue-900 py-2 rounded-full text-sm font-semibold hover:bg-yellow-300 transition">
            Subscribe
          </button>
        </div>

        <div className="border-t border-white/10 pt-3 flex flex-col gap-1">
          <p className="text-blue-300 text-xs">© 2025 Orgzify. All rights reserved.</p>
          <p className="text-blue-300 text-xs">Orgzify is a free platform. We support our services through Google advertising revenue.</p>
        </div>
      </footer>
    </div>
  );
}
