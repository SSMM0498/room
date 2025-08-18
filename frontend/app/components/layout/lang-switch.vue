<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locales, locale, setLocale } = useI18n();

const items = locales.value.map((item) => {
  if (typeof item == "object") {
    return [{
      label: item.name!,
      onSelect(e: Event) {
        setLocale(item.code);
      }
    }]
  }
}) as DropdownMenuItem[][]
</script>

<template>
  <UDropdownMenu :items="items" arrow>
    <UButton variant="link" size="xs" color="neutral" :label="locale" icon="i-ri-global-line"
      trailing-icon="i-heroicons-chevron-down-20-solid" />
  </UDropdownMenu>
</template>

