"use client";

import { useState, useEffect } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { credentials, setCredentials, isHydrated } = useCredentialsStore();
  const [formData, setFormData] = useState({
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    endpoint: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (isHydrated && credentials) {
      setFormData({
        accountId: credentials.accountId,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        endpoint: credentials.endpoint || "",
      });
    }

    // Check if dark mode is enabled
    if (typeof window !== "undefined") {
      setDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, [credentials, isHydrated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setCredentials({
        accountId: formData.accountId,
        accessKeyId: formData.accessKeyId,
        secretAccessKey: formData.secretAccessKey,
        endpoint: formData.endpoint || undefined,
      });

      setIsLoading(false);
      toast.success("Settings updated successfully");
    }, 800);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", newDarkMode);
      localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="container mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button
              size="sm"
              variant="ghost"
              className="hover:cursor-pointer text-xs text-muted-foreground hover:text-white transition-colors duration-300"
            >
              <ChevronLeft />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how BetterFlare looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes.{" "}
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare R2 Credentials</CardTitle>
              <CardDescription>
                Update your Cloudflare R2 credentials to connect to your buckets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    placeholder="Your Cloudflare Account ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessKeyId">Access Key ID</Label>
                  <Input
                    id="accessKeyId"
                    name="accessKeyId"
                    value={formData.accessKeyId}
                    onChange={handleInputChange}
                    placeholder="Your R2 Access Key ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                  <Input
                    id="secretAccessKey"
                    name="secretAccessKey"
                    type="password"
                    value={formData.secretAccessKey}
                    onChange={handleInputChange}
                    placeholder="Your R2 Secret Access Key"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endpoint">Custom Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    name="endpoint"
                    value={formData.endpoint}
                    onChange={handleInputChange}
                    placeholder="https://custom-endpoint.r2.cloudflarestorage.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave blank to use the default Cloudflare R2 endpoint
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
