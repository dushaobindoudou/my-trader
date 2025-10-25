/**
 * List of available font names.
 * This array is used to generate dynamic font classes (e.g., `font-inter`, `font-manrope`).
 *
 * 📝 How to Add a New Font:
 * 1. Add the font name here.
 * 2. Add the font import in layout.tsx
 * 3. Add the new font family to 'globals.css' using CSS variables.
 *
 * Example:
 * fonts.ts           → Add 'roboto' to this array.
 * layout.tsx         → Import from next/font/google
 * globals.css        → Add the new font in the CSS, e.g.:
 *   --font-roboto: 'Roboto', var(--font-sans);
 */
export const fonts = ['inter', 'manrope', 'system'] as const

