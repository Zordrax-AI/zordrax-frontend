"use client";

import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const path = usePathname().split("/").filter(Boolean);

  let link = "";

  return (
    <nav className="text-sm text-gray-600 dark:text-gray-300">
      {path.map((segment, i) => {
        link += `/${segment}`;
        return (
          <span key={link}>
            <a href={link} className="capitalize hover:underline">
              {segment}
            </a>
            {i < path.length - 1 && " / "}
          </span>
        );
      })}
    </nav>
  );
}
