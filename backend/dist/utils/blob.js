"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToBlob = uploadBufferToBlob;
const storage_blob_1 = require("@azure/storage-blob");
const uuid_1 = require("uuid");
const fs_1 = require("fs");
const path_1 = require("path");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_STORAGE_CONTAINER || "tickets";
const useLocalStorage = !connectionString;
// Local storage fallback for development
const localStoragePath = (0, path_1.join)(__dirname, "..", "..", "uploads");
if (useLocalStorage) {
    console.log("✓ Using local file storage for uploads (Azure Blob Storage not configured)");
    try {
        (0, fs_1.mkdirSync)(localStoragePath, { recursive: true });
    }
    catch (err) {
        console.warn("Failed to create local uploads directory:", err);
    }
}
else {
    console.log("✓ Using Azure Blob Storage for uploads");
}
async function uploadBufferToBlob(buffer, originalName, contentType) {
    const ext = originalName.split('.').pop();
    const blobName = `${Date.now()}-${(0, uuid_1.v4)()}${ext ? '.' + ext : ''}`;
    if (useLocalStorage) {
        // Local file storage fallback
        const filePath = (0, path_1.join)(localStoragePath, blobName);
        (0, fs_1.writeFileSync)(filePath, buffer);
        return `/uploads/${blobName}`;
    }
    // Azure Blob Storage
    const blobService = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobService.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    const blockClient = containerClient.getBlockBlobClient(blobName);
    const options = {};
    if (contentType)
        options.blobHTTPHeaders = { blobContentType: contentType };
    await blockClient.uploadData(buffer, options);
    return blockClient.url;
}
