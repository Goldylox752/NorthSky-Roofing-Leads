export const metadata = {
  title: "RoofFlow",
  description: "We book qualified roofing appointments directly into your pipeline.",
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
    fontFamily: "Arial, sans-serif",
  },
};
