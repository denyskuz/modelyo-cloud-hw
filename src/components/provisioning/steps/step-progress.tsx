"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function StepProgress({ messages }: { messages: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provisioning</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {messages.map((msg, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              {msg}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
