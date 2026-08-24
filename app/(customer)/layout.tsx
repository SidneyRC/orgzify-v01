// app/(customer)/layout.tsx

import { headers } from "next/headers";
import Navbar from "@/components/shared/OREV1-026-Navbar";
import CustomerContextSync from "@/components/shared/OREV1-053-CustomerContextSync";
import CityGate from "@/components/shared/OREV1-139-CityGate";
import { ThemeProvider } from "@/lib/ThemeContext";
import { getResolvedThemeByCity } from "@/lib/getResolvedThemeByCity";

function getCookieValue(cookieHeader: string, name: string) {
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const hasCity = /(^|;\s*)orgzify_city_id=/.test(cookieHeader);
  const cityId = getCookieValue(cookieHeader, "orgzify_city_id");
  const theme = await getResolvedThemeByCity(cityId);

  return (
    <ThemeProvider initial={theme}>
      <div className="min-h-screen bg-gray-50 orgz-customer-area">
        <CustomerContextSync />
        <Navbar theme={theme} />
        <main>{children}</main>
        <CityGate hasCity={hasCity} />
      </div>
    </ThemeProvider>
  );
}