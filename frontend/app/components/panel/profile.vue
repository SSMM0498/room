<template>
    <div v-if="!pending" class="p-6 w-full h-full flex flex-col">
        <div class="flex flex-col w-full">
            <div class="flex items-start justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div class="relative space-y-2">
                    <UAvatar :src="useFileUrl(profileData?.user, 'avatar')" class="w-15 h-15 rounded-sm"
                        :alt="profileData?.user?.username" :chip="profileData?.user?.verified ? {
                            position: 'bottom-right',
                            size: 'xl'
                        } : {}" />
                    <div>
                        <h1 class="text-xl font-bold">{{ profileData?.user?.name }}</h1>
                        <p class="text-gray-500 dark:text-gray-400">@{{ profileData?.user?.username }}</p>
                    </div>
                    <UButton v-if="isOwner" :to="localePath('/settings')" :label="$t('user_profile.edit_profile')" icon="i-heroicons-pencil"
                        color="neutral" block />
                </div>
                <div class="text-right">
                    <p class="text-md line-height-1 font-bold">{{ followerCount }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('user_profile.followers') }}</p>
                    <p class="text-md line-height-1 font-bold">{{ courseCount }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('user_profile.courses') }}</p>
                    <p class="text-md line-height-1 font-bold">{{ viewCount }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('user_profile.views') }}</p>
                </div>
            </div>


            <div v-if="profileData?.school" class="mt-4">
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ profileData?.school.name }}</p>
                <div v-if="schoolTags && schoolTags.length > 0" class="mt-2 flex flex-wrap gap-2">
                    <UBadge v-for="tag in schoolTags" :key="tag.id" variant="outline" color="neutral">
                        {{ tag.name }}
                    </UBadge>
                    <UButton v-if="isOwner" icon="i-heroicons-plus" size="xs" color="neutral" variant="outline" square />
                </div>
            </div>

            <div class="mt-6 flex items-center gap-2" v-if="!isOwner">
                {{ isFollowing }}
                <UButton v-if="isFollowing" @click="handleUnfollow" :label="$t('user_profile.following')" icon="i-heroicons-check"
                    color="neutral" variant="solid" block />
                <UButton v-else @click="handleFollow" :label="$t('user_profile.follow')" color="primary" block />
            </div>

            <div v-if="profileData?.school && profileData?.school.description" class="mt-6">
                <p v-html="profileData?.school.description" class="prose text-gray-700 dark:text-gray-300"></p>
            </div>
        </div>

        <USeparator v-if="isOwner && inProgressCourses" class="my-4" />

        <div v-if="isOwner && !progressPending">
            <h2 class="text-lg font-bold">{{ $t('user_profile.continue_learning') }}</h2>
            <div v-if="inProgressCourses && inProgressCourses.length > 0" class="mt-4 space-y-3">
                <NuxtLink v-for="course in inProgressCourses" :key="course.id"
                    :to="localePath(`/catalog/course/${course.slug}`)"
                    class="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0">
                    </div>
                    <div class="flex-grow min-w-0">
                        <p class="font-semibold truncate">{{ course.title }}</p>
                        <UProgress :value="course.progress" class="mt-1" />
                    </div>
                </NuxtLink>
            </div>
            <div v-else class="mt-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('user_profile.no_courses_in_progress') }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const authUser = useAuthUser();

const { profileData, followerCount, isFollowing, pending, follow, unfollow } = useUserProfile();
const { inProgressCourses, pending: progressPending, fetchInProgressCourses } = useProgress();

const isOwner = computed(() => profileData.value?.user?.id === authUser.value?.id);

// Fetch in-progress courses only for the profile owner
watch([isOwner, authUser], async () => {
    if (isOwner.value && authUser.value) {
        await fetchInProgressCourses();
    }
}, { immediate: true });

const handleFollow = () => {
    if (!authUser.value) {
        navigateTo(localePath('/login'));
    }
    if (profileData.value?.user) follow(profileData.value?.user.id);
};

const handleUnfollow = () => {
    if (profileData.value?.user) unfollow(profileData.value?.user?.id);
};

// Calculate stats
const courseCount = computed(() => profileData.value?.courses?.length || 0);
const viewCount = computed(() => {
    // TODO: Implement view count from backend when available
    return 0;
});

// Extract school tags from courses
const schoolTags = computed(() => {
    if (!profileData.value?.school || !profileData.value?.courses) return [];

    const tagMap = new Map();
    profileData.value.courses.forEach(course => {
        course.tags?.forEach(tag => {
            if (tag && !tagMap.has(tag.id)) {
                tagMap.set(tag.id, tag);
            }
        });
    });

    return Array.from(tagMap.values());
});

</script>