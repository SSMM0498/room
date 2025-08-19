<template>
    <div class="w-full">
        <UTabs :items="tabs" class="w-full flex item-center justify-center" variant="link">
            <template #content="{ item }">
                <!-- Profile Tab -->
                <UCard v-if="item.key === 'profile'">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.profile.title') }}</h2>
                    </template>

                    <UForm :schema="profileSchema" :state="profileState" @submit="handleUpdateProfile"
                        class="space-y-6">
                        <div class="flex items-center gap-6">
                            <widget-avatar-picker :avatar="profileState.avatar"
                                @update:avatar="profileState.avatar = $event" :alt="user!.username" />
                        </div>
                        <UFormField :label="$t('settings.profile.name_label')" name="name">
                            <UInput :placeholder="$t('settings.profile.name_placeholder')"
                                v-model="profileState.name" />
                        </UFormField>

                        <UFormField :label="$t('settings.profile.username_label')">
                            <UInput :model-value="user?.username" disabled />
                        </UFormField>

                        <UButton type="submit" :loading="pendingProfile">{{ $t('settings.profile.button_save') }}
                        </UButton>
                    </UForm>
                </UCard>

                <!-- Email Tab -->
                <UCard v-if="item.key === 'email'">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.email.title') }}</h2>
                    </template>
                    <UAlert icon="i-heroicons-information-circle"
                        :title="$t('settings.email.alert_title', { email: user?.email })" class="mb-6" />
                    <UForm :schema="emailSchema" :state="emailState" @submit="handleChangeEmail" class="space-y-4">
                        <UFormField :label="$t('settings.email.label')" name="newEmail" required>
                            <UInput type="email" :placeholder="$t('settings.profile.name_placeholder')"
                                v-model="emailState.newEmail" />
                        </UFormField>
                        <UButton type="submit" :loading="pendingEmail">{{ $t('settings.email.button') }}</UButton>
                    </UForm>
                </UCard>

                <!-- Password Tab -->
                <UCard v-if="item.key === 'password'">
                    <template #header>
                        <h2 class="text-xl font-semibold">{{ $t('settings.password.title') }}</h2>
                    </template>
                    <UForm :schema="passwordSchema" :state="passwordState" ref="passwordForm"
                        @submit="handleChangePassword" class="space-y-4">
                        <UFormField :label="$t('settings.password.old_password_label')" name="oldPassword" required>
                            <UInput type="password" v-model="passwordState.oldPassword" />
                        </UFormField>
                        <UFormField :label="$t('settings.password.new_password_label')" name="newPassword" required>
                            <UInput type="password" v-model="passwordState.newPassword" />
                        </UFormField>
                        <UFormField :label="$t('settings.password.confirm_password_label')" name="newPasswordConfirm"
                            required>
                            <UInput type="password" v-model="passwordState.newPasswordConfirm" />
                        </UFormField>
                        <UButton type="submit" :loading="pendingPassword">{{ $t('settings.password.button') }}</UButton>
                    </UForm>
                </UCard>

                <!-- Delete Account Tab -->
                <UCard v-if="item.key === 'delete'" :ui="{ body: 'space-y-4' }">
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

        <!-- Delete Account Confirmation Modal -->
        <UModal v-model:open="isDeleteModalOpen" :ui="{overlay: 'bg-gray-950/95'}">
            <template #title>
                <h3 class="text-xl font-bold text-red-500 dark:text-red-400">
                    {{ $t('settings.delete.modal.title') }}
                </h3>
            </template>
            <template #body>
                <div class="space-y-4">
                    <p>
                        {{ $t('settings.delete.modal.description', {
                            username: `<strong
                            class="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">${user?.username}</strong>`
                        })
                        }}
                    </p>
                    <UInput v-model="confirmationText" :placeholder="user?.username" />
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
    { key: 'profile', label: t('settings.nav.profile'), icon: 'i-lucide-user' },
    { key: 'email', label: t('settings.nav.email'), icon: 'i-lucide-mail' },
    { key: 'password', label: t('settings.nav.password'), icon: 'i-lucide-lock' },
    { key: 'delete', label: t('settings.nav.delete_account'), icon: 'i-lucide-trash-2' },
];

const pendingProfile = ref(false);
const profileSchema = z.object({ name: z.string().min(2, t('settings.profile.validation')) });
const profileState = reactive({ name: user.value?.name || '', avatar: undefined as File | undefined });

async function handleUpdateProfile() {
    pendingProfile.value = true;
    try {
        await updateProfile({ name: profileState.name, avatar: profileState.avatar });
        toast.add({ title: t('settings.profile.toast_success'), color: 'success' });
        profileState.avatar = undefined;
        // No need to reset name, as the `user` ref will update and flow down
    } catch (error: any) {
        toast.add({ title: t('error.label'), description: error.data?.statusMessage || t('settings.profile.toast_error'), color: 'error' });
    } finally {
        pendingProfile.value = false;
    }
}

const pendingEmail = ref(false);
const emailSchema = z.object({ newEmail: z.string().email(t('settings.email.validation')) });
const emailState = reactive({ newEmail: '' });
async function handleChangeEmail(event: FormSubmitEvent<any>) {
    pendingEmail.value = true;
    try {
        const response = await requestEmailChange(event.data.newEmail);
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
