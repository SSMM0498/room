<template>
  <div class="feedback-container max-w-2xl h-full overflow-y-auto p-4">
    <h2 class="text-2xl font-bold mb-2">Feedback</h2>

    <widget-comment-form
      @post-comment="addComment"
      :reply-to="replyingTo"
      @cancel-reply="cancelReply"
    />

    <div v-if="pending" class="flex items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6" />
    </div>

    <div v-else-if="error" class="text-red-500 py-4">
      Failed to load comments. Please try again.
    </div>

    <div v-else class="comments-list space-y-4 mt-6">
      <widget-comment-item
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        @reply="startReply"
        @edit="editComment"
        @delete="deleteComment"
        @toggle-like="toggleLike"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  courseId: string
}>()

const { comments, pending, error, fetchCommentsByCourse, createComment, updateComment, deleteComment: deleteCommentApi, toggleLike: toggleLikeApi } = useComment()
const replyingTo = ref<string | null>(null)

onMounted(async () => {
  if (props.courseId) {
    await fetchCommentsByCourse(props.courseId)
  }
})

const addComment = async (content: string) => {
  if (!content.trim()) return

  await createComment({
    course: props.courseId,
    content,
    replyTo: replyingTo.value || undefined,
  })

  replyingTo.value = null
}

const startReply = (commentId: string) => {
  replyingTo.value = commentId
}

const cancelReply = () => {
  replyingTo.value = null
}

const editComment = async (commentId: string, newContent: string) => {
  await updateComment(commentId, newContent)
}

const deleteComment = async (commentId: string) => {
  await deleteCommentApi(commentId)
}

const toggleLike = async (commentId: string) => {
  await toggleLikeApi(commentId)
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