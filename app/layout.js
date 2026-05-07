export const metadata = {
  title: "NorthSky Flow OS | Automated Lead Generation for Contractors",
  description:
    "NorthSky Flow OS helps roofing, HVAC, and home service businesses get high-intent, pre-qualified customers automatically — without ads agencies or wasted spend.",
  keywords:
    "lead generation, roofing leads, HVAC leads, contractor marketing, automated leads, home service marketing",
  openGraph: {
    title: "NorthSky Flow OS",
    description:
      "Automated high-intent lead generation system for contractors.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b0f19" />
      </head>

      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          background: "#0b0f19",
          color: "#fff",
          lineHeight: 1.5,
        }}
      >
        {children}
      </body>
    </html>
  );
}