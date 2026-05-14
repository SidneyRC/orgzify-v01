interface Props {
  phoneMatch: boolean; setPhoneMatch: (v: boolean) => void; phone: string; setPhone: (v: string) => void;
  wpMatch:    boolean; setWpMatch:    (v: boolean) => void; wp:    string; setWp:    (v: string) => void;
  emailMatch: boolean; setEmailMatch: (v: boolean) => void; email: string; setEmail: (v: string) => void;
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 mb-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600 rounded" />
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}

function PhoneField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3 ml-4">
      <label className="block text-sm text-gray-500 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none w-24">
          <option>🇮🇳 +91</option>
        </select>
        <input type="tel" value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit number" maxLength={10}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
      </div>
    </div>
  );
}

export default function ContactToggles({
  phoneMatch, setPhoneMatch, phone, setPhone,
  wpMatch,    setWpMatch,    wp,    setWp,
  emailMatch, setEmailMatch, email, setEmail,
}: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Contact Details</p>

      <ToggleRow label="Phone same as master profile"     checked={phoneMatch} onChange={setPhoneMatch} />
      {!phoneMatch && <PhoneField label="Phone Number"     value={phone} onChange={setPhone} />}

      <ToggleRow label="WhatsApp same as master profile"  checked={wpMatch}    onChange={setWpMatch} />
      {!wpMatch    && <PhoneField label="WhatsApp Number"  value={wp}    onChange={setWp} />}

      <ToggleRow label="Email same as master profile"     checked={emailMatch} onChange={setEmailMatch} />
      {!emailMatch && (
        <div className="mb-3 ml-4">
          <label className="block text-sm text-gray-500 mb-1.5">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
      )}
    </div>
  );
}
