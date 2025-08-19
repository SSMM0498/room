<script setup lang="ts">
const { t } = useI18n();

definePageMeta({
  alias: ["/"],
  name: "home",
  middleware: "guest"
});

useHead({
  title: t('home'),
})

</script>

<template>
  <div class="w-full h-full overflow-y-scroll text-white dark:text-black">
    <landing-hero />
    <landing-features />
    <landing-learn />
    <landing-community />
    <landing-faq />
  </div>
</template>
