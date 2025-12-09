import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import TopNav from "@/components/nav/top-nav";

export const metadata = {
  title: "Zordrax Analytica",
  description: "AI-Orchestrated Data Infrastructure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ThemeProvider>
          <TopNav />
          <main className="pt-20">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
