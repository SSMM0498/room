import { defineEventHandler, setResponseStatus } from 'h3';
import pb from '../utils/pocketbase';

export default defineEventHandler(async (event) => {
  try {
    const health = await pb.health.check();

    return {
      status: 200,
      health,
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