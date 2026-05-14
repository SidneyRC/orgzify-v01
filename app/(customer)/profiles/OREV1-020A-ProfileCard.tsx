import StatusBadge from "@/components/shared/OREV1-017-StatusBadge";

interface Props {
  name:         string;
  relationship: string;
  dob:          string;
  photo:        string | null;
  status:       string;
  canEdit:      boolean;
  onEdit:       () => void;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

export default function ProfileCard({ name, relationship, dob, photo, status, canEdit, onEdit }: Props) {
  const age = getAge(dob);

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm hover:shadow-md transition-shadow">

      {/* Avatar */}
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 bg-gray-50">
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" />
          : <span className="text-3xl text-gray-300">👤</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-[13px] text-gray-400 mt-0.5 mb-2">{relationship} · {age} yrs</p>
        <StatusBadge status={status} />
      </div>

      {/* Edit — only if user has rights */}
      {canEdit && (
        <button onClick={onEdit}
          className="text-[14px] font-semibold text-[#1D3A8A] hover:underline flex-shrink-0 px-2 py-1">
          Edit
        </button>
      )}
    </div>
  );
}
