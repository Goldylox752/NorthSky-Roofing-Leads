export const metadata = {
  title: {
    default: "RoofFlow",
    template: "%s | RoofFlow",
  },
  description:
    "RoofFlow books qualified roofing appointments directly into your pipeline so you can focus on closing deals, not chasing leads.",
  keywords: [
    "roofing leads",
    "roofing appointments",
    "contractor leads",
    "roofing CRM",
  ],
  openGraph: {
    title: "RoofFlow",
    description:
      "We deliver qualified roofing appointments directly to contractors.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={styles.body}>{children}</body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    background: "#0b1220",
    color: "white",
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
};
