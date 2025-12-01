<template>
  <div class="w-full h-full flex items-start justify-start">
    <template v-if="page?.body?.toc?.links?.length">
      <UContentNavigation highlight highlight-color="primary" color="neutral" :links="page.body.toc.links" />
    </template>
    <template v-else>
      {{ page }}
    </template>
    <article class="prose of-auto overflow-y-scroll h-full w-full pt-10 px-10">
      <ContentRenderer v-if="page" :prose="true" :dir="localeProperties?.dir ?? 'ltr'" :value="page" />
    </article>
  </div>
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
