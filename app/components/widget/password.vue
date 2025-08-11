<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
    label: { type: String, default: 'Password' },
    placeholder: { type: String, default: 'Password' },
    showStrengthTips: { type: Boolean, default: true },

    size: { type: Object as PropType<"xl" | "xs" | "sm" | "md" | "lg">, default: 'xl' },
    // Requirements
    requirements: {
        type: Array as PropType<Array<{ regex: RegExp; text: string }>>,
        default: () => [
            { regex: /.{8,}/, text: 'At least 8 characters' },
            { regex: /\d/, text: 'At least 1 number' },
            { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
            { regex: /[A-Z]/, text: 'At least 1 uppercase letter' }
        ]
    },

    // Strength text
    strengthLabels: {
        type: Object as PropType<{ empty: string; weak: string; medium: string; strong: string }>,
        default: () => ({
            empty: 'Enter a password',
            weak: 'Weak password',
            medium: 'Medium password',
            strong: 'Strong password'
        })
    },

    // Colors based on score
    colors: {
        type: Object as PropType<{ neutral: ScoreColor; weak: ScoreColor; medium: ScoreColor; strong: ScoreColor }>,
        default: () => ({
            neutral: 'neutral',
            weak: 'error',
            medium: 'warning',
            strong: 'success'
        })
    }
})

type ScoreColor = "neutral" | "error" | "warning" | "success" | "primary" | "secondary" | "info"

const show = ref(false)
const isFocused = ref(false)
const password = defineModel<string>({ default: '' })

const strength = computed(() =>
    props.requirements.map(req => ({
        met: req.regex.test(password.value),
        text: req.text
    }))
)

const score = computed(() => strength.value.filter(req => req.met).length)

const color = computed(() => {
    if (score.value === 0) return props.colors.neutral
    if (score.value <= 2) return props.colors.weak
    if (score.value === 3) return props.colors.medium
    return props.colors.strong
})

const text = computed(() => {
    if (score.value === 0) return props.strengthLabels.empty
    if (score.value <= 2) return props.strengthLabels.weak
    if (score.value === 3) return props.strengthLabels.medium
    return props.strengthLabels.strong
})
</script>

<template>
    <div class="space-y-2">
        <UFormField :label="label">
            <UInput v-model="password" :placeholder="placeholder" :color="color" :size="size" :type="show ? 'text' : 'password'"
                :aria-invalid="score < requirements.length" aria-describedby="password-strength"
                :ui="{ trailing: 'pe-1' }" class="w-full" @focus="isFocused = true" @blur="isFocused = false" icon="i-heroicons:lock-closed">
                <template #trailing>
                    <UButton color="neutral" variant="link" size="sm" :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        :aria-label="show ? 'Hide password' : 'Show password'" :aria-pressed="show"
                        aria-controls="password" @click="show = !show" />
                </template>
            </UInput>
        </UFormField>

        <template v-if="props.showStrengthTips && isFocused && password.length > 0">
            <UProgress :color="color" :indicator="text" :model-value="score" :max="requirements.length" size="sm" />

            <p id="password-strength" class="text-sm font-medium">
                {{ text }}. Must contain:
            </p>

            <ul class="space-y-1" aria-label="Password requirements">
                <li v-for="(req, index) in strength" :key="index" class="flex items-center gap-0.5"
                    :class="req.met ? 'text-success' : 'text-muted'">
                    <UIcon :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-4 shrink-0" />
                    <span class="text-xs font-light">
                        {{ req.text }}
                        <span class="sr-only">
                            {{ req.met ? ' - Requirement met' : ' - Requirement not met' }}
                        </span>
                    </span>
                </li>
            </ul>
        </template>
    </div>
</template>
