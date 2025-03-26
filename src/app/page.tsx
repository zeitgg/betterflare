"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudIcon, ShieldIcon, KeyIcon, DatabaseIcon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { credentials, isAuthenticated, setCredentials } = useCredentialsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    endpoint: "",
  });

  // Check if user is already authenticated
  useEffect(() => {
    // Add a small delay to ensure the store is hydrated from localStorage
    const timer = setTimeout(() => {
      if (isAuthenticated && credentials) {
        router.push("/dashboard");
      }
      setIsCheckingAuth(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, credentials, router]);

  const validateCredentialsMutation = trpc.r2.validateCredentials.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.success) {
        setCredentials(formData);
        toast.success("Successfully connected to Cloudflare R2");
        router.push("/dashboard");
      } else {
        toast.error("Failed to connect to Cloudflare R2. Please check your credentials.");
      }
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    validateCredentialsMutation.mutate(formData);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mb-4">
            <svg className="w-8 h-8" viewBox="0 0 128 112" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M64 0L0 112H128L64 0ZM65.3409 20.8783L109.442 97.3554L65.3409 71.0532V20.8783Z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">BetterFlare</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Cloudflare R2 buckets with ease
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect to Cloudflare R2</CardTitle>
            <CardDescription>
              Enter your Cloudflare R2 credentials to get started. Your credentials are stored locally in your browser.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountId" className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" />
                  Account ID
                </Label>
                <Input
                  id="accountId"
                  name="accountId"
                  placeholder="Your Cloudflare Account ID"
                  value={formData.accountId}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accessKeyId" className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  Access Key ID
                </Label>
                <Input
                  id="accessKeyId"
                  name="accessKeyId"
                  placeholder="Your R2 Access Key ID"
                  value={formData.accessKeyId}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secretAccessKey" className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  Secret Access Key
                </Label>
                <Input
                  id="secretAccessKey"
                  name="secretAccessKey"
                  type="password"
                  placeholder="Your R2 Secret Access Key"
                  value={formData.secretAccessKey}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="flex items-center gap-2">
                  <DatabaseIcon className="h-4 w-4" />
                  Custom Endpoint (Optional)
                </Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  placeholder="https://your-account-id.r2.cloudflarestorage.com"
                  value={formData.endpoint}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default endpoint
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !formData.accountId || !formData.accessKeyId || !formData.secretAccessKey}
              >
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Your credentials are stored only in your browser's local storage and are never sent to our servers.
        </p>
      </div>
    </div>
  );
}
