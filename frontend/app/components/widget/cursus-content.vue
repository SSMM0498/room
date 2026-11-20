<template>
    <div class="flex flex-col w-full gap-3">
        <div class="flex items-center justify-start">
            <UBadge color="primary" variant="subtle">{{ $t('cursus.count', children.length) }}</UBadge>
            <template v-if="totalDuration">
                <span class="text-lg mx-1">·</span>
                <UBadge color="primary" variant="subtle">{{ totalDuration }}</UBadge>
            </template>
        </div>

        <p v-if="children.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
            {{ $t('cursus.empty') }}
        </p>
        <ol v-else class="flex flex-col w-full">
            <li
                v-for="(child, index) in children" :key="child.id"
                class="flex items-center gap-3 py-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                <span class="text-sm text-gray-500 dark:text-gray-400 w-6 shrink-0 text-right">{{ index + 1 }}</span>
                <NuxtLink
                    :to="localePath(`/catalog/course/${child.slug}`)"
                    class="text-sm font-medium truncate hover:underline" @click.stop>
                    {{ child.title }}
                </NuxtLink>
                <UBadge v-if="child.duration" color="neutral" variant="subtle" size="sm" class="ml-auto shrink-0">
                    {{ formatDuration(child.duration) }}
                </UBadge>
            </li>
        </ol>
    </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase';
import type { CourseCard } from '~~/types/ui';

/**
 * The content of a cursus: the courses it groups, in their playing order. A cursus
 * carries no recording of its own, so this list is everything it holds.
 */
const props = defineProps<{
    course: CourseCard;
}>();

const localePath = useLocalePath();

/** `items` are `course_items` rows; the course itself sits in their expansion. */
const children = computed<RecordModel[]>(() =>
    (props.course.items ?? [])
        .map(item => item.expand?.course)
        .filter((child): child is RecordModel => Boolean(child)));

const formatDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;

/** Sum of the children durations, which is the only duration a cursus really has. */
const totalDuration = computed(() => {
    const seconds = children.value.reduce((total, child) => total + (child.duration ?? 0), 0);
    return seconds > 0 ? formatDuration(seconds) : null;
});
</script>
