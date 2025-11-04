import type { Metadata } from "next";
import "./globals.css";
import Providers from '@/components/providers'

export const metadata: Metadata = {
  title: "Stock Boost Management",
  description: "Manage stock price boosts with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
