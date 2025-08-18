<template>
    <nav class="w-full flex items-center justify-center space-x-10">
        <NuxtLink @click="() => { activeSection = 'features'; scrollToSection('features') }" to="#features"
            class="hover:text-black/50 dark:text-white dark:hover:text-white/70 text-base nav-link" :class="{ 'active': activeSection === 'features' }">
            {{ $t('nav.features') }}
        </NuxtLink>
        <NuxtLink @click="() => { activeSection = 'learn'; scrollToSection('learn') }" to="#learn"
            class="hover:text-black/50 dark:text-white dark:hover:text-white/70 text-base nav-link" :class="{ 'active': activeSection === 'learn' }">
            {{ $t('nav.learn') }}
        </NuxtLink>
        <NuxtLink @click="() => { activeSection = 'community'; scrollToSection('community') }" to="#community"
            class="hover:text-black/50 dark:text-white dark:hover:text-white/70 text-base nav-link" :class="{ 'active': activeSection === 'community' }">
            {{ $t('nav.community') }}
        </NuxtLink>
        <NuxtLink @click="() => { activeSection = 'help'; scrollToSection('help') }" to="#help"
            class="hover:text-black/50 dark:text-white dark:hover:text-white/70 text-base nav-link"  :class="{ 'active': activeSection === 'help' }">
            {{ $t('nav.help') }}
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
const { scrollToSection } = useSectionUIStore();
const activeSection = ref('');
</script>

<style scoped lang="css">
@reference "tailwindcss";

.nav-link.active {
  font-weight: bold;
  position: relative;
}

.nav-link.active::before {
  content: "#";
  /* Tailwind blue-500 */
  position: absolute;
  left: -12px;
  @apply text-blue-500 dark:text-blue-400;
}
</style>