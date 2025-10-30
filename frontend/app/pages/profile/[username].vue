<template>
  <Head>
    <Title>{{ profileData?.user?.username ?? 'Loading' }}</Title>
  </Head>
  <widget-pinned-section>
    <panel-profile />
  </widget-pinned-section>
  <div v-if="pending" class="p-6">Loading sections...</div>
  <div v-else-if="error" class="p-6 text-red-500">Failed to load courses. Please try again.</div>
  <layout-section v-else v-for="section in sectionUI.sections" :key="section.title" :section="section" />
</template>

<script setup lang="ts">
import type { Section } from '~~/types/ui'

definePageMeta({
  alias: ["/@/:username()"],
  layout: "content",
  name: 'profile'
});

const { profileData, pending, error, fetchProfile } = useUserProfile()
const route = useRoute()
const authUser = useAuthUser()
const username = computed(() => route.params.username as string)

const sectionUI = useSectionUIStore()
sectionUI.sectionType = 'tech'

await useAsyncData(
  () => `profile-${username.value}`,
  async () => await fetchProfile(username.value),
  {
    watch: [username]
  }
)

watch([profileData, authUser], () => {
  if (!profileData.value?.courses || !profileData.value?.user) {
    sectionUI.sections = []
    return
  }

  const sectionsArray: Section[] = []
  const allCourses = profileData.value.courses
  const isOwner = profileData.value?.user?.id === authUser.value?.id

  // Show draft courses section only for the profile owner
  if (isOwner) {
    const draftCourses = allCourses.filter(course => course.status === 'draft')
    if (draftCourses.length > 0) {
      sectionsArray.push({
        title: 'Drafts',
        courses: draftCourses.map(c => ({ ...c, section: 'Drafts' })),
      })
    }
  }

  // Show published courses grouped by tags
  const publishedCourses = allCourses

  // Collect unique tags from published courses
  const uniqueTagMap = new Map()
  publishedCourses.forEach(course => {
    if (course.tags && course.tags.length > 0) {
      course.tags.forEach(tag => {
        if (tag && tag.id && tag.name && !uniqueTagMap.has(tag.id)) {
          uniqueTagMap.set(tag.id, tag)
        }
      })
    }
  })
  const uniqueTags = Array.from(uniqueTagMap.values())

  // Create a section for each tag
  for (const tag of uniqueTags) {
    const coursesForTag = publishedCourses.filter(course =>
      course.tags?.some(t => t && t.id === tag.id)
    )
    if (coursesForTag.length > 0) {
      sectionsArray.push({
        title: tag.name,
        courses: coursesForTag.map(c => ({ ...c, section: tag.name })),
      })
    }
  }

  // Handle published courses without tags
  const coursesWithoutTags = publishedCourses.filter(course =>
    !course.tags || course.tags.length === 0
  )
  if (coursesWithoutTags.length > 0) {
    sectionsArray.push({
      title: 'Other Courses',
      courses: coursesWithoutTags.map(c => ({ ...c, section: 'Other Courses' })),
    })
  }

  sectionUI.sections = sectionsArray
}, { immediate: true })
</script>
