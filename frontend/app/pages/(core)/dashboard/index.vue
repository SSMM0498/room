<template>
    <div class="w-full base-height flex items-center justify-center">
        <div v-if="errorMessage" class="text-center space-y-4">
            <p class="text-red-500">{{ errorMessage }}</p>
            <UButton :to="localePath('/')" color="neutral" variant="outline">Go home</UButton>
        </div>
        <div v-else class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-5 w-5" />
            Opening your dashboard...
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth',
    name: 'dashboard-home'
});

const localePath = useLocalePath();
const { ensureUserSchool, errorMessage } = useSchools();

// Every instructor owns exactly one school; send them straight to its dashboard.
onMounted(async () => {
    const school = await ensureUserSchool();
    if (school) {
        await navigateTo(localePath(`/dashboard/${school.id}`), { replace: true });
    }
});
</script>
