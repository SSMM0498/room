export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  const { collection, recordId, filename } = event.context.params as Record<string, string>;
  
  const query = getQuery(event);
  const thumb = query.thumb as string | undefined;

  try {
    const record = await pb.collection(collection).getOne(recordId);

    const url = pb.files.getURL(record, filename, { thumb });

    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error('File not found or access denied.');
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      setResponseHeader(event, 'Content-Type', contentType);
    }

    return sendStream(event, response.body);

  } catch (error) {
    console.error('File proxy error:', error);
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found.',
    });
  }
});
