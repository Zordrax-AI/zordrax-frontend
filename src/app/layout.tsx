import "./globals.css";
import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "Zordrax Analytica",
  description: "AI-driven analytics onboarding platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
