<template>
  <main class="bg-base m-0 p-0 overflow-hidden flex flex-row justify-center items-start">
    <slot></slot>
  </main>
</template>
<style scoped>
main {
  @apply mt-[60px] w-full;
  width: 100vw;
  height: calc(100vh - 85px);
}

main.content-list {
  width: calc(100% * 3.75);
  @apply justify-stretch;
}
</style>
