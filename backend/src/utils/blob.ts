import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER || "tickets";
const useLocalStorage = !connectionString;

// Local storage fallback for development
const localStoragePath = join(__dirname, "..", "..", "uploads");

if (useLocalStorage) {
  console.log("✓ Using local file storage for uploads (Azure Blob Storage not configured)");
  try {
    mkdirSync(localStoragePath, { recursive: true });
  } catch (err) {
    console.warn("Failed to create local uploads directory:", err);
  }
} else {
  console.log("✓ Using Azure Blob Storage for uploads");
}

export async function uploadBufferToBlob(buffer: Buffer, originalName: string, contentType?: string) {
  const ext = originalName.split('.').pop();
  const blobName = `${Date.now()}-${uuidv4()}${ext ? '.' + ext : ''}`;

  if (useLocalStorage) {
    // Local file storage fallback
    const filePath = join(localStoragePath, blobName);
    writeFileSync(filePath, buffer);
    return `/uploads/${blobName}`;
  }

  // Azure Blob Storage
  const blobService = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobService.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const blockClient = containerClient.getBlockBlobClient(blobName);
  const options: any = {};
  if (contentType) options.blobHTTPHeaders = { blobContentType: contentType };

  await blockClient.uploadData(buffer, options);
  return blockClient.url;
}
