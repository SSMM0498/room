<template>
    <UPopover :popper="{ placement: 'bottom-start' }">
        <UBadge variant="subtle" class="tag rounded-full mr-4 cursor-pointer" color="neutral">
            <b>{{ $t('filters.title') }}</b>
            <UBadge v-if="activeFilterCount" color="primary" variant="solid" size="sm" class="rounded-full ml-1 px-1.5">
                {{ activeFilterCount }}
            </UBadge>
            <UIcon name="i-hugeicons:filter-horizontal" class="mr-1" />
        </UBadge>
        <template #content>
            <div class="p-3 bg-default w-full flex flex-col gap-4">
                <div v-for="filter in groups" :key="filter.key">
                    <p class="text-xs font-bold mb-1">{{ filter.label }}</p>
                    <UButtonGroup size="xs">
                        <UButton
                            v-for="option in filter.options" :key="option.value"
                            :color="filter.selected === option.value ? 'primary' : 'neutral'"
                            :variant="filter.selected === option.value ? 'solid' : 'soft'"
                            @click="filter.select(option.value)">
                            {{ option.label }}
                        </UButton>
                    </UButtonGroup>
                </div>
                <UButton
                    v-if="activeFilterCount" size="xs" variant="link" color="neutral"
                    icon="i-heroicons-arrow-path-20-solid" class="self-start px-0" @click="resetFilters">
                    {{ $t('filters.reset') }}
                </UButton>
            </div>
        </template>
    </UPopover>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';

/** One dropdown of the menu: the value it currently holds, and the ones it accepts. */
type FilterGroup = {
    key: string;
    label: string;
    selected: string;
    options: { value: string; label: string }[];
    select: (value: string) => void;
};

const { t } = useI18n();
const { roomType, price, duration, sort, activeFilterCount, resetFilters } = useCourseFilters();

/**
 * Describes one filter for the menu. The values are read off the shared state, so the
 * menu stays in sync with whatever else changes a filter.
 */
const group = <T extends string>(key: string, model: Ref<T>, values: readonly T[]): FilterGroup => ({
    key,
    label: t(`filters.${key}.label`),
    selected: model.value,
    options: values.map(value => ({ value, label: t(`filters.${key}.${value}`) })),
    select: (value: string) => { model.value = value as T; },
});

const groups = computed<FilterGroup[]>(() => [
    // `single`, `cursus` and `live` are the values of the `type` field of a course.
    group('type', roomType, ['all', 'cursus', 'live', 'single']),
    group('price', price, ['all', 'free', 'under5', 'under10', 'under20']),
    group('duration', duration, ['all', 'short', 'medium', 'long']),
    group('sort', sort, ['relevance', 'recent', 'participation', 'rating']),
]);
</script>
