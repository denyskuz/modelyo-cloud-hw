import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TenantHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <main className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome to Modelyo
        </h1>
        <p className="text-lg text-muted-foreground">
          Get started by going to the dashboard.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </main>
    </div>
  );
}
