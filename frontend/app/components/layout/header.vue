<template>
  <header class="fixed left-0 top-0 z-50 w-full flex items-center border-gray-300 border-b ui-base text-gray-900 px-2">
    <NuxtLink :to="localePath('/')"
      class="relative flex justify-start items-start mt-[-5px] text-gray-900 dark:text-white text-5xl font-bold w-[200px] font-inter pl-2 pb-3">
      <widget-type-writer text="room" :typing-speed="250" :deleting-speed="200" :delay-before-delete="30000" />
    </NuxtLink>

    <layout-nav-home-nav v-if="($route.name as String).startsWith('home')" />
    <layout-nav-default-nav v-else />

    <layout-color-switch class="mx-2" />
    <template v-if="user">
      <UPopover :overlay="false" :popper="{ placement: 'bottom' }">
        <UAvatar class="mr-3" :src="useFileUrl(user, 'avatar', '100x100')" :alt="user.username"
          crossorigin="anonymous" />
        <template #content>
          <div class="py-5 px-3 flex flex-col overflow-hidden gap-2">
            <div class="flex flex-col">
              <p class="line-clamp-1 text-ellipsis overflow-hidden text-lg md:text-sm">
                {{ user.name }}
              </p>
              <p class="line-clamp-1 text-ellipsis overflow-hidden font-bold md:text-sm">
                @{{ user.username }}
              </p>
              <p class="line-clamp-1 truncate text-sm md:text-xs">
                {{ user.email }}
              </p>
            </div>
            <USeparator size="xs" class="py-1" />
            <UButton variant="link" :padded="false" :to="localePath('/dashboard')" size="sm"
              icon="i-heroicons:user-20-solid">
              {{ $t("profile") }}
            </UButton>
            <UButton variant="link" :padded="false" :to="localePath('/dashboard/edit')" size="sm"
              icon="i-heroicons:cog-6-tooth-20-solid">
              {{ $t("settings") }}
            </UButton>
            <UButton variant="link" :padded="false" :to="localePath('/dashboard/learning')" size="sm"
              icon="i-heroicons:academic-cap-20-solid">
              {{ $t("student_dashboard") }}
            </UButton>
            <UButton variant="link" :padded="false" :to="localePath('/dashboard/teaching')" size="sm"
              icon="i-heroicons:rectangle-stack-20-solid">
              {{ $t("instructor_dashboard") }}
            </UButton>
            <USeparator size="xs" class="py-1" />
            <UButton type="submit" variant="outline" @click="handleLogout" color="primary" size="xs"
              icon="i-heroicons:arrow-right-on-rectangle-20-solid">
              {{ $t("logout") }}
            </UButton>
          </div>
        </template>
      </UPopover>
    </template>
    <div class="flex w-[250px] items-center " v-else>
      <UButton type="submit" variant="outline" :to="localePath('/login')" color="primary" size="xs"
        class="w-full items-center justify-center mr-2">
        {{ $t("sign_in") }}
      </UButton>
      <UButton type="submit" color="primary" :to="localePath('/register')" size="xs"
        class="w-full items-center justify-center">
        {{ $t("sign_up") }}
      </UButton>
    </div>
  </header>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const user = useAuthUser();
const { logout } = useAuth();

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

header nav div::-webkit-scrollbar,
header nav div::-webkit-scrollbar-track,
header nav div::-webkit-scrollbar-track:hover,
header nav div::-webkit-scrollbar-thumb,
header nav div::-webkit-scrollbar-thumb:hover {
  display: none;
}

header>img.avatar {
  @apply ml-2;
}

img.avatar {
  @apply w-10 h-10 transition-all duration-[0.25s] ease-[ease-in-out] border-[color:var(--gray)] rounded-full border-solid hover:cursor-pointer hover:border-[color:var(--white)] hover:scale-110;
}

header>nav>div {
  @apply flex items-center justify-between w-full overflow-x-auto;
}
</style>