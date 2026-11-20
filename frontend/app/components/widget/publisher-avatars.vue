<template>
    <div class="inline-flex">
        <div class="relative">
            <NuxtLink v-if="school" :to="localePath(`/school/${school.id}`)" @click.stop>
                <UAvatar :src="useFileUrl(school, 'logo', '100x100')" :alt="school.name"
                    icon="i-heroicons-academic-cap" :size="schoolSize" crossorigin="anonymous"
                    class="rounded-lg ring-2 ring-white dark:ring-gray-900" />
            </NuxtLink>
            <!-- Offset by a third of the badge's own size, so the overlap holds at any avatar size -->
            <NuxtLink v-if="author" :to="localePath(`/@/${author.username}`)" @click.stop
                :class="school ? 'absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3' : ''">
                <UAvatar :src="useFileUrl(author, 'avatar', '100x100')" :alt="author.username"
                    :size="school ? authorSize : schoolSize" crossorigin="anonymous"
                    class="ring-2 ring-white dark:ring-gray-900" />
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase';
import type { AvatarProps } from '#ui/types';

/**
 * The pair that publishes a course: the school as the main avatar, with the
 * author badged onto its corner. Falls back to the author alone when the course
 * carries no school (or the relation was not expanded).
 */
withDefaults(defineProps<{
    school?: RecordModel;
    author?: RecordModel;
    schoolSize?: AvatarProps['size'];
    authorSize?: AvatarProps['size'];
}>(), {
    school: undefined,
    author: undefined,
    schoolSize: 'xl',
    authorSize: 'xs',
});

const localePath = useLocalePath();
</script>
