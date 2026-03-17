import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER || "tickets";

if (!connectionString) {
  console.warn("AZURE_STORAGE_CONNECTION_STRING not set. Blob uploads will fail until configured.");
}

export async function uploadBufferToBlob(buffer: Buffer, originalName: string, contentType?: string) {
  if (!connectionString) throw new Error("AZURE_STORAGE_CONNECTION_STRING missing");
  const blobService = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobService.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  const ext = originalName.split('.').pop();
  const blobName = `${Date.now()}-${uuidv4()}${ext ? '.' + ext : ''}`;
  const blockClient = containerClient.getBlockBlobClient(blobName);

  const options: any = {};
  if (contentType) options.blobHTTPHeaders = { blobContentType: contentType };

  await blockClient.uploadData(buffer, options);
  return blockClient.url;
}
