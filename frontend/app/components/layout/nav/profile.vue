<template>
    <nav class="flex items-center justify-start overflow-hidden w-full ml-4">
        <UPopover :popper="{ placement: 'bottom-start' }">
            <UBadge variant="subtle" class="tag rounded-full mr-2" color="neutral">
                <b>Filters</b>
                <UIcon name="i-hugeicons:filter-horizontal" class="mr-1" />
            </UBadge>
            <template #content>
                <div class="p-4">
                    <p class="text-sm text-gray-500">Filters coming soon.</p>
                </div>
            </template>
        </UPopover>

        <div>
            <div v-if="pending">Loading tags...</div>
            <div v-else-if="error">Error loading tags</div>
            <template v-else>
                <widget-tag v-if="isOwner" link="drafts">Drafts</widget-tag>

                <widget-tag v-for="tag in uniqueTags" :key="tag.id" :link="tag.name.toLowerCase()">
                    {{ tag.name }}
                </widget-tag>
            </template>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const { profileData, pending, error } = useUserProfile();
const authUser = useAuthUser();

const isOwner = computed(() => profileData.value?.user?.id === authUser.value?.id);

const uniqueTags = computed(() => {
    if (!profileData.value?.courses) return [];

    const allTags = profileData.value?.courses.flatMap(course => course.tags);
    const uniqueTagMap = new Map();
    allTags.forEach((tag: any) => {
        if (tag && !uniqueTagMap.has(tag.id)) {
            uniqueTagMap.set(tag.id, tag);
        }
    });

    return Array.from(uniqueTagMap.values());
});
</script>

<style scoped lang="css">
nav {
    @apply flex items-center justify-start overflow-hidden;
}

nav div {
    @apply flex items-center justify-start w-full overflow-x-auto;
}
</style>