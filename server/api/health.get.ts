import { defineEventHandler, setResponseStatus } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const pb = createPocketBaseInstance(event);

    const health = await pb.health.check();

    return {
      ...health,
    };
  } catch (error) {
    setResponseStatus(event, 500);

    return {
      status: 500,
      message: 'PocketBase connection failed.',
      error: (error as Error).message,
    };
  }
});