<template>
  <article
    v-if="!(uiStore.articleOpened && uiStore.currentSection === course.section && uiStore.currentCourseId !== course.id)"
    :class="{ 'py-4': uiStore.articleOpened && uiStore.currentSection === course.section && uiStore.currentCourseId === course.id, 'cursus pr-3': course.type === 'cursus', 'live': course.type === 'live', 'live run': course.type === 'live run' }"
    :id="`${course.section.toLowerCase()}-${course.id}`">
    <UButton
      v-if="uiStore.articleOpened && uiStore.currentSection === course.section && uiStore.currentCourseId === course.id"
      class="close-btn absolute -top-1 -left-4 z-50" icon="i-heroicons-x-mark-20-solid" @click="uiStore.closeArticle"
      variant="ghost">
    </UButton>
    <component :is="isPreview ? 'div' : 'a'"
      class="banner dark:bg-gray-950 bg-blue-50 dark:after:bg-blue-900 after:bg-blue-200 dark:before:bg-blue-950 before:bg-blue-300"
      :class="{ '!h-[550px]': uiStore.articleOpened && uiStore.currentSection === course.section && uiStore.currentCourseId === course.id, 'cursor-pointer': !isPreview }"
      @click.prevent="($event: any) => {
        if (isPreview) return; // Block click action in preview mode
        uiStore.openArticle($event, 'django-chatgpt-clone-tutorial');
        uiStore.setCurrentSection(course.section)
        uiStore.setCurrentCourse(course.id)
        uiStore.scrollToCurrentSection()
      }">
      <button class="icon">
        <i class="ri-play-circle-line ri-2x"></i>
      </button>
      <div class="techs">
        <img v-for="tag in course.tags" :key="tag.id" :src="useFileUrl(tag, 'logo', '100x100')" :alt="tag.name" />
      </div>
      <NuxtLink :to.stop="localePath(`/@/${course.author!.username}`)" @click.stop="">
        <UAvatar v-if="course.author" :src="useFileUrl(course.author, 'avatar', '100x100')"
          :alt="course.author.username" crossorigin="anonymous" class="absolute left-[12px] bottom-[12px]" />
      </NuxtLink>
      <div class="date bg-[white] text-gray-950 dark:bg-gray-900 dark:text-white">{{ course.createdDate }}</div>
      <!-- HERE IS THE PRICE SECTION -->
      <div class="price-ribbon">{{ course.price ? course.price + '$' : 'Free' }}</div>
    </component>
    <div
      v-if="uiStore.articleOpened && uiStore.currentSection === course.section && uiStore.currentCourseId === course.id"
      class="flex flex-col w-full gap-2 mt-4">

      <UTabs :items="tabs" class="w-full" variant="link">
        <template #overview>
          <div class="flex flex-col w-full items-start justify-start">
            <div class="flex items-center gap-4 w-full pb-4 px-4 border-b border-gray-200 dark:border-gray-800 mb-2">
              <UAvatar :src="course?.author!.avatar" size="lg" alt="Avatar for ssmm" />
              <div class="flex flex-col">
                <h3 class="text-lg font-medium">{{ course?.author!.username }}</h3>
                <p class="text-sm text-gray-600">Course Instructor</p>
              </div>
              <div class="flex gap-2 ml-auto">
                <UButton icon="i-simple-icons-github" color="neutral" variant="ghost" to="https://github.com/SSMM0498"
                  target="_blank" />
                <UButton icon="i-simple-icons-twitter" color="neutral" variant="ghost" to="https://github.com/SSMM0498"
                  target="_blank" />
              </div>
            </div>
            <div class="flex flex-col w-full items-start justify-start px-4 py-2 space-y-3">
              <!-- Conditionally render NuxtLink or a simple div for the title -->
              <component :is="isPreview ? 'div' : 'NuxtLink'" class="text-2xl mb-2 font-medium"
                :class="{ 'cursor-pointer': !isPreview }"
                :to="isPreview ? undefined : `/catalog/course/${course.slug}`">
                {{ course.title }}
              </component>
              <UBadge color="primary" variant="subtle">{{ course?.createdDate }}</UBadge>
              <div class="tags">
                <widget-tag v-for="tag in course?.tags" :key="tag.id" :link="`#${tag.name}`">{{ tag.name }}</widget-tag>
              </div>
              <p>
                {{ course?.description }}
              </p>
            </div>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col w-full gap-2 p-4">
            <div class="flex w-full justify-between items">
              <div class="flex items-center justify-start">
                <UBadge color="primary" variant="subtle">{{ course?.durationFormatted }}</UBadge>
                <span class="text-lg mx-1">·</span>
                <UBadge color="primary" variant="subtle">41 sections</UBadge>
                <span class="text-lg mx-1">·</span>
                <UBadge color="primary" variant="subtle">120 Kb</UBadge>
              </div>
            </div>
          </div>
        </template>
        <template #feedback>
          <widget-comment-panel />
        </template>
      </UTabs>
    </div>
    <template v-else>
      <div class="tags">
        <widget-tag v-for="tag in course.tags" :key="tag.id" :link="`#${tag.name}`">{{ tag.name }}</widget-tag>
      </div>
      <!-- Conditionally render NuxtLink or a simple div for the title -->
      <component :is="isPreview ? 'div' : 'NuxtLink'" class="text-2xl mb-2 font-medium"
        :class="{ 'cursor-pointer': !isPreview }" :to="isPreview ? undefined : `/catalog/course/${course.slug}`"
        @click="uiStore.closeArticle">
        {{ course.title }}
      </component>
      <p>
        {{ course.description }}
      </p>
    </template>
  </article>
</template>
<script setup lang="ts">
import type { CourseCard } from '../../../types/ui';

defineProps<{
  course: CourseCard;
  isPreview?: boolean;
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const uiStore = useSectionUIStore();

const tabs = [{
  slot: 'overview',
  label: t('overview')
}, {
  slot: 'content',
  label: t('course-content')
}, {
  slot: 'feedback',
  label: t('feedback')
}]
</script>
<style lang="css">
@reference "tailwindcss";

article {
  --primary: #4767ff;
  @apply z-10 relative w-full;
  transition: max-height 0.15s ease-out;
  /* max-height: 1500px; */
}

article.reduce-height {
  max-height: 0;
}

article .banner {
  @apply relative flex items-center justify-center w-full cursor-pointer shadow-blue-500/40 mb-6 rounded-[7.5px];
  height: clamp(350px, 350px, 20vw);
}

article:hover .banner:not(.live):not(.cursus) {
  @apply ring-2 ring-blue-300;
}

article .banner>button.icon {
  @apply absolute hidden z-50 transition-all duration-[0.125s] ease-[ease-in-out];
}

article .banner>.techs::after {
  @apply absolute z-10 bg-[#0000] transition-all duration-[0.125s] ease-[ease-in-out] backdrop-blur-none inset-0;
}

article:hover .banner>button:hover~.techs::after,
article .banner>.techs:hover:after {
  @apply dark:bg-white/75 bg-black/75;
}

article:hover .banner>button {
  @apply flex scale-[2];
}

article .banner>.techs {
  @apply absolute flex items-center justify-center overflow-hidden rounded-[7.5px] inset-0;
}

article .banner>.techs>img {
  @apply absolute h-3/6 w-auto object-cover z-10 top-[15%];
}

article .banner>.techs>img:nth-child(2) {
  @apply z-[5] -translate-x-2/4 translate-y-[20%];
}

article .banner>.techs>img:nth-child(3) {
  @apply z-[5] translate-x-2/4 translate-y-[20%];
}

article .banner>.date {
  @apply absolute text-[0.8em] z-50 px-2 py-1 rounded-2xl right-3 bottom-3;
}

article .banner>.price-ribbon {
  --f: 10px;
  --r: 10px;
  --t: 10px;

  position: absolute;
  pointer-events: none;
  inset: var(--t) auto auto calc(-1*var(--f));
  padding: 0 calc(10px + var(--r)) var(--f) 10px;
  clip-path:
    polygon(100% 0,
      0 0,
      0 calc(100% - var(--f)),
      var(--f) 100%,
      var(--f) calc(100% - var(--f)),
      100% calc(100% - var(--f)),
      calc(100% - var(--r)) calc(50% - var(--f)/2));
  box-shadow: 0 calc(-1 * var(--f)) 0 inset #2c2c2c55;
  @apply bg-blue-500 text-white font-semibold flex items-center justify-end text-lg;
  transform: translateY(-150%) rotate(-5deg);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease-out;
}

article .banner:hover>.price-ribbon {
  transform: translateY(0) rotate(0);
  opacity: 1;
}

article>.tags {
  @apply mb-2;
}

article>p {
  @apply text-lg leading-6 overflow-y-hidden m-0 pr-[0.4vw];
  display: -webkit-box;
}

article:not(.active)>p {
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

article.cursus .banner:after,
article.cursus .banner:before {
  content: "";
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: -1;
  transition: .3s;
  box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
  border-radius: 7.5px;
  transition: .3s;
}

article.list::after,
article.cursus .banner:after {
  transform: translate(8.5px, 6.5px);
}

article.cursus .banner:before {
  transform: translate(16px, 15px);
}

article.cursus .banner:hover:after {
  transform: translate(8.5px, 6.5px) rotate(1.5deg);
}

article.cursus .banner:hover:before {
  opacity: 1;
  transform: translate(16px, 15px) rotate(2.75deg);
}

article.live.run .banner::before {
  content: '';
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  border-radius: 7.5px;
  transition: .5s;
  z-index: -2;
  opacity: 0.75;
  @apply dark:bg-white bg-blue-600;
}

article.live.run .banner::before {
  @apply animate-[glowing_1.25s_ease-in-out_infinite_alternate] dark:animate-[dglowing_1.25s_ease-in-out_infinite_alternate];
}

article.live .banner::after {
  content: 'live';
  position: absolute;
  top: 12px;
  right: 12px;
  display: block;
  padding: .125rem .25rem;
  border-radius: 1rem;
  z-index: 50;
  color: white;
  font-size: 0.6rem;
  font-weight: bold;
  text-transform: uppercase;
  background: var(--primary);
  transition: transform ease-in-out .3s, opacity ease-in-out .1s;
}

article.live .banner:hover::before {
  transform: scale(1.01);
  @apply dark:shadow-[0px_0px_5px_2px_white] shadow-[0px_0px_5px_2px_var(--primary)];
}

article.live.run .banner:hover {
  @apply dark:shadow-[0px_0px_5px_white] shadow-[0px_0px_5px_var(--primary)];
}

@-webkit-keyframes glowing {
  from {
    transform: scale(0.9);
    box-shadow: 0px 0px 0px var(--primary);
  }

  to {
    transform: scale(1.01);
    box-shadow: 0px 0px 5px 2px var(--primary);
  }
}

@keyframes glowing {
  from {
    transform: scale(0.9);
    box-shadow: 0px 0px 0px var(--primary);
  }

  to {
    transform: scale(1.01);
    box-shadow: 0px 0px 5px 2px var(--primary);
  }
}

@-webkit-keyframes dglowing {
  from {
    transform: scale(0.9);
    box-shadow: 0px 0px 0px white;
  }

  to {
    transform: scale(1.01);
    box-shadow: 0px 0px 5px 2px white;
  }
}

@keyframes dglowing {
  from {
    transform: scale(0.9);
    box-shadow: 0px 0px 0px white;
  }

  to {
    transform: scale(1.01);
    box-shadow: 0px 0px 5px 2px white;
  }
}
</style>
