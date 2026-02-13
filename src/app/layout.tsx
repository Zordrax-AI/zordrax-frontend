import "./globals.css";
import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata = {
  title: "Zordrax Analytica",
  description: "AI-driven analytics onboarding platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[var(--bg)] text-[var(--fg)]">
        <ThemeProvider>
          <Navbar />
          <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
