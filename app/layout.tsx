import "../src/app/globals.css";

export const metadata = {
  title: "Zordrax-Analytica",
  description: "AI Orchestrator Cockpit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
