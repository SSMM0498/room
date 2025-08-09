import PocketBase from 'pocketbase';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();

if (!config.POCKETBASE_URL) {
  throw new Error('POCKETBASE_URL is not defined in the environment.');
}

const pb = new PocketBase(config.POCKETBASE_URL);

export default pb;