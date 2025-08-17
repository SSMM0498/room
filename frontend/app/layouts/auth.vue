<template>
  <main class="w-screen h-screen bg-base m-0 p-0 overflow-hidden flex justify-center items-center">
    <NuxtLink :to="localePath('/')" class="font-inter fixed top-10 left-20 flex justify-center items-center mr-2 mt-[-5px] text-black/70 dark:text-white/70 text-4xl font-bold">room_</NuxtLink>
    <slot></slot>
  </main>
</template>
<script setup lang="ts">
const localePath = useLocalePath();
</script>