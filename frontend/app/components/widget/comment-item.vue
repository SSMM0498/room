<template>
  <div class="comment-item border-default border rounded-lg p-2">
    <div class="flex items-start gap-3">
      <UAvatar
        :src="useFileUrl(comment.expand?.author || comment.author, 'avatar', '100x100')"
        :alt="authorName"
        class="size-10 rounded-full"
      />
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ authorName }}</span>
          <span class="text-sm text-dimmed">{{ formattedTimestamp }}</span>
          <UBadge v-if="isEdited" size="xs" color="neutral" variant="subtle">
            Edited
          </UBadge>
        </div>

        <!-- Edit mode -->
        <div v-if="isEditing" class="mt-2">
          <UTextarea
            v-model="editedContent"
            class="w-full"
            :rows="3"
          />
          <div class="flex gap-2 mt-2">
            <UButton @click="saveEdit" size="xs">
              Save
            </UButton>
            <UButton @click="cancelEdit" variant="ghost" color="neutral" size="xs">
              Cancel
            </UButton>
          </div>
        </div>

        <!-- Display mode -->
        <p v-else class="mt-1 text-sm">{{ comment.content }}</p>

        <div class="flex items-center gap-4 mt-2">
          <UButton
            class="flex items-center gap-1 p-1 cursor-pointer"
            :class="{ 'text-blue-500': comment.userLiked }"
            variant="ghost"
            @click="handleToggleLike"
          >
            <span>👍</span>
            <span>{{ comment.likes || 0 }}</span>
          </UButton>

          <UButton
            class="hover:text-primary p-1 cursor-pointer"
            variant="link"
            color="neutral"
            @click="$emit('reply', comment.id)"
          >
            Reply
          </UButton>

          <!-- Show/Hide replies button -->
          <UButton
            v-if="comment.replyCount && comment.replyCount > 0"
            class="hover:text-primary p-1 cursor-pointer"
            variant="link"
            color="neutral"
            @click="toggleReplies"
            :loading="loadingReplies"
          >
            <template v-if="showReplies">
              Hide replies ({{ comment.replyCount }})
            </template>
            <template v-else>
              Show replies ({{ comment.replyCount }})
            </template>
          </UButton>

          <!-- Show edit/delete only for own comments -->
          <template v-if="isOwnComment">
            <UButton
              class="hover:text-primary p-1 cursor-pointer"
              variant="link"
              color="neutral"
              @click="startEdit"
            >
              Edit
            </UButton>
            <UButton
              class="hover:text-red-500 p-1 cursor-pointer"
              variant="link"
              color="error"
              @click="handleDelete"
            >
              Delete
            </UButton>
          </template>
        </div>
      </div>

      <!-- Options menu -->
      <UDropdown v-if="isOwnComment" :items="menuItems">
        <UButton size="xs" class="px-2 py-1 cursor-pointer" color="neutral" variant="ghost">
          ⋮
        </UButton>
      </UDropdown>
    </div>

    <!-- Nested replies -->
    <div v-if="showReplies && comment.replies && comment.replies.length > 0" class="ml-12 mt-3 space-y-3">
      <widget-comment-item
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        @reply="(commentId) => emit('reply', commentId)"
        @edit="(commentId, newContent) => emit('edit', commentId, newContent)"
        @delete="(commentId) => emit('delete', commentId)"
        @toggle-like="(commentId) => emit('toggle-like', commentId)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Comment } from '~/composables/useComment'

const props = defineProps<{
  comment: Comment
}>()

const emit = defineEmits<{
  'reply': [commentId: string]
  'edit': [commentId: string, newContent: string]
  'delete': [commentId: string]
  'toggle-like': [commentId: string]
}>()

const { formatTimestamp, fetchReplies } = useComment()
const authUser = useAuthUser()

const isEditing = ref(false)
const editedContent = ref('')
const showReplies = ref(false)
const loadingReplies = ref(false)

const authorName = computed(() => {
  const author = props.comment.expand?.author || props.comment.author
  return author?.name || author?.username || 'Anonymous'
})

const formattedTimestamp = computed(() => {
  return formatTimestamp(props.comment.created)
})

const isEdited = computed(() => {
  if (!props.comment.created || !props.comment.updated) return false
  // Check if updated time is different from created time (allowing for small differences)
  const created = new Date(props.comment.created).getTime()
  const updated = new Date(props.comment.updated).getTime()
  return updated - created > 1000 // More than 1 second difference
})

const isOwnComment = computed(() => {
  const author = props.comment.expand?.author || props.comment.author
  const authorId = typeof author === 'string' ? author : author?.id
  return authUser.value?.id === authorId
})

const menuItems = computed(() => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: startEdit
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: handleDelete
  }]
])

const startEdit = () => {
  editedContent.value = props.comment.content
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = ''
}

const saveEdit = () => {
  if (editedContent.value.trim()) {
    emit('edit', props.comment.id, editedContent.value)
    isEditing.value = false
  }
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this comment?')) {
    emit('delete', props.comment.id)
  }
}

const handleToggleLike = () => {
  emit('toggle-like', props.comment.id)
}

const toggleReplies = async () => {
  if (!showReplies.value && (!props.comment.replies || props.comment.replies.length === 0)) {
    // Load replies if not already loaded
    loadingReplies.value = true
    try {
      const replies = await fetchReplies(props.comment.id)
      if (replies) props.comment.replies = replies
    } catch (error) {
      console.error('Failed to load replies:', error)
    } finally {
      loadingReplies.value = false
    }
  }
  showReplies.value = !showReplies.value
}
</script>