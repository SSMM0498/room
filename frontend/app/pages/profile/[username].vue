<template>
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
const username = route.params.username as string

const sectionUI = useSectionUIStore()

await useAsyncData(`profile-${username}`, async () => await fetchProfile(username))

watch([profileData, authUser], () => {
  if (!profileData.value?.courses) {
    sectionUI.sections = []
    return
  }

  const sectionsArray: Section[] = []
  const allCourses = profileData.value.courses
  const isOwner = profileData.value?.user?.id === authUser.value?.id

  if (isOwner) {
    const draftCourses = allCourses.filter(course => course.status === 'draft')
    if (draftCourses.length > 0) {
      sectionsArray.push({
        title: 'Drafts',
        courses: draftCourses.map(c => ({ ...c, section: 'Drafts' })),
      })
    }
  }

  const publishedCourses = allCourses.filter(course => course.status === 'published')
  const uniqueTagMap = new Map()
  publishedCourses.forEach(course => {
    course.tags?.forEach(tag => {
      if (tag && !uniqueTagMap.has(tag.id)) {
        uniqueTagMap.set(tag.id, tag)
      }
    })
  })
  const uniqueTags = Array.from(uniqueTagMap.values())

  for (const tag of uniqueTags) {
    const coursesForTag = publishedCourses.filter(course =>
      course.tags?.some(t => t.id === tag.id)
    )
    if (coursesForTag.length > 0) {
      sectionsArray.push({
        title: tag.name,
        courses: coursesForTag.map(c => ({ ...c, section: tag.name })),
      })
    }
  }

  sectionUI.sections = sectionsArray
}, { immediate: true })
</script>
