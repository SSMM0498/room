<script setup lang="ts">
import type { NuxtError } from '#app'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  error: Object as () => NuxtError
})

const { t } = useI18n()

const handleError = () => {
  clearError({ redirect: '/' })
}

const getTitle = (statusCode?: number) =>
  t(`error.title.${statusCode}`, t('error.title.default'))

const getMessage = (statusCode?: number) =>
  t(`error.message.${statusCode}`, t('error.message.default'))
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50 dark:bg-gray-900">
    <h1 class="status-code text-9xl font-bold text-gray-800 dark:text-gray-200 transition-all duration-300">
      {{ error?.statusCode || 'Error' }}
    </h1>

    <h2 class="mt-4 text-3xl font-semibold text-gray-700 dark:text-gray-300">
      {{ getTitle(error?.statusCode) }}
    </h2>

    <p class="mt-2 max-w-xl text-lg text-gray-500 dark:text-gray-400">
      {{ getMessage(error?.statusCode) }}
    </p>

    <UButton
      class="mt-8"
      size="lg"
      color="primary"
      @click="handleError"
    >
      {{ t('error.home') }}
    </UButton>
  </div>
</template>
<style scoped>
/* Glowing animation for status code */
@keyframes glow {
  0% { text-shadow: 0 0 8px rgba(0, 153, 255, 0.8); }
  50% { text-shadow: 0 0 16px rgba(0, 153, 255, 1); }
  100% { text-shadow: 0 0 8px rgba(0, 153, 255, 0.8); }
}

.status-code {
  animation: glow 2s infinite alternate ease-in-out;
  cursor: default;
  transition: text-shadow 0.3s ease;
  position: relative;
}

/* Hover sharp stacked colors */
.status-code:hover {
  animation: none;
  text-shadow:
    4px 4px 0 #ff6ec7,
    -4px -4px 0 #6effa1,
    4px -4px 0 #ffd966,
    -4px 4px 0 #6ecbff;
}
</style>
