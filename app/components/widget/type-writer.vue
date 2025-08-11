<template>
  <div class="type-writer">
    <span class="text">{{ displayText }}</span><span class="caret">_</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBeforeDelete?: number;
}>();

const displayText = ref('');
const isDeleting = ref(false);

const typeText = () => {
  const speed = isDeleting.value ? (props.deletingSpeed || 75) : (props.typingSpeed || 150);

  if (!isDeleting.value && displayText.value === props.text) {
    isDeleting.value = true;
    setTimeout(typeText, props.delayBeforeDelete || 1000);
    return;
  }

  if (isDeleting.value && displayText.value === '') {
    isDeleting.value = false;
    setTimeout(typeText, 500);
    return;
  }

  const nextText = isDeleting.value
    ? props.text.substring(0, displayText.value.length - 1)
    : props.text.substring(0, displayText.value.length + 1);
    
  displayText.value = nextText;
  setTimeout(typeText, speed);
};

onMounted(() => {
  typeText();
});
</script>

<style scoped>
.type-writer {
  display: inline-flex;
  align-items: flex-start;
}

.caret {
  animation: blink 1.5s step-end infinite;
}

@keyframes blink {
  from,
  to {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}
</style>
