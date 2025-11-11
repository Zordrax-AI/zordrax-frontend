import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zordrax Analytica | Deploy Console",
  description: "Trigger AI-driven or manual infrastructure deployments.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
