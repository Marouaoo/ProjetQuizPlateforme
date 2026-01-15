import { Injectable } from '@angular/core';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AwsService {
    private s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: environment.aws.region,
            credentials: {
                accessKeyId: environment.aws.accessKeyId,
                secretAccessKey: environment.aws.secretAccessKey,
            },
            forcePathStyle: false,
        });
    }

    private async fileToBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result instanceof ArrayBuffer) {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert file to buffer'));
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    async uploadFile(file: File, type: 'image' | 'video'): Promise<string> {
        try {
            const fileBuffer = await this.fileToBuffer(file);

            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 15);
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            const fileName = `${type}s/${timestamp}-${randomString}.${extension}`;

            const command = new PutObjectCommand({
                Bucket: environment.aws.bucketName,
                Key: fileName,
                Body: new Uint8Array(fileBuffer),
                ContentType: file.type,
            });

            await this.s3Client.send(command);

            return `https://${environment.aws.bucketName}.s3.${environment.aws.region}.amazonaws.com/${fileName}`;
        } catch (error: any) {
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                requestId: error.$metadata?.requestId,
                statusCode: error.$metadata?.httpStatusCode,
            });
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const fileKey = this.getFileKeyFromUrl(fileUrl);
            const command = new DeleteObjectCommand({
                Bucket: environment.aws.bucketName,
                Key: fileKey,
            });
            await this.s3Client.send(command);
        } catch (error: any) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    getFileKeyFromUrl(fileUrl: string): string {
        const baseUrl = `https://${environment.aws.bucketName}.s3.${environment.aws.region}.amazonaws.com/`;
        return fileUrl.replace(baseUrl, '');
    }
}
