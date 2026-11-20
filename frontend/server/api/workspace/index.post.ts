export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const config = useRuntimeConfig();

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
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

        // Not awaited: the workspace is usable without its template, and it is
        // seeded again when it starts if this copy did not go through.
        const languageTag = newWorkspaceRecord.expand!.language;
        seedWorkspaceFiles(newWorkspaceRecord.id, languageTag.name)
            .then(() => console.log(`[MINIO] Seeded ${workspaceS3Path(newWorkspaceRecord.id)} with the ${languageTag.name} template`))
            .catch(error => console.error(`[MINIO] Could not seed workspace ${newWorkspaceRecord.id}:`, error.message || error.code || error));

        setResponseStatus(event, 201);
        return newWorkspaceRecord;
    } catch (error: any) {
        console.error('[WORKSPACE CREATE] Error:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Failed to create workspace.', data: { error } });
    }
});