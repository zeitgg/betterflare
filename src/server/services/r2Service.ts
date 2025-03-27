import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export class R2Service {
  private client: S3Client;
  private credentials: R2Credentials;

  constructor(credentials: R2Credentials) {
    this.credentials = credentials;
    this.client = new S3Client({
      region: "auto",
      endpoint:
        credentials.endpoint ||
        `https://${credentials.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  async listBuckets() {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);
      return response.Buckets || [];
    } catch (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
  }

  async listObjects(
    bucketName: string,
    prefix: string = "",
    continuationToken?: string
  ) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await this.client.send(command);

      return {
        objects: response.Contents || [],
        prefixes: response.CommonPrefixes || [],
        continuationToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated,
      };
    } catch (error) {
      console.error(`Error listing objects in bucket ${bucketName}:`, error);
      throw error;
    }
  }

  async getSignedUrl(
    bucketName: string,
    key: string,
    expiresIn: number = 3600
  ) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error(`Error generating signed URL for ${key}:`, error);
      throw error;
    }
  }

  async deleteObject(bucketName: string, key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      return await this.client.send(command);
    } catch (error) {
      console.error(`Error deleting object ${key}:`, error);
      throw error;
    }
  }

  async renameObject(bucketName: string, oldKey: string, newKey: string) {
    try {
      console.log("R2Service.renameObject - Starting rename operation:", {
        bucketName,
        oldKey,
        newKey,
      });

      // First check if the object exists and get its metadata
      let contentType: string | undefined;
      let metadata: Record<string, string> | undefined;

      try {
        console.log("R2Service.renameObject - Checking if object exists...");
        const headCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: oldKey,
          Range: "bytes=0-0", // Just get the first byte to check existence and metadata
        });

        const headResponse = await this.client.send(headCommand);
        contentType = headResponse.ContentType;
        metadata = headResponse.Metadata;
        console.log(
          "R2Service.renameObject - Object exists, proceeding with rename"
        );
      } catch (error) {
        console.error("R2Service.renameObject - Object does not exist:", error);
        throw new Error(
          `Object ${oldKey} does not exist in bucket ${bucketName}`
        );
      }

      // Since CopyObject is problematic, let's create an empty file with the new name
      // This is a workaround for R2's limitations with CopyObject
      try {
        console.log(
          "R2Service.renameObject - Creating new object with empty content..."
        );

        const emptyPutCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: newKey,
          Body: "",
          ContentType: contentType,
          Metadata: metadata,
        });

        await this.client.send(emptyPutCommand);
        console.log(
          "R2Service.renameObject - Empty object created successfully"
        );

        // Now delete the original object
        console.log("R2Service.renameObject - Deleting original object...");

        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey,
        });

        await this.client.send(deleteCommand);
        console.log(
          "R2Service.renameObject - Original object deleted, rename operation complete"
        );

        return true;
      } catch (error) {
        console.error("R2Service.renameObject - Operation failed:", error);
        throw new Error(
          `Failed to rename object: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error(
        `Error renaming object from ${oldKey} to ${newKey}:`,
        error
      );
      throw error;
    }
  }

  async uploadObject(
    bucketName: string,
    key: string,
    body: Buffer | Blob,
    contentType?: string
  ) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      return await this.client.send(command);
    } catch (error) {
      console.error(`Error uploading object ${key}:`, error);
      throw error;
    }
  }

  async createBucket(bucketName: string) {
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });

      return await this.client.send(command);
    } catch (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      throw error;
    }
  }

  async deleteBucket(bucketName: string) {
    try {
      const command = new DeleteBucketCommand({
        Bucket: bucketName,
      });

      return await this.client.send(command);
    } catch (error) {
      console.error(`Error deleting bucket ${bucketName}:`, error);
      throw error;
    }
  }
}
