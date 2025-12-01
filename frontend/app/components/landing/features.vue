<template>
  <section id="features" class="py-20 lg:py-32 overflow-hidden flex item-center justify-start w-full">
    <div class="flex items-start justify-start ml-10 w-full">
      <div class="flex items-start w-full justify-between">
        <!-- Left side: Title and Subtitle -->
        <div class="flex flex-col items-start justify-start w-1/3 flex-shrink-0 space-y-5 pr-20">
          <UBadge :label="$t('nav.features')" variant="subtle" size="md"
                    class="tracking-wider uppercase rounded-full px-4 py-1.5" />
          <h2 class="text-4xl lg:text-5xl font-bold text-black dark:text-white tracking-tighter">
            {{ $t('features.title') }}
          </h2>
          <p class="mt-4 text-lg text-black dark:text-white">{{ $t('features.subtitle') }}</p>
        </div>

        <!-- Right side: Feature Carousel -->
        <div class="w-2/3">
          <UCarousel v-slot="{ item }" align="start" loop wheel-gestures :autoplay="{ delay: 7500 }" :items="features" :ui="{
            item: 'basis-[340px] h-full flex self-stretch',
            container: 'gap-8 h-full justify-start ml-1 my-3'
          }">
            <div class="relative hover:before:-rotate-4 before:transition before:scale-1.75 inset-0 before:content-[''] before:absolute before:inset-0 before:bg-primary before:-z-10 before:rounded-lg bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-800 h-full">
              <UBadge v-if="item.isComingSoon" variant="subtle" size="md" class="absolute -top-5 -right-15" label="Coming soon!" />
              <UIcon :name="item.icon" class="h-10 w-10" :class="item.iconColor" />
              <h3 class="mt-4 text-xl font-bold text-black dark:text-white">{{ item.title }}</h3>
              <p class="mt-2 text-black dark:text-white">{{ item.description }}</p>
            </div>
          </UCarousel>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

const features = computed(() => [
  {
    icon: 'i-ri:record-circle-line',
    iconColor: 'text-gray-900 dark:text-gray-100 hover:text-red-600',
    title: t('features.recording.title'),
    description: t('features.recording.description')
  },
  {
    icon: 'i-heroicons-play-pause',
    iconColor: 'text-gray-900 dark:text-gray-100 hover:text-purple-600',
    title: t('features.interactive_replays.title'),
    description: t('features.interactive_replays.description')
  },
  {
    icon: 'i-heroicons-signal',
    iconColor: 'text-gray-900 dark:text-gray-100 hover:text-blue-600',
    title: t('features.live_streaming.title'),
    description: t('features.live_streaming.description'),
    isComingSoon: true,
  },
  {
    icon: 'i-heroicons-users',
    iconColor: 'text-gray-900 dark:text-gray-100 hover:text-green-600',
    title: t('features.schools_and_community.title'),
    description: t('features.schools_and_community.description')
  }
])
</script>