<template>
  <header class="fixed left-0 top-0 z-50 w-full flex items-center border-gray-300 border-b ui-base text-gray-900 px-2">
    <NuxtLink :to="localePath('/')" class="relative flex justify-start items-start mt-[-5px] text-gray-900 dark:text-white text-5xl font-bold w-[200px] font-inter pl-2">
      <widget-type-writer text="room" :typing-speed="250" :deleting-speed="200" :delay-before-delete="30000" />
    </NuxtLink>
    <UInput icon="i-heroicons-magnifying-glass-20-solid" :ui="{base: 'rounded-[50px] min-w-[250px]'}" size="sm" variant="subtle" color="neutral"
      :trailing="false" placeholder="Search for a room" />
    <nav class="ml-4">
      <UPopover :popper="{ placement: 'bottom-start' }">
        <UBadge variant="subtle" class="tag rounded-full mr-2" color="neutral">
          <b>Filters</b>
          <UIcon name="i-hugeicons:filter-horizontal" class="mr-1" />
        </UBadge>
        <template #content>
          <div class="p-4 w-full flex flex-col gap-4">
            <div>
              <p class="text-sm font-bold mb-2">Room Type</p>
              <UButtonGroup size="xs">
                <UButton color="primary" variant="solid" :active="true">All</UButton>
                <UButton color="neutral" variant="soft">Cursus</UButton>
                <UButton color="neutral" variant="soft">Live</UButton>
                <UButton color="neutral" variant="soft">Single</UButton>
                <UButton color="neutral" variant="soft">School</UButton>
              </UButtonGroup>
            </div>
            <div>
              <p class="text-sm font-bold mb-2">Pricing</p>
              <UButtonGroup size="xs">
                <UButton color="primary" variant="solid" :active="true">All</UButton>
                <UButton color="neutral" variant="soft">Free</UButton>
                <UButton color="neutral" variant="soft">&lt;5$</UButton>
                <UButton color="neutral" variant="soft">&lt;10$</UButton>
                <UButton color="neutral" variant="soft">&lt;20$</UButton>
              </UButtonGroup>
            </div>
            <div>
              <p class="text-sm font-bold mb-2">Duration</p>
              <UButtonGroup size="xs">
                <UButton color="primary" variant="solid" :active="true">All</UButton>
                <UButton color="neutral" variant="soft">Short</UButton>
                <UButton color="neutral" variant="soft">Medium</UButton>
                <UButton color="neutral" variant="soft">Long</UButton>
              </UButtonGroup>
            </div>
            <div>
              <p class="text-sm font-bold mb-2">Sort by</p>
              <UButtonGroup size="xs">
                <UButton color="primary" variant="solid" :active="true">Relevance</UButton>
                <UButton color="neutral" variant="soft">Upload date</UButton>
                <UButton color="neutral" variant="soft">Participation</UButton>
                <UButton color="neutral" variant="soft">Rating</UButton>
              </UButtonGroup>
            </div>
          </div>
        </template>
      </UPopover>
      <div>
        <div v-if="pending">Loading tags...</div>
        <div v-else-if="error">Error loading tags</div>
        <template v-else >
          <widget-tag 
            link="latest"
          >
            Latest
          </widget-tag>
          <widget-tag 
            link="top"
          >
            Top
          </widget-tag>
          <widget-tag
            :link="tag.name.toLowerCase()" 
            v-for="tag in tags" 
            :key="tag.id"
          >
            {{ tag.name }}
          </widget-tag>
        </template>
      </div>
    </nav>
    <layout-color-switch class="mx-2" />

    <template v-if="user">
      <UPopover :overlay="false" :popper="{ placement: 'bottom' }">
        <UAvatar class="mr-3" :src="useFileUrl(user, 'avatar', '100x100')"  :alt="user.username" crossorigin="anonymous" />
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
            <UDivider size="xs" class="py-1" />
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
            <UDivider size="xs" class="py-1" />
            <UButton type="submit" variant="outline" @click="handleLogout" color="primary" size="xs"
              icon="i-heroicons:arrow-right-on-rectangle-20-solid">
              {{ $t("logout") }}
            </UButton>
          </div>
        </template>
      </UPopover>
    </template>
    <div class="flex w-[250px] items-center " v-else>
      <UButton type="submit" variant="outline" :to="localePath('/login')" color="primary" size="xs" class="w-full items-center justify-center mr-2">
        {{ $t("sign_in") }}
      </UButton>
      <UButton type="submit" color="primary" :to="localePath('/register')" size="xs" class="w-full items-center justify-center">
        {{ $t("sign_up") }}
      </UButton>
    </div>
  </header>
</template>

<script setup lang="ts">
const localePath = useLocalePath();
const user = useAuthUser();
const { logout } = useAuth();

const { tags, pending, error, fetchTags } = useTags();
onMounted(async () => {
  await fetchTags();
});

async function handleLogout() {
  try {
    await logout();
    // Redirect to the home page after successful logout
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

header nav {
  @apply flex items-center justify-start overflow-hidden;
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
