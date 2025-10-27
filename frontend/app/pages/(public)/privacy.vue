<template>
  <article class="w-full py-10 prose h-full of-auto overflow-y-scroll">
    <ContentRenderer class="w-300 px-50" v-if="page" :prose="true" :dir="localeProperties?.dir ?? 'ltr'" :value="page" />
  </article>
</template>

<script lang="ts" setup>
import type { Collections } from '@nuxt/content'

definePageMeta({
  alias: ["/privacy"],
})

const path = '/public/privacy';
const { locale, localeProperties } = useI18n()

const { data: page } = await useAsyncData('page-privacy', async () => {
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
