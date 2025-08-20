<template>
  <header class="fixed left-0 top-0 z-50 w-full flex items-center border-gray-300 border-b ui-base text-gray-900 px-2">
    <NuxtLink :to="localePath('/')"
      class="relative flex justify-start items-start mt-[-5px] text-gray-900 dark:text-white text-5xl font-bold w-[200px] font-inter pl-2 pb-3">
      <widget-type-writer text="room" :typing-speed="250" :deleting-speed="200" :delay-before-delete="30000" />
    </NuxtLink>

    <layout-nav-home-nav v-if="($route.name as String).startsWith('home')" />
    <template v-else-if="($route.name as String).startsWith('settings')">
      <div class="w-full"></div>
    </template>
    <template v-else>
      <UInput icon="i-heroicons-magnifying-glass-20-solid" :ui="{ base: 'rounded-[50px] min-w-[250px]' }" size="sm"
        variant="subtle" color="neutral" :trailing="false" :placeholder="$t('search') + '...'" />
      <layout-nav-default-nav />
    </template>

    <layout-color-switch class="mx-2" />
    <template v-if="user">
      <UDropdownMenu arrow :items="menuItems" :content="{
        align: 'start',
        side: 'bottom',
      }" :ui="{
        content: 'w-64 p-2'
      }">
        <UAvatar class="mr-3 cursor-pointer" :src="useFileUrl(user, 'avatar', '100x100')" :alt="user.username"
          crossorigin="anonymous" />
      </UDropdownMenu>
    </template>
    <div class="flex w-[350px] items-center " v-else>
      <UButton type="submit" variant="outline" :to="localePath('/login')" color="neutral"
        class="w-full items-center justify-center mr-2">
        {{ $t("sign_in") }}
      </UButton>
      <UButton type="submit" color="neutral" :to="localePath('/register')" class="w-full items-center justify-center">
        {{ $t("sign_up") }}
      </UButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/types'

const { t } = useI18n();
const localePath = useLocalePath();
const user = useAuthUser();
const { logout } = useAuth();

const menuItems = computed<DropdownMenuItem[]>(() => [
  [
    {
      label: user.value?.name,
      slot: 'account-info',
      disabled: true,
      children: [
        { label: `@${user.value?.username}`, disabled: true },
        { label: user.value?.email, disabled: true }
      ]
    }
  ],
  [
    {
      label: t("profile"),
      icon: 'i-heroicons:user-20-solid',
      to: localePath('/profile')
    },
    {
      label: t("settings.title"),
      icon: 'i-heroicons:cog-6-tooth-20-solid',
      to: localePath('/settings')
    }
  ],
  [
    {
      label: t("logout"),
      icon: 'i-heroicons:arrow-right-on-rectangle-20-solid',
      click: () => handleLogout()
    }
  ]
]);

async function handleLogout() {
  try {
    await logout();
    await navigateTo(localePath('/'));
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>

<style scoped lang="css">
@reference "tailwindcss";

header {
  @apply h-[60px];
}
</style>