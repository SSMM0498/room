<script setup lang="ts">
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MIN_DIMENSIONS = { width: 200, height: 200 }
const MAX_DIMENSIONS = { width: 4096, height: 4096 }
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const emit = defineEmits<{
    (e: 'update:avatar', file: File | null): void
}>()

const props = defineProps<{
    alt: string
}>()

const avatar = ref<File | null>(null)

function createObjectUrl(file: File): string {
    return URL.createObjectURL(file)
}

async function validateImage(file: File): Promise<{ valid: boolean; error?: string }> {
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'errors.imageTooLarge' }
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return { valid: false, error: 'errors.invalidImageType' }
    }

    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const meetsDimensions =
                    img.width >= MIN_DIMENSIONS.width &&
                    img.height >= MIN_DIMENSIONS.height &&
                    img.width <= MAX_DIMENSIONS.width &&
                    img.height <= MAX_DIMENSIONS.height

                resolve({
                    valid: meetsDimensions,
                    error: meetsDimensions ? undefined : 'errors.invalidDimensions'
                })
            }
            img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
    })
}

async function handleFileChange(value: unknown) {
    let file: File | null = null
    if (value instanceof File) {
        file = value
    } else if (Array.isArray(value) && value[0] instanceof File) {
        file = value[0]
    }

    if (!file) {
        avatar.value = null
        emit('update:avatar', null)
        return
    }

    const validation = await validateImage(file)
    if (!validation.valid) {
        // Show error toast or handle error as needed
        console.error(validation.error)
        return
    }

    avatar.value = file
    emit('update:avatar', file)
}
</script>

<template>
    <UFileUpload v-slot="{ open, removeFile }" :model-value="avatar" accept="image/*"
        @update:model-value="handleFileChange">
        <div class="flex flex-wrap items-center gap-3">
            <UAvatar :src="avatar ? createObjectUrl(avatar) : undefined" size="3xl" :alt="alt" />

            <UButton :label="avatar ? $t('change') : $t('upload')" color="neutral" variant="outline" @click="open()" />
        </div>

        <p v-if="avatar" class="text-xs text-muted mt-1.5">
            {{ avatar.name }}

            <UButton :label="$t('remove')" color="error" variant="link" size="xs" class="p-0" @click="removeFile()" />
        </p>
    </UFileUpload>
</template>
