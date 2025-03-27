"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CloudIcon,
  ShieldIcon,
  KeyIcon,
  DatabaseIcon,
  ArrowRightIcon,
  CheckIcon,
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete?: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const { setCredentials } = useCredentialsStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    endpoint: "",
  });

  const validateCredentialsMutation = trpc.r2.validateCredentials.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.success) {
        setCredentials(formData);
        toast.success("Successfully connected to Cloudflare R2");
        if (onComplete) {
          onComplete();
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(
          "Failed to connect to Cloudflare R2. Please check your credentials."
        );
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

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      title: "Account ID",
      description: "Enter your Cloudflare Account ID",
      icon: <ShieldIcon className="h-5 w-5" />,
      field: "accountId",
      placeholder: "Your Cloudflare Account ID",
      isRequired: true,
    },
    {
      title: "Access Key ID",
      description: "Enter your R2 Access Key ID",
      icon: <KeyIcon className="h-5 w-5" />,
      field: "accessKeyId",
      placeholder: "Your R2 Access Key ID",
      isRequired: true,
    },
    {
      title: "Secret Access Key",
      description: "Enter your R2 Secret Access Key",
      icon: <KeyIcon className="h-5 w-5" />,
      field: "secretAccessKey",
      placeholder: "Your R2 Secret Access Key",
      isRequired: true,
      isSecret: true,
    },
    {
      title: "Custom Endpoint (Optional)",
      description: "Enter a custom endpoint if needed",
      icon: <DatabaseIcon className="h-5 w-5" />,
      field: "endpoint",
      placeholder: "https://your-account-id.r2.cloudflarestorage.com",
      isRequired: false,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isStepValid =
    !currentStepData.isRequired ||
    !!formData[currentStepData.field as keyof typeof formData];

  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-0.5 w-[calc(100%-2rem)] left-[calc(50%+1rem)] top-4 ${
                    index < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <CardHeader>
        <div className="flex items-center gap-2">
          {currentStepData.icon}
          <CardTitle>{currentStepData.title}</CardTitle>
        </div>
        <CardDescription>{currentStepData.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              id={currentStepData.field}
              name={currentStepData.field}
              type={currentStepData.isSecret ? "password" : "text"}
              placeholder={currentStepData.placeholder}
              value={formData[currentStepData.field as keyof typeof formData]}
              onChange={handleChange}
              required={currentStepData.isRequired}
              className="h-10"
              autoFocus
            />
          </div>

          {currentStepData.field === "endpoint" && (
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default endpoint
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0 || isLoading}
        >
          Back
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={!isStepValid || isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>Connect</>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNextStep}
            disabled={!isStepValid}
            className="gap-2"
          >
            Next
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>

      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-muted-foreground">
          Your credentials are stored only in your browser's local storage and
          are never sent to our servers.
        </p>
      </div>
    </Card>
  );
}
