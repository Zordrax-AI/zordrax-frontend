import "./globals.css";

export const metadata = {
  title: "Zordrax Analytica Onboarding Wizard",
  description: "AI + Manual onboarding UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
