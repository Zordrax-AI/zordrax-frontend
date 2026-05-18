import "../src/app/globals.css";
import ZordraxNav from "./zordrax-nav";

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
      <body>
        <ZordraxNav />
        {children}
      </body>
    </html>
  );
}
