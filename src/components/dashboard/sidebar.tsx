"use client";

import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useBucketStore } from "@/store/bucketStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CloudIcon,
  LogOutIcon,
  SettingsIcon,
  DatabaseIcon,
  HomeIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Sidebar() {
  const router = useRouter();
  const { credentials, clearCredentials } = useCredentialsStore();
  const { currentBucket, setCurrentBucket } = useBucketStore();
  const [buckets, setBuckets] = useState<{ Name?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const validateCredentialsMutation = trpc.r2.validateCredentials.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.success && data.buckets) {
        setBuckets(data.buckets);
      }
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  // Load buckets when the component mounts
  useEffect(() => {
    if (credentials) {
      // Only validate credentials if we haven't loaded buckets yet
      if (buckets.length === 0) {
        validateCredentialsMutation.mutate(credentials);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [credentials]); // Remove validateCredentialsMutation from dependencies

  // Prefetch bucket pages for faster navigation
  useEffect(() => {
    if (buckets.length > 0) {
      // Prefetch the dashboard page
      const dashboardPrefetch = document.createElement("link");
      dashboardPrefetch.rel = "prefetch";
      dashboardPrefetch.href = "/dashboard";
      document.head.appendChild(dashboardPrefetch);

      // Prefetch the first few bucket pages (limit to 3 to avoid too many requests)
      buckets.slice(0, 3).forEach((bucket) => {
        if (bucket.Name) {
          const prefetchLink = document.createElement("link");
          prefetchLink.rel = "prefetch";
          prefetchLink.href = `/dashboard/bucket/${bucket.Name}`;
          document.head.appendChild(prefetchLink);
        }
      });
    }
  }, [buckets]);

  const handleLogout = () => {
    clearCredentials();
    router.push("/");
  };

  const handleSelectBucket = (bucketName: string) => {
    setCurrentBucket(bucketName);
    router.push(`/dashboard/bucket/${bucketName}`);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 128 112"
            fill=""
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M64 0L0 112H128L64 0ZM65.3409 20.8783L109.442 97.3554L65.3409 71.0532V20.8783Z"
              fill="currentColor"
            />
          </svg>
          <span>BetterFlare</span>
          <span className="text-muted-foreground italic font-light tracking-tighter">
            by ZEIT
          </span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              Dashboard
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/dashboard" className="flex items-center">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </div>
          <Separator />
          <div className="px-3 py-2">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              Buckets
            </h2>
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <span className="ml-2 text-xs">Loading buckets...</span>
                </div>
              ) : buckets.length > 0 ? (
                buckets.map((bucket) => (
                  <Button
                    key={bucket.Name}
                    variant={
                      currentBucket === bucket.Name ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => handleSelectBucket(bucket.Name || "")}
                  >
                    <DatabaseIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{bucket.Name}</span>
                    {currentBucket === bucket.Name && (
                      <ChevronRightIcon className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                ))
              ) : (
                <div className="py-2 text-center text-sm text-muted-foreground">
                  No buckets found
                </div>
              )}
            </div>
          </div>
          <Separator />
          <div className="px-3 py-2">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              Settings
            </h2>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button variant="ghost" className="w-full justify-start" disabled>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p>Account ID: {credentials?.accountId.substring(0, 8)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
