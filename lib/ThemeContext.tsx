"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ─────────────────────────────────────────
// THEME SHAPE — matches company_themes table
// ─────────────────────────────────────────

export interface Theme {
  id: string;
  theme_name: string;
  // Brand
  color_primary: string;        color_secondary: string;
  color_accent: string;         color_background: string;
  color_surface: string;        color_border: string;
  // Text
  color_text_primary: string;   color_text_secondary: string;
  color_text_muted: string;
  // Buttons — primary
  btn_bg: string;               btn_text: string;
  btn_border: string;           btn_hover_bg: string;
  btn_hover_text: string;       btn_disabled_bg: string;
  btn_disabled_text: string;    btn_border_radius: string;
  // Buttons — outline
  btn_outline_bg: string;       btn_outline_text: string;
  btn_outline_border: string;   btn_outline_hover_bg: string;
  // States
  color_focus_ring: string;     color_active: string;
  color_selected: string;
  // Toggles
  toggle_on: string;            toggle_off: string;
  // Inputs
  input_border: string;         input_focus_border: string;
  input_bg: string;
  // Cards
  card_shadow: string;          global_border_radius: string;
  // Page & Topbar
  page_bg: string;              topbar_bg: string;
  topbar_border: string;
  // Sidebar
  sidebar_bg: string;           sidebar_text: string;
  sidebar_active_bg: string;    sidebar_active_text: string;
  sidebar_hover_bg: string;
  // Table
  table_header_bg: string;      table_header_text: string;
  table_row_hover: string;      table_border: string;
  table_cell_text: string;
  // Dropdown
  dropdown_bg: string;          dropdown_border: string;
  dropdown_hover_bg: string;
  // Links
  link_color: string;           link_hover_color: string;
  // Badges
  badge_success_bg: string;     badge_success_text: string;
  badge_warning_bg: string;     badge_warning_text: string;
  badge_error_bg: string;       badge_error_text: string;
  // Modal
  modal_bg: string;             modal_overlay: string;
  // Avatar & Misc
  avatar_bg: string;            avatar_text: string;
  notification_dot: string;     divider_color: string;
  carousel_from: string;        carousel_to: string;
  // Mobile
  mobile_header_bg: string;
}

// ─────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  setTheme: () => {},
});

// ─────────────────────────────────────────
// PROVIDER — wrap shell children with this
// ─────────────────────────────────────────

export function ThemeProvider({ children, initial }: { children: ReactNode; initial?: Theme | null }) {
  const [theme, setTheme] = useState<Theme | null>(initial ?? null);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────
// HOOK — call this in any page to get theme
// Usage: const { theme } = useTheme()
// ─────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext);
}
