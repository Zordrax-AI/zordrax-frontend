"use client";

import { useState, useEffect } from "react";

export default function TenantSelector() {
  const [tenant, setTenant] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("tenant_id");
    if (saved) setTenant(saved);
  }, []);

  function handleChange(value: string) {
    setTenant(value);
    localStorage.setItem("tenant_id", value);
  }

  return (
    <select
      value={tenant}
      onChange={(e) => handleChange(e.target.value)}
      className="border rounded px-3 py-1 text-sm"
    >
      <option value="default">Default Tenant</option>
      <option value="acme">Acme Corp</option>
      <option value="healthcare">Healthcare Group</option>
      <option value="finance">Finance Co</option>
    </select>
  );
}
