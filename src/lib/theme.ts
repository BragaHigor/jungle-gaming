export const themeCookieName = "canopy-theme";
export type Theme = "dark" | "light";

export function getTheme(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
