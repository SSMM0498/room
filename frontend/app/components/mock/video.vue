<template>
    <div class="shadow-wxl absolute right-0 top-0 flex aspect-[16/9] w-full max-w-[35%] items-center justify-center overflow-hidden rounded-md bg-black bg-contain shadow-2xl shadow-gray-900/40">
        <div class="relative flex h-full w-full">
            <!-- Play icon -->
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" class="aspect-1 absolute left-1/2 top-1/2 z-30 h-[35%] w-[35%] -translate-x-1/2 -translate-y-1/2 text-white" height="1em" width="1em">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z"></path>
            </svg>
            <!-- Thumbnail image -->
            <img :src="thumbnailUrl" :alt="altText" loading="lazy" class="absolute inset-0 z-0" style="color:transparent">
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    thumbnailUrl: {
        type: String,
        default: 'https://wsrv.nl/?url=https%3A%2F%2Fs3.us-east-1.amazonaws.com%2Fcreator-assets.codedamn.com%2Fcodedamn-61897bfe60f1140008feb00d%2FCOURSE_IMAGE%2F2023-02-10%2F95e0d9dc04bf4507aad9fcf0a3d8671829d86971&amp;w=1280&amp;q=82&amp;output=webp'
    },
    altText: {
        type: String,
        default: 'Video player thumbnail'
    }
});
</script>