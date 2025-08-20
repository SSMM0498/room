<template>
  <div class="h-full w-full flex justify-center">
    <div class="hidden bg-cover lg:block lg:w-1/2 login-background">
      <div class="h-full flex items-center px-20 bg-white/60 dark:bg-gray-900/70">
        <div>
          <h2 class="text-2xl text-black font-bold sm:text-3xl dark:text-white">
            {{ $t("welcome") }}
          </h2>

          <p class="mt-3 text-xl max-w-xl text-black dark:text-white">
            Teach code. Learn code. Break stuff (safely). <br/>
            Record tutorials, code along with videos, and join a community that actually gets it.<br/>
            Sign in and start your interactive coding adventure.
          </p>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-md w-full flex items-center px-6 lg:w-1/2">
      <div class="flex-1">
        <div class="flex w-full items-center justify-center flex-col">
          <div class="text-black dark:text-white text-4xl text-center w-full font-semibold font-['Poppins'] leading-[44px] mb-3">
            {{ $t("sign_in") }}
          </div>
          <div class="text-gray-50 dark:text-white text-base text-center font-normal font-['Poppins'] leading-normal">
            Sign in to access your account
          </div>
        </div>

        <div class="mt-8">
          <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit" ref="form">
            <UFormField label="Email" required name="email">
              <UInput class="w-full" placeholder="you@example.com" required autocomplete="username" type="email"
                input-class="input-base" size="xl" color="neutral" icon="i-heroicons-envelope" v-model="state.email" />
            </UFormField>

            <UFormField label="Password" required name="password">
              <template #help>
                <ULink :to="localePath('/forgot-password')"
                  class="text-sm text-gray-400 focus:text-blue-500 hover:text-blue-500 hover:underline">
                  Forgot password?
                </ULink>
              </template>
              <UInput class="w-full" placeholder="•••••••••" required autocomplete="current-password" type="password"
                input-class="input-base" size="xl" color="neutral" icon="i-heroicons:lock-closed"
                v-model="state.password" />
            </UFormField>

            <UButton type="submit" color="primary" block size="lg">
              {{ $t("sign_in") }}
            </UButton>
          </UForm>

          <USeparator label="OR" class="my-4" />
          <div class="flex flex-col w-full gap-2">
            <UButton size="lg" block variant="outline" color="neutral">
              <i class="i-flat-color-icons:google"></i>
              {{ $t("login.sign_in_with_google") }}
            </UButton>
            <UButton type="submit" size="lg" block variant="outline" color="neutral">
              <i class="i-logos:microsoft-icon"></i>
              {{ $t("login.sign_in_with_microsoft") }}
            </UButton>
          </div>

          <p class="mt-6 text-center text-sm text-gray-400">
            {{ $t("login.dont_have_an_account_yet") }}
            <ULink :to="localePath('/register')" inactive-class="text-primary">
              {{ $t("sign_up") }}
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

const { login } = useAuth();
const localePath = useLocalePath();
const toast = useToast();
const { t } = useI18n();

definePageMeta({
  alias: ["/login"],
  middleware: ["guest"],
  layout: "auth",
  layoutTransition: true,
});

useHead({
  title: t('welcome'),
})

const form = ref()

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
})

type Schema = z.output<typeof schema>

const state = reactive({
  email: undefined,
  password: undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  form.value.clear()
  try {
    await login(event.data);
    navigateTo(localePath('/'));
  } catch (error: any) {
    console.error('Login failed:', error);

    toast.add({
      title: 'Login failed',
      description: error.data?.statusMessage || 'Credentials is wrong!',
      color: 'error',
    });

    form.value.setErrors([
      { path: 'email', message: error.data?.statusMessage || 'An error occurred' },
      { path: 'password', message: '' }, // Clear password field message
    ]);
  }
}

// async function loginWithGithub() {
//   try {
//     await loginWithGithub(event.data);
//     navigateTo("/dashboard");
//   } catch (error) {
//     console.log(error);
//   }
// }
</script>
<style scoped lang="css">
.login-background {
  background-image: url('~/assets/img/login-background.avif')
}
</style>
