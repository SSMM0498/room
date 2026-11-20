import { Client, BucketItem, CopyConditions } from 'minio';

export function createMinioClient() {
    const config = useRuntimeConfig();

    return new Client({
        endPoint: config.MINIO_URL,
        port: parseInt(config.MINIO_PORT),
        useSSL: false,
        accessKey: config.MINIO_ROOT_USER,
        secretKey: config.MINIO_ROOT_PASSWORD
    });
}

export async function copyMinioFolder(source: string, destination: string) {
    const minioClient = createMinioClient();
    const config = useRuntimeConfig();
    const bucketName = config.MINIO_BUCKET;

    try {
        const objectStream = minioClient.listObjectsV2(bucketName, source, true);
        const listedObjects: BucketItem[] = [];
        for await (const obj of objectStream) {
            listedObjects.push(obj);
        }

        if (!listedObjects || listedObjects.length === 0) return;

        await Promise.all(listedObjects.map(async (object) => {
            if (!object.name) return;
            const destinationKey = object.name.replace(source, destination);
            const copySource = `/${bucketName}/${object.name}`;
            await minioClient.copyObject(bucketName, destinationKey, copySource, new CopyConditions());
            console.log(`[MINIO] Copied ${object.name} to ${destinationKey}`);
        }));
    } catch (error) {
        console.error('[MINIO] Error copying folder:', error);
        throw new Error('Failed to copy workspace template from MinIO.');
    }
}

/** Folder holding the files a workspace pod is hydrated from. */
export const workspaceS3Path = (workspaceId: string): string => `workspaces/${workspaceId}`;

/**
 * Gives a workspace its starting files: those of `templates/<template>/`, where
 * the template is its environment (or its language tag when it has none).
 * A workspace that already has files is left untouched.
 */
export async function seedWorkspaceFiles(workspaceId: string, template: string) {
    const minioClient = createMinioClient();
    const bucketName = useRuntimeConfig().MINIO_BUCKET;
    const destination = `${workspaceS3Path(workspaceId)}/`;

    for await (const _existing of minioClient.listObjectsV2(bucketName, destination, true)) return;

    // Trailing slashes keep `templates/go/` from also matching `templates/golang/`.
    await copyMinioFolder(`templates/${template.toLowerCase()}/`, destination);
}
