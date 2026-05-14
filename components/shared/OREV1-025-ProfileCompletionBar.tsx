interface ProfileCompletionBarProps {
  completion: number; // 0 to 100
}

export default function ProfileCompletionBar({ completion }: ProfileCompletionBarProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">Profile completion</span>
        <span className="text-xs font-medium text-blue-600">{completion}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div
          className="h-1.5 bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${completion}%` }}
        />
      </div>
    </div>
  );
}
