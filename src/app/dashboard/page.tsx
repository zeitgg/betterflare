"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRightIcon, DatabaseIcon, CalendarIcon, RefreshCw } from "lucide-react";
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
    }
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
      return format(new Date(bucket.CreationDate), 'PPP');
    }
    
    // Fallback to a placeholder date for demo purposes
    return format(new Date(), 'PPP');
  };

  // Memoize the bucket cards to avoid unnecessary re-renders
  const bucketCards = useMemo(() => {
    if (!buckets.length) return null;
    
    return buckets.map((bucket: any) => (
      <Card 
        key={bucket.Name} 
        className="overflow-hidden transition-all hover:border-primary/50"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            {bucket.Name}
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Created on {getBucketCreationDate(bucket)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground">
            Cloudflare R2 Storage Bucket
          </p>
        </CardContent>
        <CardFooter className="pt-2 flex justify-end">
          <Button 
            variant="ghost" 
            className="gap-1 hover:bg-primary hover:text-primary-foreground"
            onClick={() => handleNavigateToBucket(bucket.Name!)}
          >
            View Objects
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    ));
  }, [buckets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your Cloudflare R2 buckets
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading || validateCredentialsMutation.isPending || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading || validateCredentialsMutation.isPending ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter className="pt-2">
                <Skeleton className="h-9 w-28 ml-auto" />
              </CardFooter>
            </Card>
          ))
        ) : buckets.length > 0 ? (
          bucketCards
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border rounded-lg">
            <DatabaseIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Buckets Found</h2>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any R2 buckets in your Cloudflare account yet.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.open('https://dash.cloudflare.com/', '_blank')}
            >
              Create a Bucket in Cloudflare
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
