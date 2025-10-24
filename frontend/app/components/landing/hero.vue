<template>
  <section
    class="relative h-screen w-full flex items-center justify-center overflow-hidden border-b-2 border-gray-200 dark:border-gray-800">
    <div class="w-full h-full flex justify-between items-center">
      <div
        class="text-center lg:text-left z-10 pl-10 w-2/5 flex flex-col items-start justify-center h-full bg-gray-900 dark:bg-gray-950">
        <h1 class="text-5xl md:text-6xl font-bold w-[500px] leading-tight text-white tracking-tighter">
          {{ $t('hero.title') }}
        </h1>
        <p class="mt-6 text-lg md:text-xl text-white max-w-lg mx-auto lg:mx-0">
          {{ $t('hero.subtitle') }}
        </p>
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
          <UButton :to="localPath('/register')" color="primary" size="xl" class="px-8 py-4">
            {{ $t('hero.start_learning') }}
          </UButton>
          <UButton :to="localPath('/learn/demo_0')" variant="link" color="primary" size="xl"
            icon="i-heroicons-play-circle-20-solid">
            {{ $t('hero.watch_video') }}
          </UButton>
        </div>
      </div>
      <div class="relative flex items-center justify-center w-3/5 -mr-40 -mt-30 h-full">
        <svg class="absolute inset-0 w-full h-full opacity-50 bottom-0" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M120 480 C 300 450, 400 300, 550 320" stroke="#9CA3AF" stroke-width="1.5" stroke-dasharray="5 5" />
          <path d="M550 330 C 580 420, 480 480, 450 470" stroke="#9CA3AF" stroke-width="1.5" stroke-dasharray="5 5" />
        </svg>

        <mock-dynamic-editor />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localPath = useLocalePath();
</script>
