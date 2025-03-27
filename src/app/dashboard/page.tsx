"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DatabaseIcon,
  CalendarIcon,
  RefreshCw,
  ChevronRightIcon,
} from "lucide-react";
import { CreateBucketDialog } from "@/components/dashboard/create-bucket-dialog";
import { BucketContextMenu } from "@/components/dashboard/bucket-context-menu";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const { credentials } = useCredentialsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use mutation instead of query for validateCredentials
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

  // Call the mutation when the component mounts
  useEffect(() => {
    if (credentials) {
      validateCredentialsMutation.mutate(credentials);
    } else {
      setIsLoading(false);
    }
  }, [credentials]);

  // Prefetch the first few bucket pages for faster navigation
  useEffect(() => {
    if (buckets.length > 0) {
      // Limit to first 3 buckets to avoid too many prefetch requests
      buckets.slice(0, 3).forEach((bucket: any) => {
        if (bucket.Name) {
          // Use Next.js router to prefetch the page
          router.prefetch(`/dashboard/bucket/${bucket.Name}`);
        }
      });
    }
  }, [buckets, router]);

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    validateCredentialsMutation.mutate(credentials!);

    // Add a small delay to make the animation visible even for fast refreshes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleNavigateToBucket = (bucketName: string) => {
    router.push(`/dashboard/bucket/${bucketName}`);
  };

  // Get a formatted date for bucket creation
  const getBucketCreationDate = (bucket: any) => {
    // If CreationDate is available, format it
    if (bucket.CreationDate) {
      return format(new Date(bucket.CreationDate), "MMM d, yyyy");
    }

    // Fallback to a placeholder date for demo purposes
    return format(new Date(), "MMM d, yyyy");
  };

  // Memoize the bucket cards to avoid unnecessary re-renders
  // State for context menu position and visibility
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    bucketName: string;
  }>({ visible: false, x: 0, y: 0, bucketName: "" });

  // Handle right-click on bucket card
  const handleContextMenu = (e: React.MouseEvent, bucketName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      bucketName,
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const bucketCards = useMemo(() => {
    if (!buckets.length) return null;

    return buckets.map((bucket: any) => (
      <div
        key={bucket.Name}
        className="group relative flex flex-col p-5 bg-card border border-border rounded-md hover:border-primary/30 transition-all cursor-pointer"
        onClick={() => handleNavigateToBucket(bucket.Name!)}
        onContextMenu={(e) => handleContextMenu(e, bucket.Name!)}
        style={{
          animation: "slide-up 0.3s ease forwards",
          animationFillMode: "both",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium">{bucket.Name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <BucketContextMenu
              bucketName={bucket.Name!}
              onBucketDeleted={handleRefresh}
              onNavigate={() => handleNavigateToBucket(bucket.Name!)}
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          <CalendarIcon className="h-3 w-3" />
          {getBucketCreationDate(bucket)}
        </div>

        <p className="text-sm text-muted-foreground mt-auto">
          Cloudflare R2 Storage Bucket
        </p>
      </div>
    ));
  }, [buckets]);

  // Render the floating context menu when visible
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    return (
      <div
        className="fixed z-50"
        style={{
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
        }}
      >
        <BucketContextMenu
          bucketName={contextMenu.bucketName}
          onBucketDeleted={handleRefresh}
          onNavigate={() => handleNavigateToBucket(contextMenu.bucketName)}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {renderContextMenu()}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Buckets</h1>
          <p className="text-muted-foreground text-sm">
            Manage your Cloudflare R2 storage buckets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateBucketDialog onBucketCreated={handleRefresh} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={
              isLoading || validateCredentialsMutation.isPending || isRefreshing
            }
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading || validateCredentialsMutation.isPending ? (
          // Skeleton loading state with Linear-style pulse animation
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col p-5 bg-card border border-border rounded-md"
              style={{
                animation: `pulse 2s infinite ease-in-out`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 rounded-full bg-muted"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-3 w-24 bg-muted rounded mb-3"></div>
              <div className="h-4 w-full bg-muted rounded mt-auto"></div>
            </div>
          ))
        ) : buckets.length > 0 ? (
          bucketCards
        ) : (
          <div
            className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-md text-center"
            style={{ animation: "fade-in 0.5s ease forwards" }}
          >
            <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No Buckets Found</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You don't have any R2 buckets in your Cloudflare account yet.
              Create one to get started.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                window.open("https://dash.cloudflare.com/", "_blank")
              }
              className="gap-2"
            >
              <DatabaseIcon className="h-4 w-4" />
              Create a Bucket in Cloudflare
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
