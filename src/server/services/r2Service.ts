import { 
  S3Client, 
  ListBucketsCommand, 
  ListObjectsV2Command, 
  GetObjectCommand, 
  DeleteObjectCommand,
  CopyObjectCommand,
  PutObjectCommand
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
      endpoint: credentials.endpoint || `https://${credentials.accountId}.r2.cloudflarestorage.com`,
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

  async listObjects(bucketName: string, prefix: string = "", continuationToken?: string) {
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

  async getSignedUrl(bucketName: string, key: string, expiresIn: number = 3600) {
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
      // Copy the object to the new key
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: encodeURIComponent(`${bucketName}/${oldKey}`),
        Key: newKey,
      });
      
      await this.client.send(copyCommand);
      
      // Delete the original object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: oldKey,
      });
      
      await this.client.send(deleteCommand);
      
      return true;
    } catch (error) {
      console.error(`Error renaming object from ${oldKey} to ${newKey}:`, error);
      throw error;
    }
  }

  async uploadObject(bucketName: string, key: string, body: Buffer | Blob, contentType?: string) {
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
}
