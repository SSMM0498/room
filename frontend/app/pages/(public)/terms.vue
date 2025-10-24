<template>
  <article class="max-w-none prose h-full of-auto p-6">
    <ContentRenderer
      v-if="page"
      :dir="localeProperties?.dir ?? 'ltr'"
      :value="page"
    />
  </article>
</template>

<script lang="ts" setup>
import type { Collections } from '@nuxt/content'

definePageMeta({
  alias: ["/terms"],
})

const path = '/public/terms';
const { locale, localeProperties } = useI18n()

const { data: page } = await useAsyncData('page-terms', async () => {
  const collection = ('content_' + locale.value) as keyof Collections
  const content = await queryCollection(collection).path(path).first()

  if (!content && locale.value !== 'en') {
    return await queryCollection('content_en').path(path).first()
  }

  return content
}, {
  watch: [locale],
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta(page.value.seo)
</script>
