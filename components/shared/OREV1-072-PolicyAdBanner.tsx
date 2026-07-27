type Props = { borderColor: string; textMuted: string }

export default function OREV1072PolicyAdBanner({ borderColor, textMuted }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white py-2 text-center text-xs z-10"
      style={{ borderColor, color: textMuted }}>
      Ad space (banner)
    </div>
  )
}