// THIS FILE GOES IN: components/shared/OREV1-076-EntityDashboardOfficePanel.tsx (NEW FILE)
"use client";
import { Theme } from "@/lib/ThemeContext";
import { Building2, Mail, Phone } from "lucide-react";

type Office = { company_name: string; address: any; contacts: any } | null;

export default function EntityDashboardOfficePanel({ office, theme, radius }: {
  office: Office; theme: Theme | null; radius: string;
}) {
  const cardStyle = { boxShadow: theme?.card_shadow || "0 1px 3px rgba(0,0,0,0.06)", borderRadius: radius };
  const iconColor = theme?.color_primary || "#1e3a5f";
  const mutedColor = theme?.color_text_muted || "#9ca3af";
  const linkColor = theme?.link_color || "#1e3a5f";
  const dividerColor = theme?.divider_color || "#f3f4f6";

  const contacts = office?.contacts && [
    { label: "Customer Care", email: office.contacts.customer_care_email, phone: office.contacts.customer_care_phone },
    { label: "Escalation", email: office.contacts.escalation_email, phone: office.contacts.escalation_phone },
    { label: "Nodal Officer", email: office.contacts.nodal_email, phone: office.contacts.nodal_phone },
  ].filter(c => c.email || c.phone);

  return (
    <div style={cardStyle} className="bg-white p-5">
      {office && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} color={iconColor} />
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: mutedColor }}>Reporting Office</p>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{office.company_name}</p>
          {office.address && (
            <p className="text-xs mb-4" style={{ color: mutedColor }}>
              {office.address.line1}{office.address.line2 ? `, ${office.address.line2}` : ""}<br />
              {office.address.area}<br />
              {office.address.city}, {office.address.state} - {office.address.pincode}<br />
              {office.address.country}
            </p>
          )}
        </>
      )}
      {contacts?.map((c, i) => (
        <div key={c.label} className="py-3" style={i > 0 ? { borderTop: `1px solid ${dividerColor}` } : {}}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: mutedColor }}>{c.label}</p>
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs mb-1 hover:underline" style={{ color: linkColor }}>
              <Mail size={12} />{c.email}
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: linkColor }}>
              <Phone size={12} />{c.phone}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
