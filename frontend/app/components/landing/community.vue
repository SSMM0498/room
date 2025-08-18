<template>
  <section id="community" class="pt-10 pb-45 w-full flex item-center justify-center">
    <div class="flex w-full items-center justify-center flex-col px-4 text-center">
      <div class="flex justify-center mb-10" @mouseenter="pauseAutoSwitch" @mouseleave="resumeAutoSwitch">
        <UButtonGroup size="xl">
          <UButton :color="activeCard === 0 ? 'primary' : 'neutral'" :variant="activeCard === 0 ? 'solid' : 'subtle'" :active="activeCard === 0"
            @click="setActiveCard(0)">
            {{ $t('community.switch.student') }}
          </UButton>
          <UButton :color="activeCard === 1 ? 'primary' : 'neutral'" :variant="activeCard === 1 ? 'solid' : 'subtle'" :active="activeCard === 1"
            @click="setActiveCard(1)">
            {{ $t('community.switch.tutor') }}
          </UButton>
        </UButtonGroup>
      </div>
      <div class="community-wrapper flex w-full items-center justify-center" @mouseenter="pauseAutoSwitch" @mouseleave="resumeAutoSwitch">
        <div class="community-block aspect-square flex items-center justify-center flex-col w-[500px] px-20 rounded-lg" :class="{ active: activeCard === 0 }">
          <h2 class="text-4xl lg:text-5xl font-bold tracking-tighter">{{ $t('community.title') }}</h2>
          <p class="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">{{ $t('community.subtitle') }}</p>
          <div class="mt-8">
            <UButton to="/register" color="primary" size="xl" class="px-8 py-4">
              {{ $t('community.start_teaching') }}
            </UButton>
          </div>
        </div>

        <div class="community-block aspect-square flex items-center justify-center flex-col w-[500px] px-20 rounded-lg" :class="{ active: activeCard === 1 }">
          <h2 class="text-4xl lg:text-5xl font-bold tracking-tighter">{{ $t('community.learn_title') }}</h2>
          <p class="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">{{ $t('community.learn_subtitle') }}</p>
          <div class="mt-8">
            <UButton to="/register" color="primary" size="xl" class="px-8 py-4">
              {{ $t('community.start_learning') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const activeCard = ref(0)
let autoSwitchInterval: NodeJS.Timeout | null = null

const setActiveCard = (index: number) => {
  activeCard.value = index
}

const switchCard = () => {
  activeCard.value = activeCard.value === 0 ? 1 : 0
}

const startAutoSwitch = () => {
  autoSwitchInterval = setInterval(switchCard, 5000)
}

const pauseAutoSwitch = () => {
  if (autoSwitchInterval) {
    clearInterval(autoSwitchInterval)
    autoSwitchInterval = null
  }
}

const resumeAutoSwitch = () => {
  pauseAutoSwitch() // Clear any existing interval
  startAutoSwitch()
}

onMounted(() => {
  startAutoSwitch()
})

onUnmounted(() => {
  pauseAutoSwitch()
})
</script>

<style scoped lang="css">
@reference "tailwindcss";

.community-wrapper {
  position: relative;
  min-height: 400px;
}

.community-block {
  position: absolute;
  top: 15px;
  transform: rotate(5deg);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
  pointer-events: none;
  @apply bg-gray-700 dark:bg-gray-800 text-white;
}

.community-block.active {
  opacity: 1;
  transform: rotate(2deg) translateY(0);
  z-index: 10;
  pointer-events: auto;
  @apply bg-gray-900 text-white dark:bg-gray-950;
}

.community-wrapper:hover .community-block {
  transition-duration: 0.4s;
}
</style>