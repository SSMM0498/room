<template>
    <div class="space-y-2">
        <p class="text-sm font-medium">{{ label }}</p>
        <div class="relative flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
            :class="previewClass">
            <img v-if="previewUrl" :src="previewUrl" :alt="label" class="h-full w-full object-cover">
            <UIcon v-else :name="placeholderIcon" class="h-8 w-8 text-gray-400" />
        </div>
        <div class="flex items-center gap-2">
            <UButton size="xs" color="neutral" variant="outline" icon="i-heroicons-arrow-up-tray" @click="openPicker">
                {{ previewUrl ? 'Replace' : 'Upload' }}
            </UButton>
            <UButton v-if="previewUrl" size="xs" color="error" variant="ghost" icon="i-heroicons-trash" @click="clear">
                Remove
            </UButton>
            <UButton v-if="removed && currentUrl" size="xs" color="neutral" variant="link" @click="undoRemove">
                Undo
            </UButton>
        </div>
        <p v-if="hint" class="text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
        <input ref="inputRef" type="file" :accept="accept" class="hidden" @change="handleChange">
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    label: string;
    /** URL of the image currently stored on the record, if any. */
    currentUrl?: string;
    hint?: string;
    accept?: string;
    maxSizeMb?: number;
    previewClass?: string;
    placeholderIcon?: string;
}>(), {
    currentUrl: '',
    hint: '',
    accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
    maxSizeMb: 5,
    previewClass: 'h-32 w-full',
    placeholderIcon: 'i-heroicons-photo',
});

/** The newly picked file, or null when the stored image is kept. */
const file = defineModel<File | null>({ default: null });
/** Whether the stored image should be dropped on save. */
const removed = defineModel<boolean>('removed', { default: false });

const toast = useToast();
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const objectUrl = ref('');

const previewUrl = computed(() => objectUrl.value || (removed.value ? '' : props.currentUrl));

const releaseObjectUrl = () => {
    if (objectUrl.value) {
        URL.revokeObjectURL(objectUrl.value);
        objectUrl.value = '';
    }
};

const openPicker = () => inputRef.value?.click();

const handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];
    // Allow picking the same file again after a removal.
    input.value = '';
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
        toast.add({ title: 'Please choose an image file.', color: 'error' });
        return;
    }
    if (selected.size > props.maxSizeMb * 1024 * 1024) {
        toast.add({ title: `The image must be smaller than ${props.maxSizeMb}MB.`, color: 'error' });
        return;
    }

    releaseObjectUrl();
    objectUrl.value = URL.createObjectURL(selected);
    file.value = selected;
    removed.value = false;
};

const clear = () => {
    if (file.value) {
        releaseObjectUrl();
        file.value = null;
        return;
    }
    removed.value = true;
};

const undoRemove = () => {
    removed.value = false;
};

// The parent resets the file after a successful save; drop the stale preview with it.
watch(file, (value) => {
    if (!value) releaseObjectUrl();
});

onBeforeUnmount(releaseObjectUrl);
</script>
