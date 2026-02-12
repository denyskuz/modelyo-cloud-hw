"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney } from "@/domain/common/cost";
import { estimateMonthlyCost } from "@/domain/provisioning/cost-estimate";
import type { ProvisionPayload } from "@/domain/provisioning/types";

export function StepReview({
  payload,
  nameError,
}: {
  payload: ProvisionPayload;
  nameError: string | null;
}) {
  const cost = estimateMonthlyCost(payload);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review and confirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4 text-sm">
          <pre className="whitespace-pre-wrap font-sans">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
        <p className="text-sm font-medium">
          Estimated monthly cost: {formatMoney(cost)}
        </p>
        {nameError && (
          <Alert variant="destructive">
            <AlertDescription>{nameError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
