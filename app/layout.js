import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://northsky-flow-os.onrender.com"),

  title: {
    default: "RoofFlow | Exclusive Roofing Leads",
    template: "%s | RoofFlow",
  },

  description:
    "Exclusive, high-intent roofing leads delivered directly to contractors. No shared leads. No wasted ad spend. Just booked jobs.",

  keywords: [
    "roofing leads",
    "exclusive contractor leads",
    "roofing appointments",
    "lead generation for roofers",
    "contractor marketing system",
  ],

  authors: [{ name: "RoofFlow" }],
  creator: "RoofFlow",

  openGraph: {
    title: "RoofFlow | Exclusive Roofing Leads",
    description:
      "Get high-intent homeowners requesting roofing quotes delivered straight to you.",
    url: "https://northsky-flow-os.onrender.com",
    siteName: "RoofFlow",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "RoofFlow | Roofing Leads That Convert",
    description:
      "Stop chasing leads. Start closing jobs with RoofFlow.",
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://northsky-flow-os.onrender.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}