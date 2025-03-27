"use client";

import { useState } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrashIcon } from "lucide-react";

interface DeleteBucketDialogProps {
  bucketName: string;
  onBucketDeleted: () => void;
}

export function DeleteBucketDialog({
  bucketName,
  onBucketDeleted,
}: DeleteBucketDialogProps) {
  const [open, setOpen] = useState(false);
  const { credentials } = useCredentialsStore();

  const deleteBucketMutation = trpc.r2.deleteBucket.useMutation({
    onSuccess: () => {
      setOpen(false);
      onBucketDeleted();
    },
    onError: (error) => {
      console.error("Error deleting bucket:", error);
      // Could add toast notification here for error feedback
    },
  });

  const handleDelete = () => {
    if (!credentials) return;

    deleteBucketMutation.mutate({
      ...credentials,
      name: bucketName,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bucket</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the bucket{" "}
            <strong>{bucketName}</strong>? This action cannot be undone.
            <br />
            <br />
            <span className="text-destructive font-medium">
              Warning: All objects in the bucket must be deleted first, or the
              operation will fail.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
            disabled={deleteBucketMutation.isPending || !credentials}
          >
            {deleteBucketMutation.isPending ? "Deleting..." : "Delete Bucket"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
