"use client";

import { useEffect, useState, useMemo } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useBucketStore } from "@/store/bucketStore";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, FolderIcon, FileIcon, ArrowUp, Trash2, Pencil, Download, Upload, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatBytes, getFileTypeIcon } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useParams } from "next/navigation";

// For client components in Next.js 15, we should use useParams() hook
interface BucketPageProps {}

export default function BucketPage({}: BucketPageProps) {
  // Use the useParams hook to get the bucket name
  const params = useParams();
  const bucketName = params.name as string;
  
  const { credentials } = useCredentialsStore();
  const { currentPrefix, setCurrentBucket, setCurrentPrefix, navigateUp } = useBucketStore();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [newObjectName, setNewObjectName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set the current bucket when the component mounts
  useEffect(() => {
    if (bucketName) {
      setCurrentBucket(bucketName);
    }
  }, [bucketName, setCurrentBucket]);

  // Query to list objects in the bucket
  const { 
    data, 
    isLoading, 
    refetch 
  } = trpc.r2.listObjects.useQuery(
    { 
      ...credentials!,
      bucketName, 
      prefix: currentPrefix 
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
      const parts = currentPrefix.split('/').filter(Boolean);
      let cumulativePrefix = "";
      
      parts.forEach((part) => {
        cumulativePrefix += `${part}/`;
        items.push({
          name: part,
          prefix: cumulativePrefix
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
    }
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
    }
  });

  // Fix the error type in the getSignedUrl mutation
  const getSignedUrlMutation = trpc.r2.getSignedUrl.useMutation({
    onSuccess: (url: string) => {
      window.open(url, '_blank');
    },
    onError: (error) => {
      toast.error(`Error generating download link: ${error.message || 'Unknown error'}`);
    }
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
      key
    });
  };

  // Handle object rename
  const handleRenameObject = () => {
    if (!selectedObject || !newObjectName) return;
    
    const newKey = currentPrefix + newObjectName;
    
    renameMutation.mutate({
      ...credentials!,
      bucketName,
      oldKey: selectedObject,
      newKey
    });
  };

  // Handle object download
  const handleDownloadObject = (key: string) => {
    getSignedUrlMutation.mutate({
      ...credentials!,
      bucketName,
      key
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // In a real implementation, you would upload the file to R2 here
      // For now, we'll just simulate the upload with a progress indicator
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success("File uploaded successfully");
      refetch();
    } catch (error) {
      toast.error("Error uploading file");
    } finally {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{bucketName}</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            variant="default" 
            disabled={isUploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
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
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink 
                onClick={() => handleNavigateToFolder(item.prefix)}
                className="cursor-pointer hover:underline"
              >
                {item.name}
              </BreadcrumbLink>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="w-full rounded-full h-2.5 mt-4 border">
          <div 
            className="bg-primary h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Back button */}
      {currentPrefix && (
        <Button 
          variant="outline" 
          onClick={navigateUp}
          className="mb-4"
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          Up to parent directory
        </Button>
      )}

      {/* Objects table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  const folderName = prefix.Prefix?.replace(currentPrefix, '').replace('/', '');
                  return (
                    <TableRow key={prefix.Prefix} className="group">
                      <TableCell className="font-medium">
                        <div 
                          className="flex items-center cursor-pointer group-hover:underline"
                          onClick={() => handleNavigateToFolder(prefix.Prefix!)}
                        >
                          <FolderIcon className="h-4 w-4 mr-2 text-primary" />
                          {folderName}/
                        </div>
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Files */}
                {data?.objects.map((object) => {
                  // Skip if the object is a "folder" (ends with /)
                  if (object.Key?.endsWith('/')) return null;
                  
                  // Get just the filename without the prefix
                  const fileName = object.Key?.replace(currentPrefix, '');
                  
                  return (
                    <TableRow key={object.Key} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getFileTypeIcon(fileName || '', "h-4 w-4 mr-2")}
                          {fileName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {object.LastModified ? new Date(object.LastModified).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {object.Size !== undefined ? formatBytes(object.Size) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownloadObject(object.Key!)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={true}
                                onClick={() => {
                                  setSelectedObject(object.Key!);
                                  setNewObjectName(fileName || '');
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Rename</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
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
                                    onChange={(e) => setNewObjectName(e.target.value)}
                                    className="col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  onClick={handleRenameObject}
                                  disabled={!newObjectName}
                                >
                                  Save changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the
                                  object from your R2 bucket.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteObject(object.Key!)}
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
                {(!data?.objects || data.objects.length === 0) && 
                 (!data?.prefixes || data.prefixes.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          This folder is empty
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload a file
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
