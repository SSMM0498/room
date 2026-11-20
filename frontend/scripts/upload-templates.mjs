// Uploads the workspace templates (../templates) to MinIO, under `templates/`,
// where a workspace's starting files are copied from. Run by `make k8s-storage`
// with frontend/.env loaded, so it talks to the same MinIO as the Nuxt server.
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'minio';

const templatesDir = fileURLToPath(new URL('../../templates', import.meta.url));
const bucket = process.env.MINIO_BUCKET || 'room';

const client = new Client({
    endPoint: process.env.MINIO_URL || 'localhost',
    port: Number(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD,
});

// MinIO may still be starting when the Makefile gets here.
for (let attempt = 1; ; attempt++) {
    try {
        if (!(await client.bucketExists(bucket))) await client.makeBucket(bucket);
        break;
    } catch (error) {
        if (attempt === 30) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

const entries = await readdir(templatesDir, { recursive: true, withFileTypes: true });
const files = entries.filter(entry => entry.isFile() && entry.name !== '.DS_Store');

for (const file of files) {
    const filePath = join(file.parentPath, file.name);
    const key = `templates/${relative(templatesDir, filePath).split(sep).join('/')}`;
    await client.fPutObject(bucket, key, filePath);
}

console.log(`Uploaded ${files.length} template files to ${bucket}/templates`);
