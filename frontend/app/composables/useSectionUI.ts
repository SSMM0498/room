import { defineStore } from 'pinia'
import type { Section } from '~~/types/ui'

export const useSectionUIStore = defineStore('section-ui-store', () => {
  const articleOpened = ref(false)
  const currentSection = ref("")
  const sectionType = ref<'tech' | 'profile' | 'void'>("tech")
  const currentCourseId = ref("")
  const sections = ref<Section[]>([])

  // Pages publish every section they built into `sections`; what the listing renders
  // is `visibleSections`, the same list narrowed by the header search and filters.
  const { filterSections, isFiltering } = useCourseFilters()
  const visibleSections = computed(() => filterSections(sections.value))
  const filteredOutEverything = computed(() =>
    isFiltering.value && sections.value.length > 0 && visibleSections.value.length === 0)

  const sectionCount = computed(() => visibleSections.value.length)
  const contentSize = computed(() => {
    const c = sectionCount.value / 16 * 7;
    return c < 1 ? 1 : c
  })

  const resetUI = () => {
    articleOpened.value = false
    currentSection.value = ""
    currentCourseId.value = ""
    sectionType.value = "tech"
    sections.value = []
  }

  const openCourse = (e: MouseEvent, slug: string) => {
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
    visibleSections,
    filteredOutEverything,
    sectionCount,
    contentSize,
    sectionType,
    resetUI,
    openCourse,
    setCurrentSection,
    setCurrentCourse,
    closeArticle,
    scrollToCurrentSection,
    scrollToSection,
  }
})
