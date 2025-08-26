// stores/section-ui-store.ts
import { defineStore } from 'pinia'
import type { Section } from '~~/types/ui'

export const useSectionUIStore = defineStore('section-ui-store', () => {
  const articleOpened = ref(false)
  const currentSection = ref("")
  const currentCourseId = ref("")
  const sections = ref<Section[]>([])   // all sections live here

  // derived count
  const sectionCount = computed(() => sections.value.length)
  const contentSize = computed(() => {
    const c = sectionCount.value / 16 * 3.8;
    return c < 1 ? 1 : c
  })

  // === your existing methods ===
  const openArticle = (e: MouseEvent, slug: string) => {
    e.preventDefault()
    articleOpened.value = true
  }

  const setCurrentSection = (title: string) => {
    currentSection.value = title
  }

  const setCurrentCourse = (index: string) => {
    currentCourseId.value = index
  }

  const closeArticle = () => {
    articleOpened.value = false
    currentCourseId.value = ""
    currentSection.value = ""
  }

  const scrollToCurrentSection = () => {
    const sectionElement = document.getElementById(currentSection.value.toLowerCase())
    if (sectionElement) {
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
        const cardElement = document.querySelector(
          `#${currentSection.value.toLowerCase()}-${currentCourseId.value} > .close-btn`
        )
        if (cardElement) {
          setTimeout(() => {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 500)
        }
      }, 750)
    }
  }

  const scrollToSection = (section: string) => {
    const sectionElement = document.getElementById(section)
    if (sectionElement) {
      closeArticle()
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })
        sectionElement.classList.add('highlight')
        setTimeout(() => {
          sectionElement.classList.remove('highlight')
        }, 1000)
      }, 500)
    }
  }

  return {
    articleOpened,
    currentSection,
    currentCourseId,
    sections,
    sectionCount,
    contentSize,
    openArticle,
    setCurrentSection,
    setCurrentCourse,
    closeArticle,
    scrollToCurrentSection,
    scrollToSection,
  }
})
