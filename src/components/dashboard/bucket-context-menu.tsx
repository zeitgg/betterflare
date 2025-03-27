"use client";

import { useEffect, useState } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, ChevronRight } from "lucide-react";

interface BucketContextMenuProps {
  bucketName: string;
  onBucketDeleted: () => void;
  onNavigate: () => void;
}

export function BucketContextMenu({
  bucketName,
  onBucketDeleted,
  onNavigate,
}: BucketContextMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const { credentials } = useCredentialsStore();

  // Close the menu when an action is performed
  const closeMenu = () => setOpen(false);

  // Handle menu item actions
  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    onNavigate();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setDeleteDialogOpen(true);
  };

  const deleteBucketMutation = trpc.r2.deleteBucket.useMutation({
    onSuccess: () => {
      setDeleteDialogOpen(false);
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
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={0}>
          <DropdownMenuItem onClick={handleNavigate}>
            <ChevronRight className="h-4 w-4 mr-2" />
            Open Bucket
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Bucket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setOpen(false); // Close dropdown when dialog closes
        }}
      >
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
    </>
  );
}
