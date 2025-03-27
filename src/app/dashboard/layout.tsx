"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { credentials, isHydrated } = useCredentialsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for the store to be hydrated from localStorage
    if (isHydrated) {
      // Short timeout to ensure the store is fully hydrated
      const timer = setTimeout(() => {
        if (!credentials) {
          router.push("/");
        }
        setIsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [credentials, isHydrated, router]);

  // Preload common routes
  useEffect(() => {
    // Prefetch the home page for faster logout navigation
    router.prefetch("/");
    
    // Prefetch the dashboard page
    router.prefetch("/dashboard");
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
