import { ref } from 'vue';
import type { RecordModel } from 'pocketbase';

export interface Comment {
  id: string;
  author: any;
  content: string;
  created: string;
  updated: string;
  likes: number;
  userLiked: boolean;
  replyTo?: string | RecordModel;
  replies?: Comment[];
  replyCount?: number;
  expand?: {
    author?: any;
    replyTo?: any;
  };
}

export const useComment = () => {
  const comments = ref<Comment[]>([]);
  const pending = ref(false);
  const error = ref<Error | null>(null);

  const _handleRequest = async <T>(request: () => Promise<T>): Promise<T | null> => {
    pending.value = true;
    error.value = null;
    try {
      return await request();
    } catch (err: any) {
      error.value = err;
      return null;
    } finally {
      pending.value = false;
    }
  };

  /**
   * Fetch all comments for a specific course
   */
  const fetchCommentsByCourse = async (courseId: string) => _handleRequest(async () => {
    const fetchedComments = await $fetch<Comment[]>(`/api/comments/by-course/${courseId}`);
    comments.value = fetchedComments;
    return fetchedComments;
  });

  /**
   * Fetch replies for a specific comment
   */
  const fetchReplies = async (commentId: string) => _handleRequest(async () => {
    const replies = await $fetch<Comment[]>(`/api/comments/comment/${commentId}/replies`);

    // Find the comment and attach replies
    const findAndAttachReplies = (commentList: Comment[]): boolean => {
      for (const comment of commentList) {
        if (comment.id === commentId) {
          comment.replies = replies;
          return true;
        }
        if (comment.replies && findAndAttachReplies(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    findAndAttachReplies(comments.value);
    return replies;
  });

  /**
   * Create a new comment
   */
  const createComment = async (data: {
    course: string;
    content: string;
    replyTo?: string;
  }) => _handleRequest(async () => {
    const newComment = await $fetch<Comment>('/api/comments/new', {
      method: 'POST',
      body: data,
    });

    // Add the new comment to the appropriate place
    if (data.replyTo) {
      // Find the parent comment and add this as a reply, increment reply count
      const findAndAddReply = (commentList: Comment[]): boolean => {
        for (const comment of commentList) {
          if (comment.id === data.replyTo) {
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.push(newComment);
            comment.replyCount = (comment.replyCount || 0) + 1;
            return true;
          }
          if (comment.replies && findAndAddReply(comment.replies)) {
            return true;
          }
        }
        return false;
      };
      findAndAddReply(comments.value);
    } else {
      // Add as a top-level comment
      comments.value.unshift(newComment);
    }

    return newComment;
  });

  /**
   * Update an existing comment
   */
  const updateComment = async (id: string, content: string) => _handleRequest(async () => {
    const updatedComment = await $fetch<Comment>(`/api/comments/comment/${id}`, {
      method: 'PATCH',
      body: { content },
    });

    // Update the comment in the local state
    const findAndUpdateComment = (commentList: Comment[]): boolean => {
      for (let i = 0; i < commentList.length; i++) {
        if (commentList[i]!.id === id) {
          commentList[i] = { ...commentList[i], ...updatedComment };
          return true;
        }
        if (commentList[i]!.replies && findAndUpdateComment(commentList[i]!.replies!)) {
          return true;
        }
      }
      return false;
    };

    findAndUpdateComment(comments.value);
    return updatedComment;
  });

  /**
   * Delete a comment
   */
  const deleteComment = async (id: string) => _handleRequest(async () => {
    await $fetch(`/api/comments/comment/${id}`, {
      method: 'DELETE',
    });

    // Remove the comment from local state
    const findAndRemoveComment = (commentList: Comment[]): boolean => {
      for (let i = 0; i < commentList.length; i++) {
        if (commentList[i]!.id === id) {
          commentList.splice(i, 1);
          return true;
        }
        if (commentList[i]!.replies && findAndRemoveComment(commentList[i]!.replies!)) {
          return true;
        }
      }
      return false;
    };

    findAndRemoveComment(comments.value);
    return true;
  });

  /**
   * Toggle like on a comment
   */
  const toggleLike = async (id: string) => _handleRequest(async () => {
    const result = await $fetch<{ liked: boolean }>(`/api/comments/${id}/toggle-like`, {
      method: 'POST',
    });

    // Update the local state
    const findAndToggleLike = (commentList: Comment[]): boolean => {
      for (const comment of commentList) {
        if (comment.id === id) {
          comment.userLiked = result.liked;
          comment.likes += result.liked ? 1 : -1;
          return true;
        }
        if (comment.replies && findAndToggleLike(comment.replies)) {
          return true;
        }
      }
      return false;
    };

    findAndToggleLike(comments.value);
    return result;
  });

  /**
   * Format timestamp to relative time
   */
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return {
    // State
    comments,
    pending,
    error,

    // Methods
    fetchCommentsByCourse,
    fetchReplies,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    formatTimestamp,
  };
};
