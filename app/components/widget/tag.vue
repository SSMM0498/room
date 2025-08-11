<template>
  <UBadge class="tag rounded-full mr-2" color="neutral" variant="subtle" @click="uiStore.scrollToSection(link)">
    <slot></slot>
  </UBadge>
</template>

<script setup lang="ts">
defineProps({
  link: {
    type: String,
    required: true
  }
})

const uiStore = useSectionUIStore();
</script>

<style lang="css">
@reference "tailwindcss";

.tag {
  @apply before:content-["#"] before:font-bold before:text-blue-600 before:mr-0.5 cursor-pointer;
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
}
</style>
