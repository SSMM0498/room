<template>
    <div v-if="!pending" class="p-6 w-full h-full flex flex-col">
        <div class="flex items-start justify-between">
            <div class="relative">
                <UAvatar :src="useFileUrl(profileData?.user, 'avatar')" size="3xl" :alt="profileData?.user?.username" />
                <div v-if="profileData?.user?.verified" class="absolute -bottom-1 -right-1">
                    <div
                        class="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        <UIcon name="i-heroicons-check-20-solid" class="h-3 w-3 text-white" />
                    </div>
                </div>
            </div>
            <div class="text-right">
                <p class="text-lg font-bold">{{ followerCount }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">followers</p>
            </div>
        </div>

        <div class="mt-4">
            <h1 class="text-2xl font-bold">{{ profileData?.user?.name }}</h1>
            <p class="text-gray-500 dark:text-gray-400">@{{ profileData?.user?.username }}</p>
        </div>

        <div v-if="profileData?.school" class="mt-4">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ profileData?.school.name }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
                <UBadge variant="outline" color="neutral">NuxtJS</UBadge>
                <UBadge variant="outline" color="neutral">VueJS</UBadge>
                <UBadge variant="outline" color="neutral">Go</UBadge>
                <UButton icon="i-heroicons-plus" size="xs" color="neutral" variant="outline" square />
            </div>
        </div>

        <div class="mt-6 flex items-center gap-2">
            <UButton v-if="isOwner" :to="localePath('/settings')" label="Edit Profile" icon="i-heroicons-pencil"
                color="neutral" block />
            <UButton v-else-if="isFollowing" @click="handleUnfollow" label="Following" icon="i-heroicons-check"
                color="neutral" variant="solid" block />
            <UButton v-else @click="handleFollow" label="Follow" color="primary" block />

            <UButton icon="i-heroicons-star" label="Save to list" color="neutral" variant="outline" />
        </div>

        <div v-if="profileData?.school && profileData?.school.description" class="mt-6">
            <p class="text-gray-700 dark:text-gray-300">{{ profileData?.school.description }}</p>
        </div>

        <USeparator class="my-6" />

        <div>
            <h2 class="text-lg font-bold">Continue Learning</h2>
            <div class="mt-4 space-y-3">
                <div v-for="course in inProgressCourses" :key="course.id"
                    class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0">
                    </div>
                    <div class="flex-grow">
                        <p class="font-semibold truncate">{{ course.title }}</p>
                        <UProgress :value="course.progress" class="mt-1" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const authUser = useAuthUser();

const { profileData, followerCount, isFollowing, pending, follow, unfollow } = useUserProfile();

const isOwner = computed(() => profileData.value?.user?.id === authUser.value?.id);

const handleFollow = () => {
    if (!authUser.value) {
        navigateTo(localePath('/login'));
    }
    if (profileData.value?.user) follow(profileData.value?.user.id);
};

const handleUnfollow = () => {
    if (profileData.value?.user) unfollow(profileData.value?.user?.id);
};

const inProgressCourses = ref([
    { id: 1, title: 'Mastering Go Concurrency', progress: 75 },
    { id: 2, title: 'Advanced Nuxt 3 Patterns', progress: 40 },
]);

</script>