<template>
    <section id="help" class="py-20 w-full">
        <div class="w-full flex flex-col items-center justify-center relative">
            <!-- Decorative element in the corner -->
            <div class="absolute bottom-0 right-10 dark:text-white text-black">
                <UIcon name="i-heroicons-paper-airplane" class="h-16 w-16 transform -rotate-45" />
            </div>

            <div class="text-center">
                <UBadge :label="$t('faq.pre_header')" variant="subtle" size="md"
                    class="tracking-wider rounded-full px-4 py-1.5" />
                <h2 class="dark:text-white text-black mt-4 text-3xl lg:text-4xl font-bold tracking-tighter">{{
                    $t('faq.title') }}</h2>
            </div>

            <div class="mt-12 flex items-center justify-center w-2/3 dark:text-white text-black">
                <UAccordion :items="faqItems" :ui="{
                    trigger: 'text-lg',
                    body: 'text-base text-muted'
                }">
                    <template #default="{ item }">
                        {{ item.label }}
                    </template>
                    <template #content="{ item }">
                        <div class="px-6 pb-6">
                            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {{ item.content }}
                            </p>
                        </div>
                    </template>
                </UAccordion>
            </div>

            <div class="mt-10 flex items-center justify-center gap-4">
                <UButton :label="$t('faq.button_more')" to="#" size="lg" variant="outline" color="neutral" class="border-3" />
                <UButton :label="$t('faq.button_contact')" :to="localePath('/contact')" size="lg" color="neutral"
                    variant="subtle" />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const { tm } = useI18n();

// A computed property to format the i18n data into the structure UAccordion expects
const faqItems = computed(() => {
    const items = tm('faq.items') as any[];
    if (Array.isArray(items)) {
        return items.map((item, index) => ({
            label: item.question.loc.source,
            content: item.answer.loc.source,
            // Make the first item open by default to match the design
            defaultOpen: index === 0
        }));
    }
    return [];
});
</script>