<template>
    <div class="w-full h-full">
        <UTabs :items="tabs" size="xl"
            :ui="{ root: 'h-full', list: 'mr-0 p-4 h-full w-75 border-s-0 border-r', content: 'h-full p-6', indicator: 'left-auto right-0' }"
            orientation="vertical" class="w-full h-full" variant="link">
            <template #content="{ item }">
                <UCard v-if="item.key === 'profile'"
                    :ui="{ root: 'w-full h-full relative', body: 'relative overflow-auto h-full w-full !pb-34', footer: 'absolute bottom-0 flex items-start justify-end z-10 w-full border-t border-default bg-default space-x-8 py-3' }"
                    variant="outline">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.profile.title') }}</h2>
                    </template>
                    <template #default>
                        <div class="space-x-6 flex items-start justify-start h-full w-full">
                            <div class="flex items-center gap-6">
                                <widget-avatar-picker :user="user" :on-avatar-update="handleAvatarUpdate"
                                    :alt="user!.username" />
                            </div>
                            <UForm id="infos-form" :schema="profileSchema" :state="profileState"
                                @submit="handleUpdateProfile"
                                class="flex flex-col items-start justify-start w-full h-full space-y-6">
                                <div class="flex flex-col items-start justity-start w-full space-y-6">
                                    <UFormField :label="$t('settings.profile.name_label')" name="name" class="w-full">
                                        <UInput :placeholder="$t('settings.profile.name_placeholder')"
                                            v-model="profileState.name" class="w-full" size="xl" />
                                    </UFormField>

                                    <UFormField :label="$t('settings.profile.username_label')" class="w-full">
                                        <UInput :model-value="user?.username" disabled class="w-full" size="xl" />
                                    </UFormField>
                                </div>
                                <UFormField :label="$t('settings.profile.bio')" class="flex flex-col w-full h-full"
                                    :ui="{ container: ' h-full' }">
                                    <UTextarea disabled class="w-full h-full" size="xl" :ui="{ base: 'h-full' }" />
                                </UFormField>
                            </UForm>
                        </div>
                    </template>
                    <template #footer>
                        <UButton type="submit" form="infos-form" :loading="pendingProfile">{{
                            $t('settings.profile.button_save') }}
                        </UButton>
                    </template>
                </UCard>

                <UCard v-if="item.key === 'email'"
                    :ui="{ root: 'w-full h-full relative', body: 'relative overflow-auto h-full w-full !pb-34', footer: 'absolute bottom-0 flex items-start justify-end z-10 w-full border-t border-default bg-default space-x-8 py-3' }"
                    variant="outline">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.email.title') }}</h2>
                    </template>
                    <UAlert icon="i-heroicons-information-circle"
                        :title="$t('settings.email.alert_title', { email: user?.email })" class="mb-6"
                        variant="subtle" />
                    <UForm id="email-form" :schema="emailSchema" :state="emailState" @submit="handleChangeEmail"
                        class="space-y-4">
                        <UFormField :label="$t('settings.email.label')" name="newEmail" required>
                            <UInput type="email" :placeholder="$t('settings.profile.name_placeholder')"
                                v-model="emailState.newEmail" class="w-full" size="xl" />
                        </UFormField>
                        <UButton type="submit" form="email-form" :loading="pendingEmail">{{ $t('settings.email.button')
                        }}</UButton>
                    </UForm>
                    <!-- <template #footer>
                        <UButton type="submit" form="email-form" :loading="pendingEmail">{{ $t('settings.email.button') }}</UButton>
                    </template> -->
                </UCard>

                <UCard v-if="item.key === 'password'"
                    :ui="{ root: 'w-full h-full relative', body: 'relative overflow-auto h-full w-full !pb-34', footer: 'absolute bottom-0 flex items-start justify-end z-10 w-full border-t border-default bg-default space-x-8 py-3' }"
                    variant="outline">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.password.title') }}</h2>
                    </template>
                    <UForm id="password-form" :schema="passwordSchema" :state="passwordState" ref="passwordForm"
                        @submit="handleChangePassword" class="space-y-4">
                        <UFormField :label="$t('settings.password.old_password_label')" name="oldPassword" required>
                            <UInput type="password" v-model="passwordState.oldPassword" class="w-full" size="xl" />
                        </UFormField>
                        <UFormField :label="$t('settings.password.new_password_label')" name="newPassword" required>
                            <UInput type="password" v-model="passwordState.newPassword" class="w-full" size="xl" />
                        </UFormField>
                        <UFormField :label="$t('settings.password.confirm_password_label')" name="newPasswordConfirm"
                            required>
                            <UInput type="password" v-model="passwordState.newPasswordConfirm" class="w-full"
                                size="xl" />
                        </UFormField>
                    </UForm>
                    <template #footer>
                        <UButton type="submit" form="password-form" :loading="pendingPassword">{{
                            $t('settings.password.button') }}</UButton>
                    </template>
                </UCard>

                <UCard v-if="item.key === 'delete'"
                    :ui="{ root: 'w-full h-full relative', body: 'space-y-4 relative overflow-auto h-full w-full !pb-34', footer: 'absolute bottom-0 flex items-start justify-end z-10 w-full border-t border-default bg-default space-x-8 py-3' }"
                    variant="outline">
                    <template #header>
                        <h2 class="text-xl font-semibold text-red-500 dark:text-red-400">
                            {{ $t('settings.delete.title') }}
                        </h2>
                    </template>
                    <p class="text-gray-600 dark:text-gray-300">
                        {{ $t('settings.delete.description') }}
                    </p>
                    <UButton color="error" @click="isDeleteModalOpen = true">{{ $t('settings.delete.button') }}
                    </UButton>
                </UCard>
            </template>
        </UTabs>

        <UModal v-model:open="isDeleteModalOpen" :ui="{ overlay: 'bg-gray-950/95' }">
            <template #title>
                <h3 class="text-xl font-bold text-red-500 dark:text-red-400">
                    {{ $t('settings.delete.modal.title') }}
                </h3>
            </template>
            <template #body>
                <div class="space-y-4">
                    <p>
                        {{ $t('settings.delete.modal.description', {
                            username: `${user?.username}`
                        })
                        }}
                    </p>
                    <UInput v-model="confirmationText"
                        :placeholder="`${user?.username} says goodbye to the room app`" />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-4">
                    <UButton color="neutral" @click="isDeleteModalOpen = false">{{
                        $t('settings.delete.modal.button_cancel') }}</UButton>
                    <UButton color="error" :disabled="confirmationText !== user?.username" :loading="pendingDelete"
                        @click="handleDeleteAccount">
                        {{ $t('settings.delete.modal.button_confirm') }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent, Form } from '#ui/types';
import type { TabsItem } from '@nuxt/ui';

definePageMeta({
    middleware: 'auth',
    alias: ['/settings'],
    name: 'settings'
})

const { t } = useI18n();
const user = useAuthUser();
const { updateProfile, changePassword, requestEmailChange, deleteAccount } = useAuth();
const toast = useToast();

useHead({
    title: t('settings.title'),
})

const tabs: TabsItem[] = [
    { key: 'profile', label: t('settings.nav.profile'), icon: 'i-lucide-user', description: t('settings.profile.title') },
    { key: 'email', label: t('settings.nav.email'), icon: 'i-lucide-mail', description: t('settings.email.title') },
    { key: 'password', label: t('settings.nav.password'), icon: 'i-lucide-lock', description: t('settings.password.title') },
    { key: 'delete', label: t('settings.nav.delete_account'), icon: 'i-lucide-trash-2', description: t('settings.delete_account.title') },
];

const pendingProfile = ref(false);
const profileSchema = z.object({ name: z.string().min(2, t('settings.profile.validation')) });
const profileState = reactive({ name: user.value?.name || '' });

async function handleUpdateProfile(event: FormSubmitEvent<any>) {
    pendingProfile.value = true;
    try {
        const formData = new FormData()
        formData.append('name', event.data.name)
        await updateProfile(formData)
        toast.add({ title: t('settings.profile.toast_success'), color: 'success' });
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.profile.toast_error'), color: 'error' });
    } finally {
        pendingProfile.value = false;
    }
}

async function handleAvatarUpdate(file: File) {
    try {
        const formData = new FormData()
        formData.append('avatar', file)
        await updateProfile(formData)
        toast.add({ title: t('settings.profile.toast_success'), color: 'success' });
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.profile.toast_error'), color: 'error' });
    }
}

const pendingEmail = ref(false);
const emailSchema = z.object({ newEmail: z.string().email(t('settings.email.validation')) });
const emailState = reactive({ newEmail: '' });
async function handleChangeEmail(event: FormSubmitEvent<any>) {
    pendingEmail.value = true;
    try {
        await requestEmailChange(event.data.newEmail);
        toast.add({ title: t('settings.email.toast_success_title'), description: t('settings.email.toast_success_desc'), color: 'success' });
        emailState.newEmail = '';
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.email.toast_error'), color: 'error' });
    } finally {
        pendingEmail.value = false;
    }
}

const pendingPassword = ref(false);
const passwordForm = ref<Form<any> | null>(null);
const passwordSchema = z.object({
    oldPassword: z.string().min(1, t('settings.password.validation.required')),
    newPassword: z.string().min(8, t('settings.password.validation.min_length')),
    newPasswordConfirm: z.string(),
}).refine(data => data.newPassword === data.newPasswordConfirm, {
    message: t('settings.password.validation.mismatch'),
    path: ['newPasswordConfirm'],
});
const passwordState = reactive({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
async function handleChangePassword(event: FormSubmitEvent<any>) {
    pendingPassword.value = true;
    try {
        await changePassword(event.data);
        toast.add({ title: t('settings.password.toast_success'), color: 'success' });
        // Reset form state
        passwordState.oldPassword = '';
        passwordState.newPassword = '';
        passwordState.newPasswordConfirm = '';
        passwordForm.value?.clear(); // Clear validation errors
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.password.toast_error'), color: 'error' });
    } finally {
        pendingPassword.value = false;
    }
}

const isDeleteModalOpen = ref(false);
const pendingDelete = ref(false);
const confirmationText = ref('');

async function handleDeleteAccount() {
    if (confirmationText.value !== user.value?.username) return;
    pendingDelete.value = true;
    try {
        await deleteAccount();
        toast.add({ title: t('settings.delete.toast_success_title'), description: t('settings.delete.toast_success_desc'), color: 'success' });
        isDeleteModalOpen.value = false;
        // The composable will handle the redirect.
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.delete.toast_error'), color: 'error' });
    } finally {
        pendingDelete.value = false;
    }
}
</script>
