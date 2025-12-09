"use client";

import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const path = usePathname().split("/").filter(Boolean);

  let href = "";

  return (
    <nav className="text-sm text-gray-600 dark:text-gray-300 mb-4">
      {path.map((p, i) => {
        href += `/${p}`;
        return (
          <span key={href}>
            <a href={href} className="capitalize hover:underline">{p}</a>
            {i < path.length - 1 && <span className="mx-1">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
