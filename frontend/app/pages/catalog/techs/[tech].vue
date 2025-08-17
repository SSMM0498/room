<script setup lang="ts">
import type { Section } from '~~/types/ui';

const route = useRoute();
const tech = (route.params.tech as string);

definePageMeta({
  alias: ["/catalog/techs/:tech"],
  layout: "content",
});

useHead({
  title: tech,
});
</script>

<template>
  <widget-pinned-section>
    <panel-tech :tech="tech.toLowerCase()" />
  </widget-pinned-section>
  <!-- <layout-section :section="section" v-for="section in sections" :key="section.title"></layout-section> -->
</template>
