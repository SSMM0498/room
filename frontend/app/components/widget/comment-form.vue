<template>
  <div class="comment-input">
    <UInput
      type="text"
      v-model="commentText"
      :placeholder="placeholder"
      input-class="input-base" size="sm" color="white"
      @keyup.enter="submitComment"
    />
    <div v-if="replyTo" class="mt-2 flex gap-2">
      <button
        @click="submitComment"
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reply
      </button>
      <button
        @click="$emit('cancel-reply')"
        class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  replyTo: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['post-comment', 'cancel-reply'])

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