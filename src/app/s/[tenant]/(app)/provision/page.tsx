import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProvisionWizard } from "@/components/provisioning/provision-wizard";

export default function ProvisionPage() {
  return (
    <div className="flex min-h-full flex-col gap-6 bg-background p-4 sm:p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Provision
        </h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </header>
      <main className="w-full max-w-3xl mx-auto flex-1 min-w-0">
        <ProvisionWizard />
      </main>
    </div>
  );
}
