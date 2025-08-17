<template>
  <div class="h-full w-full flex justify-center">
    <div class="mx-auto max-w-md w-full flex items-center px-6">
      <div class="flex-1">
        <div class="text-center">
          <h4 class="mt-3">Reset Password</h4>
          <p class="mt-2 text-sm text-gray-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div class="mt-8">
          <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit" ref="form">
            <UFormField label="Email" required name="email">
              <UInput class="w-full"  placeholder="you@example.com" required type="email" input-class="input-base" size="xl"
                color="neutral" icon="i-heroicons-envelope" v-model="state.email" />
            </UFormField>

            <UButton type="submit" color="primary" block size="lg">
              Send Reset Link
            </UButton>
          </UForm>

          <p class="mt-6 text-center text-sm text-gray-400">
            Remember your password?
            <ULink :to="localePath('/login')" inactive-class="text-primary">
              Sign in
            </ULink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  alias: ["/forgot-password"],
  middleware: ["guest"],
  layout: "auth",
  layoutTransition: true,
});

const localePath = useLocalePath();
const toast = useToast();
const form = ref();

const schema = z.object({
  email: z.string().email('Invalid email'),
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: undefined,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  form.value.clear()
  try {
    const response = await $fetch('/api/auth/request-password-reset', {
      method: 'POST',
      body: { email: event.data.email },
    });

    toast.add({
      title: 'Success',
      description: response.message,
      color: 'success',
    });
  } catch (error: any) {
    console.error(error);
    form.value.setErrors([
      { path: 'email', message: error.data?.statusMessage || 'Failed to send reset link. Please try again.' },
    ]);
  }
}
</script>
