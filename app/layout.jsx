import "./globals.css";

export const metadata = {
  title: "MRXCEPTION",
  description: "Knives Out",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
