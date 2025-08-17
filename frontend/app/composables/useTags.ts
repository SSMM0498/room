import { ref } from 'vue';
import type { RecordModel } from 'pocketbase';

const TAGS_PERSISTENCE_MS = 3_600_000;

export const useTags = () => {
  const tags = usePersistedState<RecordModel[]>('tags-cache', [], TAGS_PERSISTENCE_MS);
  
  const pending = ref(false);
  const error = ref<Error | null>(null);

  const fetchTags = async () => {
    if (tags.value.length > 0) {
      return;
    }

    pending.value = true;
    error.value = null;
    try {
      const fetchedTags = await $fetch<RecordModel[]>('/api/tags');
      tags.value = fetchedTags;
    } catch (err: any) {
      error.value = err;
    } finally {
      pending.value = false;
    }
  };

  return {
    tags,
    pending,
    error,
    fetchTags,
  };
};