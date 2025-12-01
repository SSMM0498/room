<template>
  <UBadge class="tag rounded-full mr-2 before:content-['#'] before:font-bold before:text-primary before:mr-0.5 cursor-pointer" :size="size" color="neutral" variant="subtle" @click="link && uiStore.scrollToSection(link)">
    <slot></slot>
  </UBadge>
</template>

<script setup lang="ts">
defineProps({
  link: {
    type: String,
    required: false
  },
  to: {
    type: String,
    required: false
  },
  size: {
    type: String as PropType<"md" | "xs" | "sm" | "lg" | "xl">,
    default: 'md'
  }
})

const uiStore = useSectionUIStore();
</script>

<style lang="css">
@reference "tailwindcss";

.tag {
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
}
</style>
