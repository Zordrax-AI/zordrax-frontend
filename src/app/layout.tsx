import "./globals.css";
import TopNav from "@/components/nav/top-nav";

export const metadata = {
  title: "Zordrax Analytica",
  description: "AI Orchestrated Data Infrastructure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <TopNav />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
