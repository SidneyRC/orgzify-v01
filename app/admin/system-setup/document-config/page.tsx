'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type DocFormat = 'JPEG' | 'PNG' | 'PDF' | 'DOCX';

interface Document {
  id: string;
  name: string;
  formats: DocFormat[];
  active: boolean;
  mandatory: boolean;
}

interface CompanyType {
  id: string;
  label: string;
  active: boolean;
}

// ─────────────────────────────────────────────
// SEED DATA (replace with DB fetch)
// ─────────────────────────────────────────────
const SEED_COMPANY_TYPES: CompanyType[] = [
  { id: 'pvt', label: 'Pvt Ltd', active: true },
  { id: 'llp', label: 'LLP', active: true },
  { id: 'partnership', label: 'Partnership', active: true },
  { id: 'trust', label: 'Trust', active: false },
];

const SEED_PERSONAL_DOCS: Document[] = [
  { id: 'p1', name: 'Aadhaar Card', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
  { id: 'p2', name: 'PAN Card', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
  { id: 'p3', name: 'Passport', formats: ['JPEG', 'PDF'], active: true, mandatory: false },
  { id: 'p4', name: 'Voter ID', formats: ['JPEG', 'PNG'], active: false, mandatory: false },
];

const SEED_COMPANY_DOCS: Record<string, Document[]> = {
  pvt: [
    { id: 'c1', name: 'Company PAN', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
    { id: 'c2', name: 'GST Certificate', formats: ['PDF'], active: true, mandatory: true },
    { id: 'c3', name: 'MOA', formats: ['PDF'], active: true, mandatory: true },
    { id: 'c4', name: 'AOA', formats: ['PDF'], active: true, mandatory: true },
    { id: 'c5', name: 'Board Resolution', formats: ['PDF'], active: true, mandatory: false },
    { id: 'c6', name: 'Cancelled Cheque Leaf', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
  ],
  llp: [
    { id: 'l1', name: 'LLP Agreement', formats: ['PDF'], active: true, mandatory: true },
    { id: 'l2', name: 'Certificate of Incorporation', formats: ['PDF'], active: true, mandatory: true },
    { id: 'l3', name: 'Company PAN', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
  ],
  partnership: [
    { id: 'pa1', name: 'Partnership Deed', formats: ['PDF'], active: true, mandatory: true },
    { id: 'pa2', name: 'Company PAN', formats: ['JPEG', 'PDF'], active: true, mandatory: true },
  ],
  trust: [
    { id: 't1', name: 'Trust Deed', formats: ['PDF'], active: true, mandatory: true },
    { id: 't2', name: 'Registration Certificate', formats: ['PDF'], active: true, mandatory: true },
  ],
};

const ALL_FORMATS: DocFormat[] = ['JPEG', 'PNG', 'PDF', 'DOCX'];

// ─────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────

/** Toggle switch */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-1
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-blue-900' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

/** Format badge */
function FormatBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-medium text-blue-900 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 mr-1">
      {label}
    </span>
  );
}

/** Section card wrapper */
function SectionCard({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="self-start sm:self-auto">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Add/Edit Document Modal */
function DocModal({
  doc,
  onSave,
  onClose,
}: {
  doc: Partial<Document> | null;
  onSave: (d: Document) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(doc?.name ?? '');
  const [formats, setFormats] = useState<DocFormat[]>(doc?.formats ?? []);
  const [active, setActive] = useState(doc?.active ?? true);
  const [mandatory, setMandatory] = useState(doc?.mandatory ?? false);
  const [error, setError] = useState('');

  const toggleFormat = (f: DocFormat) => {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Document name is required.'); return; }
    if (formats.length === 0) { setError('Select at least one accepted format.'); return; }
    onSave({
      id: doc?.id ?? `doc_${Date.now()}`,
      name: name.trim(),
      formats,
      active,
      mandatory: active ? mandatory : false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            {doc?.id ? 'Edit Document' : 'Add Document'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Company PAN"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Formats */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Accepted Formats</label>
            <div className="flex gap-2 flex-wrap">
              {ALL_FORMATS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFormat(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${formats.includes(f)
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-900'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">Active</p>
              <p className="text-xs text-gray-400">Show this field to applicants</p>
            </div>
            <Toggle checked={active} onChange={() => { setActive(p => !p); if (active) setMandatory(false); }} />
          </div>

          {/* Mandatory */}
          <div className={`flex items-center justify-between ${!active ? 'opacity-40' : ''}`}>
            <div>
              <p className="text-xs font-medium text-gray-700">Mandatory</p>
              <p className="text-xs text-gray-400">Applicant must upload this document</p>
            </div>
            <Toggle checked={mandatory} onChange={() => setMandatory(p => !p)} disabled={!active} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition"
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}

/** Company Type Modal */
function CompanyTypeModal({
  type,
  onSave,
  onClose,
}: {
  type: Partial<CompanyType> | null;
  onSave: (t: CompanyType) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(type?.label ?? '');
  const [active, setActive] = useState(type?.active ?? true);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!label.trim()) { setError('Company type name is required.'); return; }
    onSave({ id: type?.id ?? `ct_${Date.now()}`, label: label.trim(), active });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">
            {type?.id ? 'Edit Company Type' : 'Add Company Type'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Pvt Ltd"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">Active</p>
            <Toggle checked={active} onChange={() => setActive(p => !p)} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DOCUMENT TABLE (reused for personal + company)
// ─────────────────────────────────────────────
function DocTable({
  docs,
  onToggleActive,
  onToggleMandatory,
  onEdit,
  onDelete,
}: {
  docs: Document[];
  onToggleActive: (id: string) => void;
  onToggleMandatory: (id: string) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
}) {
  if (docs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No documents configured yet. Click + Add document to begin.</p>;
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop table */}
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
            <th className="text-left font-medium pb-2 pr-4">Document Name</th>
            <th className="text-left font-medium pb-2 pr-4">Accepted Formats</th>
            <th className="text-center font-medium pb-2 pr-4">Active</th>
            <th className="text-center font-medium pb-2 pr-4">Mandatory</th>
            <th className="text-right font-medium pb-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {docs.map(doc => (
            <tr key={doc.id} className={`${!doc.active ? 'opacity-50' : ''}`}>
              <td className="py-3 pr-4 font-medium text-gray-800">{doc.name}</td>
              <td className="py-3 pr-4">
                {doc.formats.map(f => <FormatBadge key={f} label={f} />)}
              </td>
              {/* Active toggle */}
              <td className="py-3 pr-4 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <Toggle checked={doc.active} onChange={() => onToggleActive(doc.id)} />
                  <span className="text-[10px] text-gray-400">{doc.active ? 'Visible' : 'Hidden'}</span>
                </div>
              </td>
              {/* Mandatory toggle */}
              <td className="py-3 pr-4 text-center">
                <div className="flex flex-col items-center gap-0.5">
                  <Toggle checked={doc.mandatory} onChange={() => onToggleMandatory(doc.id)} disabled={!doc.active} />
                  <span className={`text-[10px] ${!doc.active ? 'text-gray-300' : doc.mandatory ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                    {!doc.active ? '—' : doc.mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </div>
              </td>
              {/* Actions */}
              <td className="py-3 text-right">
                <button
                  onClick={() => onEdit(doc)}
                  className="text-gray-400 hover:text-blue-900 transition mr-3"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {docs.map(doc => (
          <div key={doc.id} className={`border border-gray-100 rounded-lg p-4 ${!doc.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium text-gray-800 text-sm">{doc.name}</p>
              <div className="flex gap-2">
                <button onClick={() => onEdit(doc)} className="text-gray-400 hover:text-blue-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(doc.id)} className="text-gray-400 hover:text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mb-3">
              {doc.formats.map(f => <FormatBadge key={f} label={f} />)}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Toggle checked={doc.active} onChange={() => onToggleActive(doc.id)} />
                <span className="text-xs text-gray-500">{doc.active ? 'Visible' : 'Hidden'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={doc.mandatory} onChange={() => onToggleMandatory(doc.id)} disabled={!doc.active} />
                <span className={`text-xs ${!doc.active ? 'text-gray-300' : doc.mandatory ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                  {!doc.active ? '—' : doc.mandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function DocumentConfigPage() {
  // Company Types
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>(SEED_COMPANY_TYPES);
  const [ctModal, setCtModal] = useState<{ open: boolean; type: Partial<CompanyType> | null }>({ open: false, type: null });

  // Personal docs
  const [personalDocs, setPersonalDocs] = useState<Document[]>(SEED_PERSONAL_DOCS);
  const [personalModal, setPersonalModal] = useState<{ open: boolean; doc: Partial<Document> | null }>({ open: false, doc: null });

  // Company docs
  const [companyDocs, setCompanyDocs] = useState<Record<string, Document[]>>(SEED_COMPANY_DOCS);
  const [activeTab, setActiveTab] = useState<string>(SEED_COMPANY_TYPES[0].id);
  const [companyModal, setCompanyModal] = useState<{ open: boolean; doc: Partial<Document> | null }>({ open: false, doc: null });

  // ── Company Type helpers ──
  const saveCompanyType = (t: CompanyType) => {
    setCompanyTypes(prev => prev.find(x => x.id === t.id) ? prev.map(x => x.id === t.id ? t : x) : [...prev, t]);
    if (!companyDocs[t.id]) setCompanyDocs(prev => ({ ...prev, [t.id]: [] }));
    setCtModal({ open: false, type: null });
  };
  const toggleCtActive = (id: string) => setCompanyTypes(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));

  // ── Personal doc helpers ──
  const savePersonalDoc = (doc: Document) => {
    setPersonalDocs(prev => prev.find(d => d.id === doc.id) ? prev.map(d => d.id === doc.id ? doc : d) : [...prev, doc]);
    setPersonalModal({ open: false, doc: null });
  };
  const togglePersonalActive = (id: string) =>
    setPersonalDocs(prev => prev.map(d => d.id === id ? { ...d, active: !d.active, mandatory: d.active ? false : d.mandatory } : d));
  const togglePersonalMandatory = (id: string) =>
    setPersonalDocs(prev => prev.map(d => d.id === id ? { ...d, mandatory: !d.mandatory } : d));
  const deletePersonalDoc = (id: string) => setPersonalDocs(prev => prev.filter(d => d.id !== id));

  // ── Company doc helpers ──
  const saveCompanyDoc = (doc: Document) => {
    setCompanyDocs(prev => ({
      ...prev,
      [activeTab]: prev[activeTab]?.find(d => d.id === doc.id)
        ? prev[activeTab].map(d => d.id === doc.id ? doc : d)
        : [...(prev[activeTab] ?? []), doc],
    }));
    setCompanyModal({ open: false, doc: null });
  };
  const toggleCompanyActive = (id: string) =>
    setCompanyDocs(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(d => d.id === id ? { ...d, active: !d.active, mandatory: d.active ? false : d.mandatory } : d),
    }));
  const toggleCompanyMandatory = (id: string) =>
    setCompanyDocs(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(d => d.id === id ? { ...d, mandatory: !d.mandatory } : d),
    }));
  const deleteCompanyDoc = (id: string) =>
    setCompanyDocs(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(d => d.id !== id) }));

  // Active company types only (for tabs)
  const activeCompanyTypes = companyTypes.filter(t => t.active);

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 py-6">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Document Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Configure documents required for KYC. Changes apply to new registrations only.</p>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 1 — MAIN CONTENT
            ══════════════════════════════════════════ */}

        {/* 1A — Company Types */}
        <SectionCard
          title="Company Types"
          subtitle="Add and manage company types for KYC configuration"
          action={
            <button
              onClick={() => setCtModal({ open: true, type: null })}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 px-3 py-2 rounded-lg transition"
            >
              <span className="text-base leading-none">+</span> Add Type
            </button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {companyTypes.map(t => (
              <div
                key={t.id}
                className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border text-sm font-medium transition
                  ${t.active ? 'bg-blue-900 text-white border-blue-900' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
              >
                <span>{t.label}</span>
                <button
                  onClick={() => setCtModal({ open: true, type: t })}
                  className={`hover:opacity-70 transition ${t.active ? 'text-blue-200' : 'text-gray-400'}`}
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleCtActive(t.id)}
                  className={`hover:opacity-70 transition ${t.active ? 'text-blue-200' : 'text-gray-400'}`}
                  title={t.active ? 'Disable' : 'Enable'}
                >
                  {t.active
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  }
                </button>
              </div>
            ))}
            {companyTypes.length === 0 && (
              <p className="text-sm text-gray-400">No company types added yet.</p>
            )}
          </div>
        </SectionCard>

        {/* 1B — Personal Documents */}
        <SectionCard
          title="Personal Documents"
          subtitle="Documents required from individual applicants during KYC"
          action={
            <button
              onClick={() => setPersonalModal({ open: true, doc: null })}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 px-3 py-2 rounded-lg transition"
            >
              <span className="text-base leading-none">+</span> Add document
            </button>
          }
        >
          <DocTable
            docs={personalDocs}
            onToggleActive={togglePersonalActive}
            onToggleMandatory={togglePersonalMandatory}
            onEdit={doc => setPersonalModal({ open: true, doc })}
            onDelete={deletePersonalDoc}
          />
        </SectionCard>

        {/* 1C — Company Documents */}
        <SectionCard
          title="Company Documents"
          subtitle="Configure required documents per company type"
          action={
            activeCompanyTypes.length > 0 ? (
              <button
                onClick={() => setCompanyModal({ open: true, doc: null })}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 px-3 py-2 rounded-lg transition"
              >
                <span className="text-base leading-none">+</span> Add document
              </button>
            ) : null
          }
        >
          {activeCompanyTypes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Enable at least one company type above to configure company documents.</p>
          ) : (
            <>
              {/* Tab bar */}
              <div className="flex gap-1 mb-5 border-b border-gray-100 overflow-x-auto">
                {activeCompanyTypes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-colors
                      ${activeTab === t.id
                        ? 'border-blue-900 text-blue-900 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Docs for active tab */}
              <DocTable
                docs={companyDocs[activeTab] ?? []}
                onToggleActive={toggleCompanyActive}
                onToggleMandatory={toggleCompanyMandatory}
                onEdit={doc => setCompanyModal({ open: true, doc })}
                onDelete={deleteCompanyDoc}
              />
            </>
          )}
        </SectionCard>

        {/* ══════════════════════════════════════════
            SECTION 2 — SIMULATION (REMOVE IN PRODUCTION)
            ══════════════════════════════════════════ */}
        <div className="border-t-2 border-dashed border-gray-300 pt-6 mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Simulation — For Testing Only. Remove in Production.
          </p>
          <p className="text-xs italic text-gray-400 mb-4">DB Connection Pending — remove when connected</p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setPersonalDocs(SEED_PERSONAL_DOCS);
                setCompanyDocs(SEED_COMPANY_DOCS);
                setCompanyTypes(SEED_COMPANY_TYPES);
                setActiveTab(SEED_COMPANY_TYPES[0].id);
                alert('✅ SUCCESS — Simulated: Config loaded from DB');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Simulate Success — Load Config
            </button>

            <button
              onClick={() => {
                setPersonalDocs([]);
                setCompanyDocs({});
                setCompanyTypes([]);
                alert('❌ FAILURE — Simulated: DB fetch failed. No config loaded.');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              Simulate Failure — DB Error
            </button>

            <button
              onClick={() => {
                alert('✅ SUCCESS — Simulated: Config saved to DB');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              Simulate Save Success
            </button>

            <button
              onClick={() => {
                alert('❌ FAILURE — Simulated: Save failed. Please try again.');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              Simulate Save Failure
            </button>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {ctModal.open && (
        <CompanyTypeModal
          type={ctModal.type}
          onSave={saveCompanyType}
          onClose={() => setCtModal({ open: false, type: null })}
        />
      )}
      {personalModal.open && (
        <DocModal
          doc={personalModal.doc}
          onSave={savePersonalDoc}
          onClose={() => setPersonalModal({ open: false, doc: null })}
        />
      )}
      {companyModal.open && (
        <DocModal
          doc={companyModal.doc}
          onSave={saveCompanyDoc}
          onClose={() => setCompanyModal({ open: false, doc: null })}
        />
      )}
    </div>
  );
}
