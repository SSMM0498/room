<template>
    <div class="w-full base-height overflow-y-auto">
        <div class="max-w-3xl mx-auto px-8 py-6">
            <div v-if="pending && !currentSchool" class="space-y-4">
                <USkeleton class="h-10 w-1/2" />
                <USkeleton class="h-40 w-full" />
            </div>

            <div v-else-if="!currentSchool" class="flex flex-col items-start gap-4">
                <p class="text-red-500">{{ errorMessage || 'This school does not exist.' }}</p>
                <UButton :to="localePath('/')" color="neutral" variant="outline">Go home</UButton>
            </div>

            <div v-else-if="!isOwner" class="flex flex-col items-start gap-4">
                <p class="text-red-500">Only the owner can edit this school.</p>
                <UButton :to="localePath(`/school/${currentSchool.id}`)" color="neutral" variant="outline">
                    Back to the school page
                </UButton>
            </div>

            <template v-else>
                <div class="flex items-center justify-between mb-8">
                    <h1 class="text-3xl font-bold text-black dark:text-white">Edit school</h1>
                    <UButton :to="localePath(`/dashboard/${currentSchool.id}`)" icon="i-heroicons-arrow-left"
                        color="neutral" variant="ghost">
                        Back to dashboard
                    </UButton>
                </div>

                <UForm :schema="schema" :state="state" class="space-y-6" @submit="handleSubmit">
                    <UCard>
                        <template #header>
                            <h2 class="text-lg font-semibold">Identity</h2>
                        </template>

                        <div class="space-y-4">
                            <UFormField label="School name" name="name" size="lg" required class="w-full">
                                <UInput v-model="state.name" class="w-full" placeholder="e.g., Selle Academy" />
                            </UFormField>

                            <UFormField label="Description" name="description" class="w-full"
                                hint="Shown on your public school page.">
                                <UTextarea v-model="state.description" class="w-full" :rows="6"
                                    placeholder="What do you teach, and who is it for?" />
                            </UFormField>

                            <UFormField label="Topics" name="topics" class="w-full"
                                hint="The technologies your school covers.">
                                <USelectMenu v-model="state.topics" :items="tagOptions" value-key="value" multiple
                                    searchable placeholder="Select technologies" size="lg" class="w-full"
                                    :ui="{
                                        group: 'flex flex-row items-start justify-start gap-2 flex-wrap p-2',
                                        item: 'm-0 p-0 w-auto'
                                    }">
                                    <template #item="{ item }">
                                        <widget-tag class="m-0"
                                            :class="{ 'ring-2 ring-blue-400': state.topics.includes(item.value) }">
                                            {{ item.label }}
                                        </widget-tag>
                                    </template>
                                </USelectMenu>
                            </UFormField>
                        </div>
                    </UCard>

                    <UCard>
                        <template #header>
                            <h2 class="text-lg font-semibold">Branding</h2>
                        </template>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <widget-image-field v-model="logoFile" v-model:removed="logoRemoved" label="Logo"
                                :current-url="logoUrl" :max-size-mb="5" hint="Square image, up to 5MB."
                                preview-class="h-32 w-32" placeholder-icon="i-heroicons-academic-cap" />
                            <div class="md:col-span-2">
                                <widget-image-field v-model="bannerFile" v-model:removed="bannerRemoved" label="Banner"
                                    :current-url="bannerUrl" :max-size-mb="10" hint="Wide image, up to 10MB."
                                    preview-class="h-32 w-full" />
                            </div>
                        </div>
                    </UCard>

                    <div class="flex items-center justify-end gap-2">
                        <UButton :to="localePath(`/dashboard/${currentSchool.id}`)" color="neutral" variant="ghost">
                            Cancel
                        </UButton>
                        <UButton type="submit" :loading="saving" icon="i-heroicons-check">Save changes</UButton>
                    </div>
                </UForm>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import type { RecordModel } from 'pocketbase';

definePageMeta({
    middleware: 'auth',
    name: 'dashboard-edit'
});

const route = useRoute();
const toast = useToast();
const localePath = useLocalePath();
const authUser = useAuthUser();

const { currentSchool, pending, errorMessage, fetchSchool, updateSchool } = useSchools();
const { tags, fetchTags } = useTags();

const schoolId = computed(() => route.params.schoolId as string);

useHead({ title: () => currentSchool.value ? `Edit ${currentSchool.value.name}` : 'Edit school' });
const isOwner = computed(() => !!authUser.value && currentSchool.value?.owner === authUser.value.id);

const saving = ref(false);
const logoFile = ref<File | null>(null);
const bannerFile = ref<File | null>(null);
const logoRemoved = ref(false);
const bannerRemoved = ref(false);

const logoUrl = computed(() => useFileUrl(currentSchool.value, 'logo', '400x400'));
const bannerUrl = computed(() => useFileUrl(currentSchool.value, 'banner', '1200x0'));

const schema = z.object({
    name: z.string().min(2, 'The name must be at least 2 characters.').max(80, 'The name is too long.'),
    description: z.string().optional(),
    topics: z.array(z.string()),
});

const state = reactive({
    name: '',
    description: '',
    topics: [] as string[],
});

const tagOptions = computed(() => tags.value.map(tag => ({ label: tag.name, value: tag.id })));

await useAsyncData(
    () => `school-edit-${schoolId.value}`,
    async () => {
        await fetchTags();
        return await fetchSchool(schoolId.value);
    },
    { watch: [schoolId] }
);

// Fill the form from the loaded school.
watch(currentSchool, (school) => {
    if (!school) return;
    state.name = school.name ?? '';
    state.description = school.description ?? '';
    state.topics = ((school.expand?.topics as RecordModel[] | undefined) ?? []).map(topic => topic.id);
}, { immediate: true });

async function handleSubmit() {
    if (!currentSchool.value) return;

    saving.value = true;

    const formData = new FormData();
    formData.append('name', state.name);
    formData.append('description', state.description ?? '');

    // Always send the field so clearing every topic is persisted.
    if (state.topics.length > 0) {
        state.topics.forEach(topic => formData.append('topics', topic));
    } else {
        formData.append('topics', '');
    }

    if (logoFile.value) formData.append('logo', logoFile.value);
    else if (logoRemoved.value) formData.append('remove', 'logo');

    if (bannerFile.value) formData.append('banner', bannerFile.value);
    else if (bannerRemoved.value) formData.append('remove', 'banner');

    const result = await updateSchool(currentSchool.value.id, formData);
    saving.value = false;

    if (!result) {
        toast.add({
            title: 'Could not save the school',
            description: errorMessage.value || 'Please try again.',
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle',
        });
        return;
    }

    // The previews now come from the saved record.
    logoFile.value = null;
    bannerFile.value = null;
    logoRemoved.value = false;
    bannerRemoved.value = false;

    toast.add({ title: 'School updated.', color: 'success', icon: 'i-heroicons-check-circle' });
}
</script>
