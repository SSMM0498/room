<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { UserModel } from '~~/types/api'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MIN_DIMENSIONS = { width: 200, height: 200 }
const MAX_DIMENSIONS = { width: 4096, height: 4096 }
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const emit = defineEmits<{
    'update-avatar': [file: File]
}>()

const props = defineProps<{
    user: UserModel | null
    onAvatarUpdate?: (file: File) => Promise<void>
    disabled?: boolean
}>()

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const schema = z.object({
    avatar: z
        .instanceof(File, {
            message: 'errors.selectOne'
        })
        .refine((file) => file.size <= MAX_FILE_SIZE, {
            message: 'errors.imageTooLarge'
        })
        .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: 'errors.invalidImageType'
        })
        .refine(
            (file) =>
                new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        const img = new Image()
                        img.onload = () => {
                            const meetsDimensions =
                                img.width >= MIN_DIMENSIONS.width &&
                                img.height >= MIN_DIMENSIONS.height &&
                                img.width <= MAX_DIMENSIONS.width &&
                                img.height <= MAX_DIMENSIONS.height
                            resolve(meetsDimensions)
                        }
                        img.onerror = () => resolve(false)
                        img.src = e.target?.result as string
                    }
                    reader.onerror = () => resolve(false)
                    reader.readAsDataURL(file)
                }),
            {
                message: 'errors.invalidDimensions'
            }
        )
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    avatar: undefined
})

const isUploading = ref(false)
const previewUrl = ref<string | null>(null)

const currentAvatarUrl = computed(() => {
    if (!props.user?.avatar) return null
    return useFileUrl(props.user, 'avatar')
})

watch(() => state.avatar, (file) => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }

    if (file) {
        previewUrl.value = URL.createObjectURL(file)
    } else {
        previewUrl.value = null
    }
})

onUnmounted(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    event.stopPropagation();
    if (!event.data.avatar) return

    isUploading.value = true
    try {
        // Use callback prop if provided, otherwise emit event
        if (props.onAvatarUpdate) {
            await props.onAvatarUpdate(event.data.avatar)
        } else {
            emit('update-avatar', event.data.avatar)
        }
        // Reset form state after successful upload
        state.avatar = undefined
    } catch (error: any) {
        // Error should be handled by parent component
        throw error
    } finally {
        isUploading.value = false
    }
}

function handleRemoveFile() {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
    }
    state.avatar = undefined
}

const displayUrl = computed<string>(() => {
    return previewUrl.value || currentAvatarUrl.value || ''
})
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit.stop="onSubmit">
        <UFormField name="avatar">
            <UFileUpload v-slot="{ open }" v-model="state.avatar" accept="image/*" :disabled="disabled || isUploading"
                :max-files="1">
                <div
                    class="w-100 flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex-shrink-0">
                        <UAvatar :src="displayUrl" :alt="user?.username"
                            class="w-30 h-30 rounded-md border-2 border-gray-200 dark:border-gray-700" />
                    </div>

                    <div class="flex-1 space-y-3 min-w-0">
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <UButton :label="state.avatar ? $t('avatar.change') : $t('avatar.upload')" color="neutral"
                                variant="outline" :loading="isUploading" :disabled="disabled || isUploading"
                                @click="open()" icon="i-lucide-upload" />
                        </div>

                        <div v-if="state.avatar" class="space-y-4">
                            <div class="flex flex-col items-start justify-start gap-2 text-sm">
                                <span class="font-medium w-50 truncate">{{ state.avatar.name }}</span>
                                <UBadge variant="subtle" size="sm">
                                    {{ formatBytes(state.avatar.size) }}
                                </UBadge>
                            </div>

                            <div class="flex items-center gap-2">
                                <UButton type="submit" :label="$t('avatar.save')" size="sm"
                                    :loading="isUploading" :disabled="disabled" />
                                <UButton :label="$t('avatar.remove')" color="error" variant="ghost" size="sm"
                                    :disabled="isUploading" @click="handleRemoveFile" />
                            </div>
                        </div>
                    </div>
                </div>
            </UFileUpload>
        </UFormField>
    </UForm>
</template>
