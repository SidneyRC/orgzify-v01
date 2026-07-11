// OREV1-020A — Profile Card
// Icons: edit, share (opens access panel), unlink (linked spouse only), delete (non-self only)

import StatusBadge from "@/components/shared/OREV1-017-StatusBadge";

interface Props {
  id:             string;
  name:           string;
  relationship:   string;
  photo:          string | null;
  city:           string | null;
  status:         string;
  isShared:       boolean;
  isPrimary:      boolean;
  isLinkedSpouse: boolean;
  onEdit:         () => void;
  onShare:        () => void;
  onViewAccess?:  () => void;
  onUnlink?:      () => void;
  onDelete?:      () => void;
}

function getInitial(name: string): string {
  const parts = name.split(" ");
  const word  = parts.find(p => !p.endsWith(".")) ?? parts[0] ?? "?";
  return word.charAt(0).toUpperCase();
}

const RELATION_COLORS: Record<string, { bg: string; text: string }> = {
  self:     { bg: "#E6F1FB", text: "#0C447C" },
  spouse:   { bg: "#EEEDFE", text: "#3C3489" },
  son:      { bg: "#EAF3DE", text: "#27500A" },
  daughter: { bg: "#EAF3DE", text: "#27500A" },
  father:   { bg: "#FAEEDA", text: "#633806" },
  mother:   { bg: "#FAEEDA", text: "#633806" },
  sibling:  { bg: "#FAECE7", text: "#993C1D" },
  other:    { bg: "#F1EFE8", text: "#5F5E5A" },
};

function getColor(rel: string) {
  return RELATION_COLORS[rel.toLowerCase()] ?? RELATION_COLORS.other;
}

export default function ProfileCard({
  name, relationship, photo, city, status,
  isShared, isPrimary, isLinkedSpouse,
  onEdit, onShare, onUnlink, onDelete,
}: Props) {
  const color = getColor(relationship);
  const label = isPrimary ? "You" : relationship.charAt(0).toUpperCase() + relationship.slice(1);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3">

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: color.bg }}>
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" />
          : <span className="text-lg font-medium" style={{ color: color.text }}>{getInitial(name)}</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
          <span className="text-[11px] rounded-full px-2 py-0.5 flex-shrink-0"
            style={{ background: color.bg, color: color.text }}>{label}</span>
          {isLinkedSpouse && (
            <span className="text-[11px] rounded-full px-2 py-0.5 flex-shrink-0 bg-purple-50 text-purple-700">
            Linked
            </span>
          )}
          {isShared && (
            <span className="text-[11px] rounded-full px-2 py-0.5 flex-shrink-0 bg-green-50 text-green-700">
            Shared
            </span>
          )}
        </div>
        {city && <p className="text-xs text-gray-400 mt-0.5">{city}</p>}
        {status && <div className="mt-1"><StatusBadge status={status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} /></div>}
      </div>

      {/* Icons */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Edit */}
        <button onClick={onEdit} aria-label="Edit profile"
          className="text-gray-400 hover:text-blue-900 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {/* Share — opens access panel */}
        <button onClick={onShare} aria-label="Who has access"
          className={`transition-colors ${isShared ? "text-green-600" : "text-gray-400 hover:text-blue-900"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        {/* Unlink — linked spouse only */}
        {isLinkedSpouse && onUnlink && (
          <button onClick={onUnlink} aria-label="Remove spouse connection"
            className="text-orange-400 hover:text-orange-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        )}
        {/* Delete — non-self only */}
        {!isPrimary && onDelete && (
          <button onClick={onDelete} aria-label="Delete profile"
            className="text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}
