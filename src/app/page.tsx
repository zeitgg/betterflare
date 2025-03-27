"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { OnboardingFlow } from "@/components/onboarding-flow"; // Import the OnboardingFlow

// Keep only necessary imports
// Removed: CloudIcon, DatabaseIcon, KeyIcon, ShieldIcon, toast, trpc, Card*, Label, Input, Button

export default function Home() {
  const router = useRouter();
  const { credentials, isAuthenticated } = useCredentialsStore();
  // Removed isLoading state as OnboardingFlow manages its own loading
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Removed formData state as OnboardingFlow manages its own form data
  // Removed validateCredentialsMutation as OnboardingFlow handles validation

  // Check if user is already authenticated (Keep this logic)
  useEffect(() => {
    // Add a small delay to ensure the store is hydrated from localStorage
    const timer = setTimeout(() => {
      if (isAuthenticated && credentials) {
        router.push("/dashboard");
      }
      setIsCheckingAuth(false);
    }, 500); // Keep a small delay for hydration

    return () => clearTimeout(timer);
  }, [isAuthenticated, credentials, router]);

  // Removed handleChange and handleSubmit as OnboardingFlow handles them

  // Show loading state while checking initial authentication (Keep this)
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, render the OnboardingFlow
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Keep the branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full border mb-4">
            <svg
              className="w-8 h-8"
              viewBox="0 0 128 112"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M64 0L0 112H128L64 0ZM65.3409 20.8783L109.442 97.3554L65.3409 71.0532V20.8783Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">BetterFlare</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Cloudflare R2 buckets with ease
          </p>
        </div>

        {/* Render the OnboardingFlow component */}
        <OnboardingFlow />

        {/* 
          Removed the Card and Form implementation here.
          Also removed the redundant privacy notice p tag, 
          as OnboardingFlow includes it. 
        */}
      </div>
    </div>
  );
}
