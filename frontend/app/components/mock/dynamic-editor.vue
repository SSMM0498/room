<template>
    <div :style="cssVariables" class="dynamic-mock-editor-wrapper w-full">
        <mock-code-editor v-if="scenario.files.length" class="w-full max-w-2xl transform -rotate-1"
            :files="scenario.files" :startLineNumber="1" :enable-typing-animation="true" :typing-speed="100"
            :dark-mode="false" :show-grid="false" right-panel-title="" :editor-bg-color="scenario.colors.bg"
            :tab-bg-color="scenario.colors.tab" :line-number-bg-color="scenario.colors.bg">
            <!-- The right panel's color is now dynamic -->
            <template #right-panel>
                <div class="w-full h-full" :style="{ backgroundColor: scenario.colors.panel }"></div>
            </template>

            <!-- Floating Webcam Feed with dynamic image -->
            <template #floating-bottom-left>
                <div class="w-40 h-50 transform rotate-2 translate-y-4">
                    <div class="absolute inset-0 rounded-lg shadow-lg border-2 border-gray-950 dark:border-white"></div>
                    <img :src="scenario.instructor.avatarUrl" :alt="scenario.instructor.name"
                        class="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-cover rounded border-2 border-gray-950 dark:border-white grayscale hover:grayscale-0">
                    <div
                        class="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-md -rotate-10 border-2 border-gray-950 dark:border-white">
                        <UIcon name="i-heroicons-microphone" class="h-5 w-5 text-black" />
                        <UIcon name="i-heroicons-video-camera-slash" class="h-5 w-5 text-black" />
                        <UIcon name="i-heroicons-phone-arrow-up-right" class="h-5 w-5 text-red-500" />
                    </div>
                </div>
            </template>

            <!-- Floating Chat Bubbles with dynamic text -->
            <template #floating-bottom-right>
                <div
                    class="absolute bottom-16 -right-16 w-64 dark:bg-gray-950 bg-white text-black dark:text-white p-4 rounded-lg shadow-lg transform -rotate-2 border-2 border-gray-950 dark:border-white">
                    <p class="text-sm">{{ scenario.chatMessages[0] }}</p>
                </div>
                <div
                    class="absolute -bottom-5 right-4 w-48 dark:bg-gray-950 bg-white text-black dark:text-white p-3 rounded-lg shadow-lg transform rotate-3 border-2 border-gray-950 dark:border-white">
                    <p class="text-sm">{{ scenario.chatMessages[1] }}</p>
                </div>
            </template>
        </mock-code-editor>
    </div>
</template>

<script setup lang="ts">
import { faker } from '@faker-js/faker';

const props = defineProps({
    // You can change this prop from the parent to trigger a re-randomization
    trigger: {
        type: Number,
        default: 0,
    },
});

const colorPalettes = [
  { bg: '#F9FAFB', tab: '#E5E7EB', panel: '#D1D5DB', accent: '#9CA3AF' },
  { bg: '#F3F4F6', tab: '#D1D5DB', panel: '#E5E7EB', accent: '#6B7280' },
  { bg: '#E5E7EB', tab: '#9CA3AF', panel: '#F9FAFB', accent: '#4B5563' },
  { bg: '#FFFFFF', tab: '#F3F4F6', panel: '#E5E7EB', accent: '#6B7280' },
]

const instructors = [
    { name: 'Samantha', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop' },
    { name: 'David', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop' },
    { name: 'Karen', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop' },
];

const codeSnippets = {
    javascript: {
        fileName: 'app.js',
        content: `import { createApp } from 'vue';

const app = createApp({
  data() {
    return {
      message: 'Hello from rOOm!'
    }
  }
});

app.mount('#app');`
    },
    python: {
        fileName: 'server.py',
        content: `from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, rOOm!'

if __name__ == '__main__':
    app.run(debug=True)`
    },
    html: {
        fileName: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>rOOm IDE</title>
</head>
<body>
  <h1>Welcome to the live editor!</h1>
  <p>Start coding now.</p>
</body>
</html>`
    },
};

const chatMessages = [
    ["This is so cool!", "I know right!"],
    ["How do you change the port?", "It's in the config file."],
    ["Can you explain that last line again?", "Sure, let me break it down."],
    ["Is this being recorded?", "Yep! You can replay it later."],
];

// --- TYPESCRIPT INTERFACES ---

interface File {
    name: string;
    language: string;
    content: string;
}

interface Scenario {
    files: File[];
    instructor: { name: string; avatarUrl: string };
    chatMessages: string[];
    colors: { bg: string; tab: string; panel: string; accent: string };
}

// --- COMPONENT LOGIC ---

const scenario = ref<Scenario>({
    files: [],
    instructor: { name: '', avatarUrl: '' },
    chatMessages: ['', ''],
    colors: colorPalettes[0] ?? { bg: '#FFFFFF', tab: '#FFFFFF', panel: '#FFFFFF', accent: '#FFFFFF' },
});

const generateRandomScenario = () => {
    const randomPalette = faker.helpers.arrayElement(colorPalettes);
    const randomInstructor = faker.helpers.arrayElement(instructors);
    const languages = Object.keys(codeSnippets) as Array<keyof typeof codeSnippets>;
    const randomLanguage = faker.helpers.arrayElement(languages);
    const randomSnippet = codeSnippets[randomLanguage];
    const randomChat = faker.helpers.arrayElement(chatMessages);

    scenario.value = {
        files: [{
            name: randomSnippet.fileName,
            language: randomLanguage,
            content: randomSnippet.content,
        }],
        instructor: randomInstructor,
        chatMessages: randomChat,
        colors: randomPalette,
    };
};

// Generate the initial scenario when the component mounts
onMounted(() => {
    generateRandomScenario();
});

// Watch the trigger prop to allow parent components to re-randomize
watch(() => props.trigger, () => {
    generateRandomScenario();
});

// A computed property to create CSS variables from the random color palette
const cssVariables = computed(() => ({
    '--editor-bg-color': scenario.value.colors.bg,
    '--editor-tab-color': scenario.value.colors.tab,
}));

</script>

<style scoped>

.dynamic-mock-editor-wrapper :deep(.code-editor-section .translate-y-px) {
    transform: translateY(0);
}
</style>