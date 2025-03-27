"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useBucketStore } from "@/store/bucketStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ChevronRight,
  FolderIcon,
  FileIcon,
  ArrowUp,
  Trash2,
  Pencil,
  Download,
  Upload,
  RefreshCw,
  DatabaseIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatBytes, getFileTypeIcon } from "@/lib/utils";
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
import { useParams } from "next/navigation";

// For client components in Next.js 15, we should use useParams() hook
interface BucketPageProps {}

export default function BucketPage({}: BucketPageProps) {
  // Use the useParams hook to get the bucket name
  const params = useParams();
  const bucketName = params.name as string;

  const { credentials } = useCredentialsStore();
  const { currentPrefix, setCurrentBucket, setCurrentPrefix, navigateUp } =
    useBucketStore();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [newObjectName, setNewObjectName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Set the current bucket when the component mounts
  useEffect(() => {
    if (bucketName) {
      setCurrentBucket(bucketName);
    }
  }, [bucketName, setCurrentBucket]);

  // Query to list objects in the bucket
  const { data, isLoading, refetch } = trpc.r2.listObjects.useQuery(
    {
      ...credentials!,
      bucketName,
      prefix: currentPrefix,
    },
    {
      enabled: !!credentials && !!bucketName,
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds to reduce refetches
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    }
  );

  // Memoize the breadcrumb items to avoid recalculation on every render
  const breadcrumbItems = useMemo(() => {
    const items = [{ name: "Root", prefix: "" }];

    if (currentPrefix) {
      const parts = currentPrefix.split("/").filter(Boolean);
      let cumulativePrefix = "";

      parts.forEach((part) => {
        cumulativePrefix += `${part}/`;
        items.push({
          name: part,
          prefix: cumulativePrefix,
        });
      });
    }

    return items;
  }, [currentPrefix]);

  // Mutation to delete an object
  const deleteMutation = trpc.r2.deleteObject.useMutation({
    onSuccess: () => {
      toast.success("Object deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error deleting object: ${error.message}`);
    },
  });

  // Mutation to rename an object
  const renameMutation = trpc.r2.renameObject.useMutation({
    onSuccess: () => {
      toast.success("Object renamed successfully");
      refetch();
      setIsRenameDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error renaming object: ${error.message}`);
    },
  });

  // Fix the error type in the getSignedUrl mutation
  const getSignedUrlMutation = trpc.r2.getSignedUrl.useMutation({
    onSuccess: (url: string) => {
      window.open(url, "_blank");
    },
    onError: (error) => {
      toast.error(
        `Error generating download link: ${error.message || "Unknown error"}`
      );
    },
  });

  // Add upload mutation
  const uploadMutation = trpc.r2.uploadObject.useMutation({
    onSuccess: () => {
      toast.success("File uploaded successfully");
      refetch();
      setIsUploading(false);
      setUploadProgress(100);
    },
    onError: (error) => {
      toast.error(`Error uploading file: ${error.message || "Unknown error"}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Handle folder navigation
  const handleNavigateToFolder = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  // Handle object deletion
  const handleDeleteObject = (key: string) => {
    deleteMutation.mutate({
      ...credentials!,
      bucketName,
      key,
    });
  };

  // Handle object rename
  const handleRenameObject = () => {
    if (!selectedObject || !newObjectName) return;

    // Log the rename parameters for debugging
    console.log("Renaming object:", {
      bucketName,
      oldKey: selectedObject,
      newKey: currentPrefix + newObjectName,
      currentPrefix,
    });

    renameMutation.mutate({
      ...credentials!,
      bucketName,
      oldKey: selectedObject,
      newKey: currentPrefix + newObjectName,
    });
  };

  // Handle object download
  const handleDownloadObject = (key: string) => {
    getSignedUrlMutation.mutate({
      ...credentials!,
      bucketName,
      key,
    });
  };

  // Handle file upload with improved error handling
  const processFileUpload = async (file: File) => {
    // Add file size check to prevent memory issues
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}`
      );
      return;
    }

    // Validate file name
    if (!file.name || file.name.trim() === "") {
      toast.error("Invalid file name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const key = currentPrefix + file.name;

      // Read the file as an ArrayBuffer with proper memory management
      const arrayBuffer = await file.arrayBuffer();

      // Convert ArrayBuffer to base64 string in chunks to avoid memory issues
      const chunkSize = 1024 * 1024; // 1MB chunks
      let base64String = "";

      // Process in chunks to avoid memory issues
      for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
        const chunk = arrayBuffer.slice(
          i,
          Math.min(i + chunkSize, arrayBuffer.byteLength)
        );
        base64String += Buffer.from(chunk).toString("base64");

        // Update progress based on how much we've processed
        const progress = Math.min(
          10 + Math.floor((i / arrayBuffer.byteLength) * 80),
          90
        );
        setUploadProgress(progress);

        // Allow UI to update by yielding to the event loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Use the upload mutation to upload the file
      await uploadMutation.mutateAsync({
        ...credentials!,
        bucketName,
        key,
        fileBase64: base64String,
        contentType: file.type || "application/octet-stream", // Provide default content type
      });

      // The success handler in the mutation will handle the rest
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        `Error uploading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file input change
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFileUpload(files[0]);

    // Clean up to prevent memory leaks
    e.target.value = "";
  };

  // Handle drag events with improved handling
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragging to false if the leave event is from the drop zone
    // and not from a child element
    if (e.currentTarget === dropZoneRef.current) {
      // Check if the mouse is outside the drop zone
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (
        x < rect.left ||
        x >= rect.right ||
        y < rect.top ||
        y >= rect.bottom
      ) {
        setIsDragging(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    try {
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      // Process the first file
      await processFileUpload(files[0]);
    } catch (error) {
      console.error("Error handling file drop:", error);
      toast.error("Failed to process dropped file");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle refresh with animation
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    // Add a small delay to make the animation visible even for fast refreshes
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // If bucketName is not available yet, show a loading state
  if (!bucketName) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div
      ref={dropZoneRef}
      className="space-y-5 animate-in fade-in duration-300 relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-medium tracking-tight">{bucketName}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="default"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById("file-upload")?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Breadcrumb navigation */}
      <Breadcrumb className="py-1 px-3 bg-secondary rounded-md">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink
                onClick={() => handleNavigateToFolder(item.prefix)}
                className="cursor-pointer hover:text-primary transition-colors text-sm"
              >
                {item.name}
              </BreadcrumbLink>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Drag overlay with improved positioning */}
      {isDragging && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-dashed border-primary rounded-lg p-12 text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <Upload className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-medium mb-2">Drop file to upload</h3>
            <p className="text-muted-foreground">
              Drop your file here to upload to {bucketName}
            </p>
          </div>
        </div>
      )}

      {/* Back button */}
      {currentPrefix && (
        <Button
          variant="ghost"
          onClick={navigateUp}
          size="sm"
          className="gap-2 h-8"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Up to parent directory
        </Button>
      )}

      {/* Objects table */}
      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] text-xs font-medium">
                Name
              </TableHead>
              <TableHead className="text-xs font-medium">
                Last Modified
              </TableHead>
              <TableHead className="text-xs font-medium">Size</TableHead>
              <TableHead className="text-right text-xs font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Folders */}
                {data?.prefixes.map((prefix) => {
                  const folderName = prefix.Prefix?.replace(
                    currentPrefix,
                    ""
                  ).replace("/", "");
                  return (
                    <TableRow
                      key={prefix.Prefix}
                      className="group hover:bg-secondary/50 transition-colors"
                    >
                      <TableCell className="font-medium py-2">
                        <div
                          className="flex items-center cursor-pointer group-hover:text-primary transition-colors"
                          onClick={() => handleNavigateToFolder(prefix.Prefix!)}
                        >
                          <FolderIcon className="h-4 w-4 mr-2 text-primary" />
                          {folderName}/
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm py-2">
                        —
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm py-2">
                        —
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          className="h-7 w-7 opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Files */}
                {data?.objects.map((object) => {
                  // Skip if the object is a "folder" (ends with /)
                  if (object.Key?.endsWith("/")) return null;

                  // Get just the filename without the prefix
                  const fileName = object.Key?.replace(currentPrefix, "");

                  return (
                    <TableRow
                      key={object.Key}
                      className="group hover:bg-secondary/50 transition-colors"
                    >
                      <TableCell className="font-medium py-2">
                        <div className="flex items-center">
                          {getFileTypeIcon(fileName || "", "h-4 w-4 mr-2")}
                          <span className="text-sm">{fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">
                        {object.LastModified
                          ? new Date(object.LastModified).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">
                        {object.Size !== undefined
                          ? formatBytes(object.Size)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadObject(object.Key!)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>

                          <Dialog
                            open={
                              isRenameDialogOpen &&
                              selectedObject === object.Key
                            }
                            onOpenChange={(open) => {
                              setIsRenameDialogOpen(open);
                              if (!open) setSelectedObject(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setSelectedObject(object.Key!);
                                  setNewObjectName(fileName || "");
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="sr-only">Rename</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Rename Object</DialogTitle>
                                <DialogDescription>
                                  Enter a new name for this object
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    Name
                                  </Label>
                                  <Input
                                    id="name"
                                    value={newObjectName}
                                    onChange={(e) =>
                                      setNewObjectName(e.target.value)
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  onClick={handleRenameObject}
                                  disabled={
                                    !newObjectName || renameMutation.isPending
                                  }
                                  size="sm"
                                >
                                  {renameMutation.isPending ? (
                                    <>
                                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                                      Renaming...
                                    </>
                                  ) : (
                                    "Save changes"
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Object
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this object?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteObject(object.Key!)
                                  }
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Empty state */}
                {(!data?.prefixes || data.prefixes.length === 0) &&
                  (!data?.objects || data.objects.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center">
                          <FolderIcon className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            This folder is empty
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("file-upload")?.click()
                            }
                            className="gap-2"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload Files
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
