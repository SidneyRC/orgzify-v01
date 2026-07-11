import Navbar from "@/components/shared/OREV1-026-Navbar";
import CustomerContextSync from "@/components/shared/OREV1-053-CustomerContextSync";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerContextSync />
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
