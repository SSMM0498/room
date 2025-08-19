<template>
  <div class="feedback-container max-w-2xl h-full overflow-y-auto p-4">
    <h2 class="text-2xl font-bold mb-2">Feedback</h2>

    <widget-comment-form 
      @post-comment="addComment" 
      :reply-to="replyingTo"
      @cancel-reply="cancelReply"
    />

    <div class="comments-list space-y-4 mt-6">
      <widget-comment-item
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        @reply="startReply"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const comments = ref([
  {
    id: 1,
    author: 'Alexander Koghuashvili',
    avatar: '/avatar1.jpg',
    content: "Wonderful work and creative presentation. I'll be very happy if you also see my projects 😊",
    timestamp: '1 hour ago',
    likes: 1,
    hearts: 1
  },
  {
    id: 2,
    author: 'John Welsone',
    avatar: '/avatar2.jpg',
    content: 'Love this! Huge fan of the low opacity tiles they add such a cool dimension to the design',
    timestamp: '1 hour ago',
    likes: 0,
    hearts: 0
  }
])

const replyingTo = ref(null)

const addComment = (content) => {
  const newComment = {
    id: comments.value.length + 1,
    author: 'Current User',
    avatar: '/current-user-avatar.jpg',
    content,
    timestamp: 'Just now',
    likes: 0,
    hearts: 0
  }

  comments.value.push(newComment)
  replyingTo.value = null
}

const startReply = (commentId) => {
  replyingTo.value = commentId
}

const cancelReply = () => {
  replyingTo.value = null
}
</script>

<style scoped>
.feedback-container {
  font-family: system-ui, -apple-system, sans-serif;
  max-height: calc(100vh - 125px);
}

.feedback-container::-webkit-scrollbar {
  display: none;
}

.feedback-container {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>