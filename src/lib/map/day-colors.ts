/**
 * Stable per-day color palette for map pins + day filter chips. The
 * palette cycles after 10 days — a 15-day trip pairs day 11 with day 1,
 * etc. Colors are picked to be distinguishable on both the MapTiler
 * Streets tileset (cool greys/blues) and on white UI backgrounds.
 */
export const DAY_PALETTE = [
  "#E76F51", // coral
  "#2A9D8F", // teal
  "#F4A261", // sand
  "#264653", // deep blue-grey
  "#E9C46A", // mustard
  "#9D4EDD", // purple
  "#43AA8B", // jade
  "#F72585", // magenta
  "#3A86FF", // bright blue
  "#FB5607", // orange
] as const;

export function colorForDay(dayNumber: number): string {
  if (dayNumber < 1) return DAY_PALETTE[0];
  return DAY_PALETTE[(dayNumber - 1) % DAY_PALETTE.length];
}
