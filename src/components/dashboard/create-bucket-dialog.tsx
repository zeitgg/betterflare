"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Bucket name must be at least 3 characters.",
  }),
});

interface CreateBucketDialogProps {
  onBucketCreated: () => void;
}

export function CreateBucketDialog({
  onBucketCreated,
}: CreateBucketDialogProps) {
  const [open, setOpen] = useState(false);
  const { credentials } = useCredentialsStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const createBucketMutation = trpc.r2.createBucket.useMutation({
    onSuccess: () => {
      form.reset();
      setOpen(false);
      onBucketCreated();
    },
    onError: (error) => {
      console.error("Error creating bucket:", error);
      form.setError("name", {
        type: "manual",
        message: error.message || "Failed to create bucket. Please try again.",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!credentials) return;

    createBucketMutation.mutate({
      ...credentials,
      name: values.name,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Create Bucket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Bucket</DialogTitle>
          <DialogDescription>
            Create a new R2 storage bucket in your Cloudflare account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bucket Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-bucket-name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Bucket names must be unique across your R2 buckets.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createBucketMutation.isPending || !credentials}
              >
                {createBucketMutation.isPending
                  ? "Creating..."
                  : "Create Bucket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
