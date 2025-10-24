<template>
  <section id="features" class="py-20 lg:py-32">
    <div class="container mx-auto px-4">
      <div class="text-center max-w-3xl mx-auto">
        <h2 class="text-4xl lg:text-5xl font-bold text-black dark:text-white tracking-tighter">{{ $t('features.title')
        }}</h2>
        <p class="mt-4 text-lg text-black dark:text-white">{{ $t('features.subtitle') }}</p>
      </div>
      <div class="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Feature 1 -->
        <div class="bg-white dark:bg-gray-950 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
          <UIcon name="i-ri:record-circle-line" class="h-10 w-10 text-red-600" />
          <h3 class="mt-4 text-xl font-bold text-black dark:text-white">{{ $t('features.recording.title') }}</h3>
          <p class="mt-2 text-black dark:text-white">{{ $t('features.recording.description') }}</p>
        </div>
        <!-- Feature 2 -->
        <div class="bg-white dark:bg-gray-950 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
          <UIcon name="i-heroicons-play-pause" class="h-10 w-10 text-purple-600" />
          <h3 class="mt-4 text-xl font-bold text-black dark:text-white">{{ $t('features.interactive_replays.title') }}
          </h3>
          <p class="mt-2 text-black dark:text-white">{{ $t('features.interactive_replays.description') }}</p>
        </div>
        <!-- Feature 3 -->
        <div class="bg-white dark:bg-gray-950 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
          <UIcon name="i-heroicons-signal" class="h-10 w-10 text-blue-600" />
          <h3 class="mt-4 text-xl font-bold text-black dark:text-white">{{ $t('features.live_streaming.title') }}</h3>
          <p class="mt-2 text-black dark:text-white">{{ $t('features.live_streaming.description') }}</p>
        </div>
        <!-- Feature 4 -->
        <div class="bg-white dark:bg-gray-950 p-8 rounded-lg border border-gray-200 dark:border-gray-800">
          <UIcon name="i-heroicons-users" class="h-10 w-10 text-green-600" />
          <h3 class="mt-4 text-xl font-bold text-black dark:text-white">{{ $t('features.schools_and_community.title') }}
          </h3>
          <p class="mt-2 text-black dark:text-white">{{ $t('features.schools_and_community.description') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>