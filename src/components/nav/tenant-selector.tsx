"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";

export default function TenantSelector() {
  const [tenant, setTenant] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("tenant");
    if (saved) setTenant(saved);
  }, []);

  function handleChange(value: string) {
    setTenant(value);
    localStorage.setItem("tenant", value);
  }

  return (
    <Select value={tenant} onValueChange={handleChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select tenant" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default Tenant</SelectItem>
        <SelectItem value="acme">Acme Corp</SelectItem>
        <SelectItem value="healthcare">Healthcare Org</SelectItem>
        <SelectItem value="finance">Finance Group</SelectItem>
      </SelectContent>
    </Select>
  );
}
