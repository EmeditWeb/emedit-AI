"use client";

import {
  Bebas_Neue,
  Caveat,
  DM_Sans,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Nunito,
  Playfair_Display,
  Poppins,
  Raleway,
  Space_Grotesk,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-canvas-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-canvas-space-grotesk",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-canvas-poppins",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-canvas-nunito",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-canvas-raleway",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-canvas-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-canvas-playfair",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-canvas-merriweather",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-canvas-jetbrains-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-canvas-caveat",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-canvas-bebas",
  display: "swap",
});

export const CANVAS_FONT_VARIABLES = [
  inter,
  spaceGrotesk,
  poppins,
  nunito,
  raleway,
  dmSans,
  playfairDisplay,
  merriweather,
  jetbrainsMono,
  caveat,
  bebasNeue,
]
  .map((font) => font.variable)
  .join(" ");

export interface CanvasFontOption {
  key: string;
  label: string;
  cssVar: string;
}

export const CANVAS_FONTS: CanvasFontOption[] = [
  { key: "geist", label: "Geist", cssVar: "var(--font-geist-sans)" },
  { key: "inter", label: "Inter", cssVar: "var(--font-canvas-inter)" },
  {
    key: "space-grotesk",
    label: "Space Grotesk",
    cssVar: "var(--font-canvas-space-grotesk)",
  },
  { key: "poppins", label: "Poppins", cssVar: "var(--font-canvas-poppins)" },
  { key: "nunito", label: "Nunito", cssVar: "var(--font-canvas-nunito)" },
  { key: "raleway", label: "Raleway", cssVar: "var(--font-canvas-raleway)" },
  { key: "dm-sans", label: "DM Sans", cssVar: "var(--font-canvas-dm-sans)" },
  {
    key: "playfair",
    label: "Playfair Display",
    cssVar: "var(--font-canvas-playfair)",
  },
  {
    key: "merriweather",
    label: "Merriweather",
    cssVar: "var(--font-canvas-merriweather)",
  },
  {
    key: "jetbrains-mono",
    label: "JetBrains Mono",
    cssVar: "var(--font-canvas-jetbrains-mono)",
  },
  { key: "caveat", label: "Caveat", cssVar: "var(--font-canvas-caveat)" },
  {
    key: "bebas",
    label: "Bebas Neue",
    cssVar: "var(--font-canvas-bebas)",
  },
];

export const DEFAULT_FONT_KEY = "geist";

export const fontCssVar = (key: string): string =>
  CANVAS_FONTS.find((option) => option.key === key)?.cssVar ??
  "var(--font-geist-sans)";
