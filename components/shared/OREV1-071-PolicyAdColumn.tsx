type Props = { borderColor: string; textMuted: string; slotCount?: number }

export default function OREV1071PolicyAdColumn({ borderColor, textMuted, slotCount = 3 }: Props) {
  return (
    <div className="w-full lg:w-1/4 flex flex-col gap-4">
      {Array.from({ length: slotCount }, (_, i) => i + 1).map(n => (
        <div key={n} className="flex-1 rounded-xl border border-dashed p-4 text-center text-xs flex items-center justify-center"
          style={{ borderColor, color: textMuted }}>
          Ad space {n}
        </div>
      ))}
    </div>
  )
}