export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const config = useRuntimeConfig();

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }

    let { name, language, course, environment } = await readBody(event);
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

    // Optional: without an environment the workspace runs the generic worker image.
    if (environment && !isWorkspaceEnvironment(environment)) {
        throw createError({ statusCode: 400, statusMessage: `Unknown environment: ${environment}.` });
    }

    try {
        const newWorkspaceData = {
            name,
            course,
            owner: ownerId,
            status: 'sleeping',
            language,
            environment: environment || '',
        };
        const newWorkspaceRecord = await pb.collection('workspaces').create(newWorkspaceData, {
            expand: 'language',
        });
        console.log(`[PB] Created workspace record ${newWorkspaceRecord.id}`);

        // Not awaited: the workspace is usable without its template, and it is
        // seeded again when it starts if this copy did not go through.
        // The starter files are those of the environment, or of the language tag
        // for a workspace that has none.
        const template = environment || newWorkspaceRecord.expand!.language.name;
        seedWorkspaceFiles(newWorkspaceRecord.id, template)
            .then(() => console.log(`[MINIO] Seeded ${workspaceS3Path(newWorkspaceRecord.id)} with the ${template} template`))
            .catch(error => console.error(`[MINIO] Could not seed workspace ${newWorkspaceRecord.id}:`, error.message || error.code || error));

        setResponseStatus(event, 201);
        return newWorkspaceRecord;
    } catch (error: any) {
        console.error('[WORKSPACE CREATE] Error:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, statusMessage: 'Failed to create workspace.', data: { error } });
    }
});