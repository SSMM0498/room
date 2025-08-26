<script setup lang="ts">
useHead({
  title: 'Home',
  titleTemplate: `%s | ${'room_'}`,
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0' },
    { name: 'description', content: 'An interactive programming education platform with embedded coding environments and immersive, hands-on videos.' },
  ],
})
</script>

<template>

  <Body class="bg-white dark:bg-gray-900 h-screen w-screen">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <UApp :toaster="{ position: 'bottom-center' }">
        <NuxtPage />
      </UApp>
    </NuxtLayout>
  </Body>
</template>

<style lang="css">
@reference "tailwindcss";

body #__nuxt {
  @apply overflow-y-hidden;
}

body #__nuxt::-webkit-scrollbar {
  display: none;
}

body #__nuxt::-webkit-scrollbar-track {
  display: none;
}

body #__nuxt::-webkit-scrollbar-track:hover {
  display: none;
}

body #__nuxt::-webkit-scrollbar-thumb {
  display: none;
}
</style>
