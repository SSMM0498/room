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
    <h1 class="status-code font-bold text-gray-800 dark:text-gray-200 transition-all duration-300">
      <span>{{ String(error!.statusCode)[0] }}</span>{{ error?.statusCode ? String(error.statusCode).slice(-2) : 'Error'
      }}
    </h1>


    <h2 class="mt-4 text-6xl mb-3 font-semibold text-gray-700 dark:text-gray-300">
      {{ getTitle(error?.statusCode) }}
    </h2>

    <p class="mt-2 max-w-xl text-2xl text-gray-500 dark:text-gray-400">
      {{ getMessage(error?.statusCode) }}
    </p>
    <p class="mt-2 max-w-xl text-2xl text-gray-500 dark:text-gray-400">
      {{ error }}
    </p>

    <UButton class="mt-8" size="lg" color="primary" @click="handleError">
      {{ t('error.home') }}
    </UButton>
  </div>
</template>
<style scoped>
/* Glowing animation for status code */
@keyframes glow {
  0% {
    text-shadow: 0 0 8px rgba(0, 153, 255, 0.8);
  }

  50% {
    text-shadow: 0 0 16px rgba(0, 153, 255, 1);
  }

  100% {
    text-shadow: 0 0 8px rgba(0, 153, 255, 0.8);
  }
}

.status-code {
  animation: glow 2s infinite alternate ease-in-out;
  cursor: pointer;
  transition: text-shadow 0.3s ease;
  position: relative;
  font-size: 20rem;
  line-height: 0.75;
  margin: 0;
  margin-bottom: 5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Hover sharp stacked colors */
/* .status-code:hover {
  animation: none;
  text-shadow:
    4px 4px 0 #ff6ec7,
    -4px -4px 0 #6effa1,
    4px -4px 0 #ffd966,
    -4px 4px 0 #6ecbff;
} */

.status-code span {
  color: #5b5bf7;
  display: inline-block;
  transition: all 0.3s ease;
}

.status-code:hover span {
  transform: scaleX(-1);
}
</style>
