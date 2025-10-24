<template>
    <nav class="flex items-center justify-start overflow-hidden ml-4">
        <UPopover :popper="{ placement: 'bottom-start' }">
            <UBadge variant="subtle" class="tag rounded-full mr-4" color="neutral">
                <b>Filters</b>
                <UIcon name="i-hugeicons:filter-horizontal" class="mr-1" />
            </UBadge>
            <template #content>
                <div class="p-3 w-full flex flex-col gap-4">
                    <div>
                        <p class="text-xs font-bold mb-1">Room Type</p>
                        <UButtonGroup size="xs">
                            <UButton color="primary" variant="solid" :active="true">All</UButton>
                            <UButton color="neutral" variant="soft">Cursus</UButton>
                            <UButton color="neutral" variant="soft">Live</UButton>
                            <UButton color="neutral" variant="soft">Single</UButton>
                            <UButton color="neutral" variant="soft">School</UButton>
                        </UButtonGroup>
                    </div>
                    <div>
                        <p class="text-xs font-bold mb-1">Pricing</p>
                        <UButtonGroup size="xs">
                            <UButton color="primary" variant="solid" :active="true">All</UButton>
                            <UButton color="neutral" variant="soft">Free</UButton>
                            <UButton color="neutral" variant="soft">&lt;5$</UButton>
                            <UButton color="neutral" variant="soft">&lt;10$</UButton>
                            <UButton color="neutral" variant="soft">&lt;20$</UButton>
                        </UButtonGroup>
                    </div>
                    <div>
                        <p class="text-xs font-bold mb-1">Duration</p>
                        <UButtonGroup size="xs">
                            <UButton color="primary" variant="solid" :active="true">All</UButton>
                            <UButton color="neutral" variant="soft">Short</UButton>
                            <UButton color="neutral" variant="soft">Medium</UButton>
                            <UButton color="neutral" variant="soft">Long</UButton>
                        </UButtonGroup>
                    </div>
                    <div>
                        <p class="text-xs font-bold mb-1">Sort by</p>
                        <UButtonGroup size="xs">
                            <UButton color="primary" variant="solid" :active="true">Relevance</UButton>
                            <UButton color="neutral" variant="soft">Upload date</UButton>
                            <UButton color="neutral" variant="soft">Participation</UButton>
                            <UButton color="neutral" variant="soft">Rating</UButton>
                        </UButtonGroup>
                    </div>
                </div>
            </template>
        </UPopover>
        <div>
            <div v-if="pending">Loading tags...</div>
            <div v-else-if="error">Error loading tags</div>
            <template v-else>
                <widget-tag link="latest">Latest</widget-tag>
                <widget-tag link="top">Top</widget-tag>
                <widget-tag :link="tag.name.toLowerCase()" v-for="tag in tags" :key="tag.id">
                    {{ tag.name }}
                </widget-tag>
            </template>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { tags, pending, error, fetchTags } = useTags();

onMounted(async () => {
    await fetchTags();
});
</script>

<style scoped lang="css">
nav {
    @apply flex items-center justify-start overflow-hidden;
}

nav div::-webkit-scrollbar,
nav div::-webkit-scrollbar-track,
nav div::-webkit-scrollbar-track:hover,
nav div::-webkit-scrollbar-thumb,
nav div::-webkit-scrollbar-thumb:hover {
    display: none;
}

nav>div {
    @apply flex items-center justify-between w-full overflow-x-auto;
}
</style>