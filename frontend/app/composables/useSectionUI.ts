import { defineStore } from 'pinia'

export const useSectionUIStore = defineStore('section-ui-store', () => {
  const articleOpened = ref(false);
  const currentSection = ref("");
  const currentCourseId = ref("");

  const openArticle = (e: MouseEvent, slug: string) => {
    e.preventDefault();
    articleOpened.value = true;
  };

  const setCurrentSection = (title: string) => {
    currentSection.value = title;
  }

  const setCurrentCourse = (index: string) => {
    currentCourseId.value = index;
  }

  const closeArticle = () => {
    articleOpened.value = false;
    currentCourseId.value = "";
    currentSection.value = "";
  }

  const scrollToCurrentSection = () => {
    const sectionElement = document.getElementById(currentSection.value.toLowerCase());

    if (sectionElement) {
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });

        const cardElement = document.querySelector(`#${currentSection.value.toLowerCase()}-${currentCourseId.value} > .close-btn`);
        if (cardElement) {
          setTimeout(() => {
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'start'});
          }, 500);
        }
      }, 750);
    }
  }

  const scrollToSection = (section: string) => {
    console.log(">>> SECTION >>>", section)
    const sectionElement = document.getElementById(section);

    if (sectionElement) {
      closeArticle();
      setTimeout(() => {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
        sectionElement.classList.add('highlight');
        setTimeout(() => {
          sectionElement.classList.remove('highlight');
        }, 1000);
      }, 500);
    }
  }

  return {
    articleOpened,
    currentSection,
    currentCourseId,
    openArticle,
    setCurrentSection,
    setCurrentCourse,
    closeArticle,
    scrollToCurrentSection,
    scrollToSection,
  }
});