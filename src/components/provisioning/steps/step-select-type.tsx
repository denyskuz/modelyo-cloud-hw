"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProvisionServiceType } from "@/domain/provisioning/types";

const TYPES: { value: ProvisionServiceType; label: string }[] = [
  { value: "kubernetes", label: "Kubernetes cluster" },
  { value: "gateway", label: "API Gateway" },
  { value: "postgres", label: "PostgreSQL database" },
];

export function StepSelectType({
  value,
  onChange,
}: {
  value: ProvisionServiceType | null;
  onChange: (t: ProvisionServiceType) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select service type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map(({ value: v, label }) => (
            <Button
              key={v}
              variant={value === v ? "default" : "outline"}
              onClick={() => onChange(v)}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
