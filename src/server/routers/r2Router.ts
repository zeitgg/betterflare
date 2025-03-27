import { z } from "zod";
import { procedure, router } from "../trpc";
import { R2Service, R2Credentials } from "../services/r2Service";

// Validation schemas
const credentialsSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const bucketSchema = z.object({
  name: z.string().min(1, "Bucket name is required"),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const objectSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required"),
  prefix: z.string().optional().default(""),
  continuationToken: z.string().optional(),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const objectActionSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required"),
  key: z.string().min(1, "Object key is required"),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const renameObjectSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required"),
  oldKey: z.string().min(1, "Original key is required"),
  newKey: z.string().min(1, "New key is required"),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const signedUrlSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required"),
  key: z.string().min(1, "Object key is required"),
  expiresIn: z.number().optional().default(3600),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

const uploadObjectSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required"),
  key: z.string().min(1, "Object key is required"),
  fileBase64: z.string().min(1, "File data is required"),
  contentType: z.string().optional(),
  // Include credential fields
  accountId: z.string().min(1, "Account ID is required"),
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  endpoint: z.string().optional(),
});

// Create the R2 router
export const r2Router = router({
  // Validate credentials and list buckets
  validateCredentials: procedure
    .input(credentialsSchema)
    .mutation(async ({ input }) => {
      try {
        const r2Service = new R2Service(input);
        const buckets = await r2Service.listBuckets();
        return { success: true, buckets };
      } catch (error) {
        console.error("Error validating credentials:", error);
        return {
          success: false,
          error: "Invalid credentials or connection error",
        };
      }
    }),

  // List objects in a bucket
  listObjects: procedure.input(objectSchema).query(async ({ input }) => {
    try {
      const credentials: R2Credentials = {
        accountId: input.accountId,
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
        endpoint: input.endpoint,
      };

      const r2Service = new R2Service(credentials);
      return await r2Service.listObjects(
        input.bucketName,
        input.prefix,
        input.continuationToken
      );
    } catch (error) {
      console.error("Error listing objects:", error);
      throw new Error(
        `Failed to list objects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }),

  // Get a signed URL for an object
  getSignedUrl: procedure.input(signedUrlSchema).mutation(async ({ input }) => {
    try {
      const credentials: R2Credentials = {
        accountId: input.accountId,
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
        endpoint: input.endpoint,
      };

      const r2Service = new R2Service(credentials);
      return await r2Service.getSignedUrl(
        input.bucketName,
        input.key,
        input.expiresIn
      );
    } catch (error) {
      console.error("Error getting signed URL:", error);
      throw new Error(
        `Failed to get signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }),

  // Delete an object
  deleteObject: procedure
    .input(objectActionSchema)
    .mutation(async ({ input }) => {
      try {
        const credentials: R2Credentials = {
          accountId: input.accountId,
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey,
          endpoint: input.endpoint,
        };

        const r2Service = new R2Service(credentials);
        await r2Service.deleteObject(input.bucketName, input.key);
        return { success: true };
      } catch (error) {
        console.error("Error deleting object:", error);
        throw new Error(
          `Failed to delete object: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }),

  // Rename an object
  renameObject: procedure
    .input(renameObjectSchema)
    .mutation(async ({ input }) => {
      try {
        const credentials: R2Credentials = {
          accountId: input.accountId,
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey,
          endpoint: input.endpoint,
        };

        const r2Service = new R2Service(credentials);
        await r2Service.renameObject(
          input.bucketName,
          input.oldKey,
          input.newKey
        );
        return { success: true };
      } catch (error) {
        console.error("Error renaming object:", error);
        throw new Error(
          `Failed to rename object: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }),

  // Upload an object
  uploadObject: procedure
    .input(uploadObjectSchema)
    .mutation(async ({ input }) => {
      try {
        const credentials: R2Credentials = {
          accountId: input.accountId,
          accessKeyId: input.accessKeyId,
          secretAccessKey: input.secretAccessKey,
          endpoint: input.endpoint,
        };

        // Convert base64 string back to Buffer with memory management
        // Use a more memory-efficient approach by processing in chunks
        const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
        const fileBase64Length = input.fileBase64.length;

        if (fileBase64Length > 100 * 1024 * 1024) {
          // If base64 is larger than ~75MB (100MB base64 ≈ 75MB binary)
          throw new Error("File too large. Maximum upload size is 75MB");
        }

        // For smaller files, process directly
        const fileBuffer = Buffer.from(input.fileBase64, "base64");

        const r2Service = new R2Service(credentials);
        await r2Service.uploadObject(
          input.bucketName,
          input.key,
          fileBuffer,
          input.contentType
        );

        // Explicitly clear the buffer reference to help garbage collection
        // This is a hint to the GC but doesn't guarantee immediate cleanup
        return { success: true };
      } catch (error) {
        console.error("Error uploading object:", error);
        throw new Error(
          `Failed to upload object: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }),

  // Create a new bucket
  createBucket: procedure.input(bucketSchema).mutation(async ({ input }) => {
    try {
      const credentials: R2Credentials = {
        accountId: input.accountId,
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
        endpoint: input.endpoint,
      };

      const r2Service = new R2Service(credentials);
      await r2Service.createBucket(input.name);
      return { success: true };
    } catch (error) {
      console.error("Error creating bucket:", error);
      throw new Error(
        `Failed to create bucket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }),

  // Delete a bucket
  deleteBucket: procedure.input(bucketSchema).mutation(async ({ input }) => {
    try {
      const credentials: R2Credentials = {
        accountId: input.accountId,
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
        endpoint: input.endpoint,
      };

      const r2Service = new R2Service(credentials);
      await r2Service.deleteBucket(input.name);
      return { success: true };
    } catch (error) {
      console.error("Error deleting bucket:", error);
      throw new Error(
        `Failed to delete bucket: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }),
});
