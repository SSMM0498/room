<template>
  <footer
    class="fixed bottom-0 left-0 z-20 w-full flex items-center justify-end border-t ui-base p-1 text-xs border-gray-200 dark:border-gray-800">
    <nav class="absolute left-1 flex flex-wrap items-center">
      <layout-lang-switch />
      <nuxt-link class="ml-2 me-6 hover:underline" :to="localePath('/about')">{{ $t('about') }}</nuxt-link>
      <nuxt-link class="me-6 hover:underline" :to="localePath('/privacy')">{{ $t('privacy-policy') }}</nuxt-link>
      <nuxt-link class="me-6 hover:underline" :to="localePath('/terms')">{{ $t('terms') }}</nuxt-link>
      <nuxt-link class="me-6 hover:underline" :to="localePath('/contact')">{{ $t('help') }}</nuxt-link>
    </nav>
    Copyright ©️ 2024 | Made with <span class="heart mx-1">❤️</span> and ☕ by ArkadSquad
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>

<style scoped lang="css">
@reference "tailwindcss";

footer {
  @apply h-[25px]
}

@-webkit-keyframes beat {
  0% {
    transform: scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.4);
  }
}

@keyframes beat {
  0% {
    transform: scale(1);
  }

  50% {
    transform: translateY(-4px) scale(1.4);
  }
}

span.heart {
  transform-origin: center;
  animation: beat 1.5s infinite alternate;
}
</style>
