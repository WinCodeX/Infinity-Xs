import {S3Client} from "@aws-sdk/client-s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl} from "@aws-sdk/s3-request-presigner";
import { get } from "http";
import { fileURLToPath } from "url";

const getContentType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "pdf": "application/pdf",
        "txt": "text/plain",
        "json": "application/json",
        "mp4": "video/mp4",
        "webm": "video/webm",
        "svg": "image/svg+xml",
    };
    return contentTypeMap[ext] || "application/octet-stream";
};

export const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export const uploadToR2 = async (
    file: Buffer,
    fileName: string,
    folder: string = "uploads"
): Promise<string> => {
try {
    const bucketName = process.env.R2_BUCKET_NAME || '';
    if (!bucketName) {
        throw new Error("R2_BUCKET_NAME is not defined in environment variables");
    }

    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: getContentType(fileName),
    });

    await r2Client.send(command);

    const publicUrl = process.env.R2_PUBLIC_URL || '';
    return publicUrl;
} catch (error) {
    const err = error as Error;
    console.error(`Error uploading to R2:`, err.message);
    throw new Error("Failed to upload file to R2 storage");
}}; 

export const deleteFromR2 = async (fileUrl: string): Promise<void> => {
    try {
        const bucketName = process.env.R2_BUCKET_NAME || '';
        if (!bucketName) {
            throw new Error("R2_BUCKET_NAME is not defined in environment variables");
        }

        const publicUrl = process.env.R2_PUBLIC_URL || '';
        const key = fileUrl.replace(`${publicUrl}/`, '');
        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await r2Client.send(command);
        console.log(`Successfully deleted ${key} from R2`);
    } catch (error) {
        const err = error as Error;
        console.error(`Error deleting from R2:`, err.message);
        throw new Error("Failed to delete file from R2 storage");
    }
};

export const getpresignedUrl = async (
    key: string,
    expiresIn: number = 3600
): Promise<string> => {
    try {
        const bucketName = process.env.R2_BUCKET_NAME || '';
        if (!bucketName) {
            throw new Error("R2_BUCKET_NAME is not defined in environment variables");
        }

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });
        return presignedUrl;
    } catch (error) {
        const err = error as Error;
        console.error(`Error generating presigned URL:`, err.message);
        throw new Error("Failed to generate presigned URL");
    }
};
