<template>
  <Head>
    <Title>{{ course?.title ?? 'Loading' }}</Title>
  </Head>
  <div class="content-grid">
    <template v-if="coursesPending">
      <USkeleton class="w-full h-full mb-4" />
      <USkeleton class="w-full h-full" />
    </template>
    <template v-else>
      <article class="full border-r-1 border-gray-300">
        <NuxtLink class="banner" :to="localePath('/learn/' + course?.slug)">
          <UIcon name="i-ri-play-circle-line" size="250" class="opacity-0 play-icon">
          </UIcon>
        </NuxtLink>
        <UAvatar :src="useFileUrl(course?.author!.avatar, 'avatar', '100x100')" :alt="course?.author!.avatar.username"
          crossorigin="anonymous" class="absolute left-[12px] bottom-[12px]" />
        <div class="absolute right-[12px] bottom-[12px]">{{ course?.createdDate }}</div>
      </article>
      <UTabs :items="tabs" class="w-full" variant="link">
        <template #overview>
          <div class="flex flex-col w-full items-start justify-start gap-2 p-4">
            <div class="flex items-center gap-4 w-full pb-4 border-b mb-2">
              <UAvatar :src="course?.author!.avatar" size="lg" alt="Avatar for ssmm" />
              <div class="flex flex-col">
                <h3 class="text-lg font-medium">{{ course?.author!.username }}</h3>
                <p class="text-sm text-gray-600">Course Instructor</p>
              </div>
              <div class="flex gap-2 ml-auto">
                <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/SSMM0498"
                  target="_blank" />
                <UButton icon="i-simple-icons-twitter" color="neutral" variant="ghost" to="https://github.com/SSMM0498"
                  target="_blank" />
              </div>
            </div>
            <h2 text-2xl mb-2 font-medium>
              {{ course?.title }}
            </h2>
            <div class="tags">
              <widget-tag v-for="tag in course?.tags" :key="tag.id" :link="`#${tag.name}`">{{ tag.name }}</widget-tag>
            </div>
            <p>
              {{ course?.description }}
            </p>
          </div>
        </template>
        <template #content>
          <div flex flex-col w-full gap-2 p-4>
            <div class="flex w-full justify-between items">
              <div class="flex items-center justify-start">
                <UBadge color="primary" variant="subtle">{{ course?.durationFormatted }}</UBadge>
                <span class="text-lg mx-1">·</span>
                <UBadge color="primary" variant="subtle">41 sections</UBadge>
                <span class="text-lg mx-1">·</span>
                <UBadge color="primary" variant="subtle">120 Kb</UBadge>
              </div>
            </div>
          </div>
        </template>
        <template #feedback>
          <widget-comment-panel />
        </template>
      </UTabs>
    </template>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  alias: ["/course/:slug"],
  name: "course-details",
})

const localePath = useLocalePath()
const route = useRoute()
const { currentCourse: course, fetchCourseBySlug, pending: coursesPending, error: coursesError } = useCourses();

onMounted(async () => {
  await fetchCourseBySlug(route.params.slug as string)
})

const tabs = [{
  slot: 'overview',
  label: 'Overview'
}, {
  slot: 'content',
  label: 'Course Content'
}, {
  slot: 'feedback',
  label: 'Feedback'
}]

useHead({
  meta: [
    { name: 'description', content: course.value?.description },
    { name: 'keywords', content: course.value?.tags?.map(t => t.name).join(', ') },
  ],
})
</script>

<style scoped lang="css">
@reference "tailwindcss";

article.full {
  @apply relative flex items-center justify-center overflow-hidden;
  min-height: calc(100vh - 85px);
  max-height: calc(100vh - 85px);
}

.content-grid {
  @apply grid grid-cols-[2fr_1fr] mb-6 w-full h-full;
}

.comments-section {
  @apply bg-gray-50 rounded-lg p-4;
  height: fit-content;
}

article.full .banner {
  @apply flex items-center justify-center w-full cursor-pointer shadow-blue-500/40 m-6 bg-blue-200 rounded-[7.5px];
  height: calc(100vh - 125px);
}

article.full .banner:hover .play-icon {
  @apply opacity-100;
}
</style>
