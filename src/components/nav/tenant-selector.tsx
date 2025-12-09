"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState, useEffect } from "react";

export default function TenantSelector() {
  const [tenant, setTenant] = useState("default");

  useEffect(() => {
    const saved = localStorage.getItem("tenant");
    if (saved) setTenant(saved);
  }, []);

  function changeTenant(val: string) {
    setTenant(val);
    localStorage.setItem("tenant", val);
  }

  return (
    <Select value={tenant} onValueChange={changeTenant}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select Tenant" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default Tenant</SelectItem>
        <SelectItem value="healthcare">Healthcare Org</SelectItem>
        <SelectItem value="finance">Finance Group</SelectItem>
        <SelectItem value="acme">Acme Corp</SelectItem>
      </SelectContent>
    </Select>
  );
}
