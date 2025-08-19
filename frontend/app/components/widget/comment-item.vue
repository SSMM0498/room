<template>
  <div class="comment-item border-gray border rounded-lg p-4">
    <div class="flex items-start gap-3">
      <img 
        :src="comment.avatar" 
        :alt="comment.author"
        class="w-10 h-10 rounded-full"
      />
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ comment.author }}</span>
          <span class="text-sm">{{ comment.timestamp }}</span>
        </div>
        <p class="mt-1">{{ comment.content }}</p>
        <div class="flex items-center gap-4 mt-2">
          <button 
            class="flex items-center gap-1 hover:text-primary"
            @click="toggleLike"
          >
            <span>👍</span>
            <span>{{ comment.likes }}</span>
          </button>
          <button 
            class="flex items-center gap-1 hover:text-primary"
            @click="toggleHeart"
          >
            <span>❤️</span>
            <span>{{ comment.hearts }}</span>
          </button>
          <button 
            class="hover:text-primary"
            @click="$emit('reply', comment.id)"
          >
            Reply
          </button>
        </div>
      </div>
      <button class="text-black">
        ⋮
      </button>
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