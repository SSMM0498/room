<template>
  <h3>Slug</h3>
</template>
<script lang="ts" setup>
definePageMeta({
  alias: ["/learn/:slug()_:index(\\d+)"],
  name: "learn-page",
  layout: "ide"
})
</script>
