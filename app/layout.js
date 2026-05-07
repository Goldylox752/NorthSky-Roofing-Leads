export const metadata = {
  title: "NorthSky Flow OS",
  description: "Automated lead + payment system for contractors and agencies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial", background: "#0b0f19", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}