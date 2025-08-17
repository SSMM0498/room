<template>
  <footer class="fixed bottom-0 left-0 z-20 w-full flex items-center justify-between border-t ui-base p-1 text-xs">
    <nav flex flex-wrap items-center>
      <span mr-3>697 bytes</span>
      <span mr-3>Spaces: 2</span>
      <span mr-3>vue</span>
      <span>Ln 5, Col 17</span>
    </nav>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>

<style scoped lang="css">
@reference "tailwindcss";

footer {
  @apply h-[25px]
}
</style>
