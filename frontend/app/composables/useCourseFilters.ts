import { ref, computed } from 'vue';
import type { CourseCard, Section } from '~~/types/ui';

/** Course format, mirrors the `type` field of the `courses` collection. */
export type RoomTypeFilter = 'all' | 'single' | 'cursus' | 'live';
/** Price ceilings offered by the filter menu; every bucket includes the free courses. */
export type PriceFilter = 'all' | 'free' | 'under5' | 'under10' | 'under20';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';
export type CourseSort = 'relevance' | 'recent' | 'participation' | 'rating';

/** Upper bound (exclusive) of each price bucket, in dollars. */
const PRICE_CEILINGS: Record<Exclude<PriceFilter, 'all' | 'free'>, number> = {
    under5: 5,
    under10: 10,
    under20: 20,
};

/** Bounds of the duration buckets, in seconds. */
const SHORT_MAX_SECONDS = 15 * 60;
const MEDIUM_MAX_SECONDS = 60 * 60;

/**
 * Weight of each searchable field in the relevance score. A course only shows up
 * when every term of the query matched somewhere, and ranks on where it matched:
 * a hit in the title beats a hit buried in the description.
 */
const FIELD_WEIGHTS = {
    title: 8,
    tags: 4,
    people: 2,
    description: 1,
} as const;

/** Lowercases and strips the accents, so "nodejs" matches "Node.js" and "déploiement" matches "deploiement". */
const normalize = (value: string): string =>
    value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Descriptions are rich text, so the tags themselves must not be searchable content. */
const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, ' ');

/** The searchable text of a course, split by field so hits can be weighted. */
const searchableFields = (course: CourseCard): Record<keyof typeof FIELD_WEIGHTS, string> => ({
    title: normalize(course.title ?? ''),
    tags: normalize((course.tags ?? []).map(tag => tag?.name ?? '').join(' ')),
    people: normalize([
        course.author?.username,
        course.author?.name,
        course.school?.name,
    ].filter(Boolean).join(' ')),
    description: normalize(stripHtml(course.description ?? '')),
});

// Module-level state, shared by every caller: the header owns the search box, the
// filter menu owns the dropdowns, and the listing pages read the result.
const search = ref('');
const roomType = ref<RoomTypeFilter>('all');
const price = ref<PriceFilter>('all');
const duration = ref<DurationFilter>('all');
const sort = ref<CourseSort>('relevance');

/**
 * Catalog search and filters, applied client-side to the courses already loaded by
 * the current page (catalog, tech, profile and school listings all go through
 * `useSectionUIStore().visibleSections`).
 */
export const useCourseFilters = () => {
    /** Search terms, normalized; an empty query matches everything. */
    const searchTerms = computed(() =>
        normalize(search.value).split(/\s+/).filter(Boolean));

    /** Number of dropdown filters left away from their default, shown on the menu badge. */
    const activeFilterCount = computed(() =>
        [roomType.value, price.value, duration.value].filter(value => value !== 'all').length
        + (sort.value === 'relevance' ? 0 : 1));

    const isFiltering = computed(() => activeFilterCount.value > 0 || searchTerms.value.length > 0);

    const matchesRoomType = (course: CourseCard): boolean =>
        roomType.value === 'all' || course.type === roomType.value;

    const matchesPrice = (course: CourseCard): boolean => {
        if (price.value === 'all') return true;
        const coursePrice = course.price ?? 0;
        if (price.value === 'free') return coursePrice === 0;
        return coursePrice < PRICE_CEILINGS[price.value];
    };

    /** A course with no recorded duration yet only shows up under "All". */
    const matchesDuration = (course: CourseCard): boolean => {
        if (duration.value === 'all') return true;
        const seconds = course.durationSeconds ?? 0;
        if (seconds <= 0) return false;
        if (duration.value === 'short') return seconds < SHORT_MAX_SECONDS;
        if (duration.value === 'medium') return seconds >= SHORT_MAX_SECONDS && seconds < MEDIUM_MAX_SECONDS;
        return seconds >= MEDIUM_MAX_SECONDS;
    };

    /**
     * Relevance score of a course for the current query: 0 means it missed at least
     * one term and must be filtered out.
     */
    const searchScore = (course: CourseCard): number => {
        if (searchTerms.value.length === 0) return 1;

        const fields = searchableFields(course);
        let score = 0;

        for (const term of searchTerms.value) {
            let best = 0;
            for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
                if (weight > best && fields[field as keyof typeof FIELD_WEIGHTS].includes(term)) {
                    best = weight;
                }
            }
            if (best === 0) return 0;
            score += best;
        }

        return score;
    };

    const byCreationDate = (a: CourseCard, b: CourseCard): number =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

    /**
     * Sorts the matching courses. "Relevance" without a query keeps the order the
     * page built the section in, which is the editorial order.
     */
    const sortCourses = (courses: CourseCard[], scores: Map<string, number>): CourseCard[] => {
        const sorted = [...courses];

        switch (sort.value) {
            case 'recent':
                return sorted.sort(byCreationDate);
            case 'participation':
                return sorted.sort((a, b) => (b.participants ?? 0) - (a.participants ?? 0) || byCreationDate(a, b));
            case 'rating':
                return sorted.sort((a, b) =>
                    (b.rating ?? 0) - (a.rating ?? 0)
                    || (b.participants ?? 0) - (a.participants ?? 0)
                    || byCreationDate(a, b));
            default:
                if (searchTerms.value.length === 0) return sorted;
                return sorted.sort((a, b) =>
                    (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || byCreationDate(a, b));
        }
    };

    /** Applies the search, the dropdown filters and the sort to a list of courses. */
    const filterCourses = (courses: CourseCard[]): CourseCard[] => {
        const scores = new Map<string, number>();
        const matching = courses.filter((course) => {
            if (!matchesRoomType(course) || !matchesPrice(course) || !matchesDuration(course)) return false;
            const score = searchScore(course);
            if (score === 0) return false;
            scores.set(course.id, score);
            return true;
        });

        return sortCourses(matching, scores);
    };

    /** Same, section by section; a section left without a course disappears. */
    const filterSections = (sections: Section[]): Section[] => {
        if (!isFiltering.value) return sections;

        return sections
            .map(section => ({ ...section, courses: filterCourses(section.courses) }))
            .filter(section => section.courses.length > 0);
    };

    const resetFilters = () => {
        search.value = '';
        roomType.value = 'all';
        price.value = 'all';
        duration.value = 'all';
        sort.value = 'relevance';
    };

    return {
        // State
        search,
        roomType,
        price,
        duration,
        sort,
        activeFilterCount,
        isFiltering,

        // Methods
        filterCourses,
        filterSections,
        resetFilters,
    };
};
