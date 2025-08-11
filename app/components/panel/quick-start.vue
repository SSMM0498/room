<script setup lang="ts">
import type { CourseCard } from '~/types';

const localePath = useLocalePath();

const activeCourse: CourseCard = {
  id: 4,
  section: "Latest",
  title: "AI Basics",
  price: "5.0",
  date: "November 15, 2023",
  techs: ["python", "machine learning"],
  avatar: "/ai_basics.jpg",
  description: "Learn the basics of AI and machine learning in this introductory course.",
  sections: 10,
  lectures: 100,
  length: "4h 00m",
  courseContent: [
    {
      defaultOpen: false,
      label: "1. Getting Started",
      subItems: [
        "Setup",
        "First App"
      ]
    }
  ]
};

const recommendations = [
  {
    id: 1,
    title: "Deep Learning",
    avatar: "/deep_learning.jpg",
    techs: ["python", "deep learning"],
    description: "Explore advanced concepts in deep learning.",
  },
  {
    id: 2,
    title: "Web Development Basics",
    avatar: "/web_dev.jpg",
    techs: ["html", "css", "javascript"],
    description: "Learn the essentials of web development.",
  },
  {
    id: 3,
    title: "Data Science 101",
    avatar: "/data_science.jpg",
    techs: ["python", "data analysis"],
    description: "Start your journey in data science.",
  },
];
</script>

<template>
  <div class="flex flex-col w-full h-full items-start justify-start p-4 gap-4">
    <header class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">{{ $t("welcome-quick-start") }} </h1>
    </header>

    <section class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold"># Keep Learning</h1>
      <widget-row-card :course="activeCourse" />
      <widget-row-card :course="activeCourse" />
    </section>

    <section class="flex flex-col w-full gap-4">
      <h1 class="text-2xl font-bold"># Action Shortcuts</h1>
      <section class="flex w-full gap-4">
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-4 border-1 border-black dark:border-white bg-primary-600 text-white border rounded-lg"
          :to="localePath('/catalog')">
          <i class="i-heroicons-academic-cap-20-solid mr-2"></i>Join a school
        </nuxt-link>
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-4 border-1 border-black dark:border-white bg-primary-600 text-white border rounded-lg"
          :to="localePath('/catalog')">
          <i class="i-heroicons-magnifying-glass-20-solid mr-2"></i>Find a room_
        </nuxt-link>
      </section>
      <section class="flex w-full gap-4">
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-4 border-1 border-black dark:border-white bg-primary-600 text-white border rounded-lg"
          :to="localePath('/ide')">
          <i class="i-heroicons-squares-2x2-20-solid mr-2"></i>Start a room_
        </nuxt-link>
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-4 border-1 border-black dark:border-white bg-primary-600 text-white border rounded-lg"
          :to="localePath('/create/school')">
          <i class="i-heroicons-plus-circle-20-solid mr-2"></i>Create a school
        </nuxt-link>
      </section>
    </section>
  </div>
</template>
