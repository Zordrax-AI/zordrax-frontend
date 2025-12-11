import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "Zordrax-Analytica Console",
  description: "AI-augmented onboarding and orchestration console"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
