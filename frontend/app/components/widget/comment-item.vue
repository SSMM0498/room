<template>
  <div class="comment-item border-accented border rounded-lg p-2">
    <div class="flex items-start gap-3">
      <UAvatar :src="comment.avatar" :alt="comment.author" class="size-10 rounded-full" />
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ comment.author }}</span>
          <span class="text-sm text-dimmed">{{ comment.timestamp }}</span>
        </div>
        <p class="mt-1 text-sm">{{ comment.content }}</p>
        <div class="flex items-center gap-4 mt-2">
          <UButton class="flex items-center gap-1 hover:text-primary p-1 cursor-pointer" variant="ghost"
            @click="toggleLike">
            <span>👍</span>
            <span>{{ comment.likes }}</span>
          </UButton>
          <UButton class="flex items-center gap-1 hover:text-primary p-1 cursor-pointer" variant="ghost"
            @click="toggleHeart">
            <span>❤️</span>
            <span>{{ comment.hearts }}</span>
          </UButton>
          <UButton class="hover:text-primary p-1 cursor-pointer" variant="link" color="neutral"
            @click="$emit('reply', comment.id)">
            Reply
          </UButton>
        </div>
      </div>
      <UButton size="xs" class="px-2 py-1 cursor-pointer" color="neutral" variant="ghost">
        ⋮
      </UButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['reply'])

const toggleLike = () => {
  props.comment.likes += 1
}

const toggleHeart = () => {
  props.comment.hearts += 1
}
</script>