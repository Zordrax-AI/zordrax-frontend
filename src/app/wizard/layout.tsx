import Sidebar from "@/components/nav/sidebar";
import Breadcrumbs from "@/components/nav/breadcrumb";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 p-8">
        <Breadcrumbs />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
