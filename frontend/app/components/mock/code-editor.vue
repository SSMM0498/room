<template>
    <div class="code-editor-section">
        <div class="flex w-full select-none lg:px-14">
            <div class="relative mx-auto aspect-[16/9] w-full max-w-3xl rounded-md">
                <!-- Main Editor Container -->
                <div
                    class="flex h-full w-full overflow-hidden shadow-2xl rounded-md dark:bg-gray-900 bg-white border-2 border-gray-950 dark:border-white">
                    <!-- Left Panel - Code Editor -->
                    <div class="flex flex-[60%] flex-col">
                        <!-- Tab Bar -->
                        <div
                            class="flex border-b-2 border-gray-950 dark:border-white text-[min(1.6vw,10px)] lg:text-[min(0.8vw,11px)]">
                            <!-- Window Controls -->
                            <div class="flex w-[20%] items-center justify-center gap-[15%] px-[4%] py-[2%]">
                                <div class="aspect-square w-2.5 rounded-full bg-red-500"></div>
                                <div class="aspect-square w-2.5 rounded-full bg-yellow-300"></div>
                                <div class="aspect-square w-2.5 rounded-full bg-green-500"></div>
                            </div>
                            <!-- File Tabs -->
                            <div v-for="(file, index) in files" :key="index"
                                class="w-fit translate-y-px border-none px-[4%] py-[1%] cursor-pointer rounded-t-lg text-black mt-1"
                                :class="{
                                    'bg-gray-950 dark:bg-white text-inverted': currentFileIndex === index,
                                    '#e5e7eb': currentFileIndex === index
                                }" :style="{
                                    fontWeight: currentFileIndex === index ? '600' : 'normal'
                                }" @click="switchFile(index)">
                                {{ file.name }}
                            </div>
                        </div>
                        <!-- Code Content -->
                        <div
                            class="flex gap-[2.5%] font-mono text-[min(2vw,14px)] tracking-tight lg:text-[min(1vw,14px)]">
                            <!-- Line Numbers -->
                            <div class="flex flex-col">
                                <span v-for="(_, index) in displayedLines" :key="index"
                                    class="h-full px-1.5 dark:bg-gray-950/30 dark:text-gray-100 bg-gray-50 text-gray-400 text-gray-400">
                                    {{ String(index + startLineNumber).padStart(2, '0') }}
                                </span>
                            </div>
                            <!-- Code Display -->
                            <code class="flex flex-col p-3 dark:text-gray-100 text-gray-600"
                                style="text-align:left;white-space:pre;word-spacing:normal;word-break:normal;tab-size:4;hyphens:none;overflow-wrap:normal">
                                <span v-for="(line, index) in displayedLines" :key="index"
                                    v-html="highlightSyntax(line, index)">
                                </span>
                            </code>
                        </div>
                    </div>
                    <!-- Right Panel -->
                    <div
                        class="flex flex-[40%] flex-col text-[min(2vw,14px)] lg:text-[min(1vw,14px)] dark:bg-gray-950/30 bg-gray-50 border-l-2 border-gray-950 dark:border-white">
                    </div>
                </div>
                <div v-if="$slots['floating-top-left']" class="absolute -left-5 -top-10 z-10">
                    <slot name="floating-top-left"></slot>
                </div>
                <div v-if="$slots['floating-top-right']" class="absolute -right-10 -top-5 z-10">
                    <slot name="floating-top-right"></slot>
                </div>
                <div v-if="$slots['floating-bottom-left']" class="absolute -bottom-25 -left-25 z-10">
                    <slot name="floating-bottom-left"></slot>
                </div>
                <div v-if="$slots['floating-bottom-right']" class="absolute -bottom-10 -right-5 z-10">
                    <slot name="floating-bottom-right"></slot>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Props
const props = defineProps({
    files: {
        type: Array,
        default: () => [
            {
                name: 'index.jsx',
                content: `export function ({ data }) => {
  return <Layout>
    <Game details={data} />
  </Layout>
}`,
                language: 'javascript'
            }
        ]
    },
    editorBgColor: {
        type: String,
        default: "#ffffff"
    },
    tabBgColor: {
        type: String,
        default: "#f3f4f6"
    },
    lineNumberBgColor: {
        type: String,
        default: "#f9fafb"
    },
    startLineNumber: {
        type: Number,
        default: 5
    },
    maxDisplayLines: {
        type: Number,
        default: 13
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    typingSpeed: {
        type: Number,
        default: 50
    },
    enableTypingAnimation: {
        type: Boolean,
        default: true
    },
    rightPanelTitle: {
        type: String,
        default: 'Preview'
    },
    showGrid: {
        type: Boolean,
        default: false
    },
    gridColors: {
        type: Array,
        default: () => [
            'bg-red-500', '', '', 'bg-yellow-500', 'bg-yellow-500', '', '', '',
            'bg-green-500', '', 'bg-cyan-500', 'bg-cyan-500', 'bg-red-500', 'bg-red-500',
            'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', '', 'bg-green-500',
            'bg-green-500', 'bg-green-500', '', 'bg-cyan-500', 'bg-cyan-500'
        ]
    }
})
// Reactive data
const currentFileIndex = ref(0)
const typedContent = ref('')
const typingIndex = ref(0)
const isTyping = ref(false)
// Computed properties
const currentFile = computed(() => props.files[currentFileIndex.value])
const displayedLines = computed(() => {
    if (!currentFile.value) return []
    const content = props.enableTypingAnimation ? typedContent.value : currentFile.value.content
    const lines = content.split('\n')
    // Add placeholder lines if we don't have enough content
    const totalLines = Math.max(lines.length, props.maxDisplayLines)
    const result = []
    for (let i = 0; i < props.maxDisplayLines; i++) {
        if (i < lines.length) {
            result.push(lines[i])
        } else {
            result.push('')
        }
    }
    return result
})
// Methods
const switchFile = (index) => {
    if (index !== currentFileIndex.value) {
        currentFileIndex.value = index
        if (props.enableTypingAnimation) {
            startTypingAnimation()
        }
    }
}
const startTypingAnimation = () => {
    typedContent.value = ''
    typingIndex.value = 0
    isTyping.value = true
    typeNextCharacter()
}
const typeNextCharacter = () => {
    if (!isTyping.value || !currentFile.value) return
    const fullContent = currentFile.value.content
    if (typingIndex.value < fullContent.length) {
        typedContent.value += fullContent[typingIndex.value]
        typingIndex.value++
        setTimeout(typeNextCharacter, props.typingSpeed)
    } else {
        isTyping.value = false
    }
}
const highlightSyntax = (line, lineIndex) => {
    if (!line.trim()) return line
    const language = currentFile.value?.language || 'javascript'
    // Basic syntax highlighting
    let highlighted = line
    if (language === 'javascript' || language === 'jsx') {
        // Keywords
        highlighted = highlighted.replace(/\b(export|function|return|const|let|var|if|else|for|while|class|import|from)\b/g,
            '<span class="font-semibold">$1</span>')
        // JSX tags
        highlighted = highlighted.replace(/(<\/?)([\w]+)(>|\/?>)/g,
            '$1<span class="font-semibold ' + (props.darkMode ? 'dark:text-purple-200' : 'text-purple-700') + '">$2</span>$3')
        // Comments
        highlighted = highlighted.replace(/(\/\/.*$|\/\*.*?\*\/)/g,
            '<span class="text-gray-500">$1</span>')
    }
    if (language === 'python') {
        // Python keywords
        highlighted = highlighted.replace(/\b(def|return|if|else|for|while|class|import|from|print)\b/g,
            '<span class="font-semibold">$1</span>')
        // Function names
        highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
            '<span class="font-semibold text-purple-700">$1</span>')
        // Comments
        highlighted = highlighted.replace(/(#.*$)/g,
            '<span class="text-gray-400">$1</span>')
        // Numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g,
            '<span class="font-semibold text-purple-700">$1</span>')
    }
    return highlighted
}
// Lifecycle
onMounted(() => {
    if (props.enableTypingAnimation) {
        startTypingAnimation()
    } else {
        typedContent.value = currentFile.value?.content || ''
    }
})
// Watch for file changes
watch(currentFileIndex, () => {
    if (props.enableTypingAnimation) {
        startTypingAnimation()
    } else {
        typedContent.value = currentFile.value?.content || ''
    }
})
</script>
<style scoped lang="css">
@reference "tailwindcss";

.code-editor-section {
    @apply order-3 w-full lg:order-1;
}

.animate-fade-in {
    animation: fadeIn 0.8s ease-in-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* Typing cursor effect */
.typing-cursor::after {
    content: '|';
    animation: blink 1s infinite;
    color: #4ade80;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}
</style>