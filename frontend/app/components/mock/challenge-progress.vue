<template>
    <div
        class="absolute -bottom-4 -left-4 flex max-w-[35%] flex-col rounded bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 px-[2.5%] py-[1.5%] text-[min(2vw,14px)] font-medium text-gray-100 shadow-2xl lg:text-[min(1vw,14px)]">
        <span class="mb-[5%]">
            <span class="text-[min(2.25vw,16px)] font-bold text-white lg:text-[min(1.125vw,16px)]">{{ completedChallenges }}</span>
            /{{ totalChallenges }} challenges completed
        </span>
        <ul class="mb-[3%] grid grid-cols-6 gap-[5%]">
            <li v-for="i in totalChallenges" :key="i" class="w-full">
                <svg v-if="i <= completedChallenges" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16"
                    class="text-green-500 h-auto w-full rounded-full" height="1em" width="1em"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"></path>
                    <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"></path>
                </svg>
                <div v-else class="h-auto w-full rounded-full bg-gray-600"></div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
defineProps({
    completedChallenges: {
        type: Number,
        default: 6
    },
    totalChallenges: {
        type: Number,
        default: 6
    }
});
</script>