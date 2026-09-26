/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#20342B',
    tint: '#39785D',
    background: '#F4F5EF',
    foreground: '#20342B',
    card: '#FFFFFF',
    cardForeground: '#20342B',
    primary: '#39785D',
    primaryForeground: '#FFFFFF',
    secondary: '#E8EEE8',
    secondaryForeground: '#294536',
    muted: '#E9EDE7',
    mutedForeground: '#78857B',
    accent: '#E8D9B9',
    accentForeground: '#4D4029',
    destructive: '#C45F55',
    destructiveForeground: '#FFFFFF',
    border: '#DDE4DC',
    input: '#DDE4DC',
  },

  dark: {
    text: '#EDF2EA',
    tint: '#A5CFB1',
    background: '#111A15',
    foreground: '#EDF2EA',
    card: '#1B2820',
    cardForeground: '#EDF2EA',
    primary: '#8FBE9B',
    primaryForeground: '#142019',
    secondary: '#27362D',
    secondaryForeground: '#DCE9DE',
    muted: '#25332A',
    mutedForeground: '#A1AEA3',
    accent: '#665535',
    accentForeground: '#F2E7D1',
    destructive: '#D57A70',
    destructiveForeground: '#1A1716',
    border: '#304137',
    input: '#304137',
  },

  radius: 20,
};

export default colors;
