export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    const config = useRuntimeConfig();

    if (!pb.authStore.isValid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    let { name, language, course } = await readBody(event);
    const ownerId = pb.authStore.record?.id;

    if (config.ENV === 'DEV') {
        const devNames = ['faty', 'baly', 'chebi', 'ping', 'ada'];
        const randomName = devNames[Math.floor(Math.random() * devNames.length)];

        console.log(`[DEV MODE] Overriding workspace name. Original: "${name}", New: "${randomName}"`);

        name = randomName;
    }

    if (!name || !language) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields: name, language.' });
    }

    try {
        const newWorkspaceData = {
            name,
            course,
            owner: ownerId,
            status: 'sleeping',
            language,
        };
        const newWorkspaceRecord = await pb.collection('workspaces').create(newWorkspaceData, {
            expand: 'language',
        });
        console.log(`[PB] Created workspace record ${newWorkspaceRecord.id}`);

        const s3Path = `workspaces/${name}`;
        const languageTag = newWorkspaceRecord.expand!.language;
        const templateSource = `templates/${languageTag.name.toLowerCase()}`;

        copyMinioFolder(templateSource, s3Path);
        console.log(`[MINIO] Copied base template for ${languageTag.name} to ${s3Path}`);

        setResponseStatus(event, 201);
        return newWorkspaceRecord;
    } catch (error: any) {
        console.error('[WORKSPACE CREATE] Error:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Failed to create workspace.', data: { error } });
    }
});