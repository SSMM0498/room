<template>
  <div class="comment-input">
    <UTextarea class="w-full" :ui="{ base: 'border-b border-accented rounded-b-none' }" v-model="commentText"
      :placeholder="placeholder" color="neutral" variant="ghost" :rows="1" input-class="input-base" size="md"
      @keyup.enter="submitComment" />
    <div v-if="replyTo" class="mt-1 flex gap-2">
      <UButton @click="submitComment">
        Reply
      </UButton>
      <UButton @click="$emit('cancel-reply')" variant="ghost" color="neutral">
        Cancel
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  replyTo?: string | null
}>()

const emit = defineEmits<{
  'post-comment': [content: string]
  'cancel-reply': []
}>()

const commentText = ref('')

const placeholder = computed(() => {
  return props.replyTo
    ? 'Write a reply...'
    : 'Write comment'
})

const submitComment = () => {
  if (commentText.value.trim()) {
    emit('post-comment', commentText.value)
    commentText.value = ''
  }
}
</script>