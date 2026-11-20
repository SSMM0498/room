<template>
    <div v-if="pending && !currentSchool" class="p-6 w-full flex flex-col gap-3">
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-6 w-1/2" />
        <USkeleton class="h-4 w-1/3" />
    </div>
    <div v-else-if="!currentSchool" class="p-6 text-gray-500 dark:text-gray-400">
        {{ errorMessage || 'This school does not exist.' }}
    </div>
    <div v-else class="p-6 w-full h-full flex flex-col overflow-y-auto">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div class="h-24 w-full bg-gray-100 dark:bg-gray-800">
                <img v-if="bannerUrl" :src="bannerUrl" :alt="`${currentSchool.name} banner`"
                    class="h-24 w-full object-cover">
            </div>
            <div class="flex items-start justify-between p-3">
                <div class="space-y-2">
                    <UAvatar :src="logoUrl" :alt="currentSchool.name" icon="i-heroicons-academic-cap"
                        class="w-15 h-15 rounded-sm -mt-10 ring-2 ring-white dark:ring-gray-900" />
                    <div>
                        <h1 class="text-xl font-bold">{{ currentSchool.name }}</h1>
                        <NuxtLink v-if="owner" :to="localePath(`/@/${owner.username}`)"
                            class="text-gray-500 dark:text-gray-400 hover:underline">
                            @{{ owner.username }}
                        </NuxtLink>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-md line-height-1 font-bold">{{ schoolCourses.length }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('user_profile.courses') }}</p>
                    <p class="text-md line-height-1 font-bold">{{ topics.length }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">topics</p>
                </div>
            </div>
        </div>

        <div v-if="isOwner" class="mt-4 flex items-center gap-2">
            <UButton :to="localePath(`/dashboard/${currentSchool.id}`)" icon="i-heroicons-squares-2x2" color="neutral"
                block>
                Dashboard
            </UButton>
            <UButton :to="localePath(`/dashboard/edit/${currentSchool.id}`)" icon="i-heroicons-pencil" color="neutral"
                variant="outline" block>
                Edit school
            </UButton>
        </div>

        <div v-if="topics.length > 0" class="mt-4 flex flex-wrap gap-2">
            <UBadge v-for="topic in topics" :key="topic.id" variant="outline" color="neutral">
                {{ topic.name }}
            </UBadge>
        </div>

        <p v-if="currentSchool.description" class="mt-6 whitespace-pre-line text-gray-700 dark:text-gray-300">
            {{ currentSchool.description }}
        </p>
    </div>
</template>

<script setup lang="ts">
import type { RecordModel } from 'pocketbase';

const localePath = useLocalePath();
const authUser = useAuthUser();
const { currentSchool, schoolCourses, pending, errorMessage } = useSchools();

const owner = computed(() => currentSchool.value?.expand?.owner as RecordModel | undefined);
const topics = computed(() => (currentSchool.value?.expand?.topics as RecordModel[] | undefined) ?? []);
const isOwner = computed(() => !!authUser.value && currentSchool.value?.owner === authUser.value.id);

const logoUrl = computed(() => useFileUrl(currentSchool.value, 'logo', '200x200'));
const bannerUrl = computed(() => useFileUrl(currentSchool.value, 'banner', '800x0'));
</script>
