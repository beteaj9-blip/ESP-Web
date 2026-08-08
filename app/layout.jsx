import "./globals.css";

export const metadata = {
  title: "MRXCEPTION Web ESP",
  description: "Knives Out Web ESP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
