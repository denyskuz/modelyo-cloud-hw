"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailLayoutProps {
  title: string;
  badges: React.ReactNode;
  overview: React.ReactNode;
  activity: React.ReactNode;
}

export function DetailLayout({
  title,
  badges,
  overview,
  activity,
}: DetailLayoutProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <div
          id="detail-header-actions"
          className="flex flex-wrap items-center justify-end gap-2"
          suppressHydrationWarning
        />
      </header>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <div className="flex flex-wrap gap-2">{badges}</div>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          {overview}
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          {activity}
        </TabsContent>
      </Tabs>
    </div>
  );
}
