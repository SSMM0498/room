<template>
    <div class="flex w-full max-w-[42%] flex-col items-center justify-between rounded px-[2.5%] py-[1.5%] text-[min(2vw,13px)] shadow-2xl lg:text-[min(1vw,13px)]"
        :class="isIncoming ? 'right-0 top-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 text-white absolute' : 'left-0 bottom-0 bg-gradient-to-br from-gray-100/95 via-white/90 to-gray-100/95 absolute border border-gray-400/20'">
        
        <span class="flex w-full"><span>{{ message }}</span></span>
        
        <div class="mt-[4%] flex w-full items-center justify-between">
            <div class="flex items-center gap-[10%]">
                <img :src="profilePic" :alt="`Profile photo of ${user}`" loading="lazy" class="aspect-1 h-auto w-[20%] rounded-full ring-offset-black md:w-[25%]">
                <span>{{ user }}</span>
            </div>
            <span class="font-mono text-[min(1.85vw,11px)] lg:text-[min(0.85vw,11px)]">{{ time }}</span>
        </div>
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
    message: String,
    user: String,
    time: String,
    profilePic: String,
    isIncoming: {
        type: Boolean,
        default: false
    }
});
</script>