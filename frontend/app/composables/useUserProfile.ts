import { type RecordModel } from 'pocketbase';
import type { UserProfileData } from '~~/types/ui';
import { parseCourseRecordToCard } from '~/composables/useCourses';

export const useUserProfile = () => {
    const profileData = useState<UserProfileData | null>('user-profile-data', () => null);
    const pending = ref(false);
    const error = ref<Error | null>(null);

    const followerCount = ref(0);
    const followingCount = ref(0);
    const isFollowing = ref(false);
    const followRecordId = ref<string | null>(null);

    const fetchFollowerStatus = async (profileUserId: string) => {
        try {
            const status = await $fetch<{
                followerCount: number;
                followingCount: number;
                isFollowing: boolean;
                followRecordId: string | null;
            }>(`/api/users/${profileUserId}/follow-status`);

            followerCount.value = status.followerCount;
            followingCount.value = status.followingCount;
            isFollowing.value = status.isFollowing;
            followRecordId.value = status.followRecordId;
        } catch (err) {
            console.error("Failed to fetch follower status:", err);
        }
    };

    /**
     * Fetches the complete profile data for a given username.
     * @param username The username of the profile to fetch.
     */
    const fetchProfile = async (username: string) => {
        pending.value = true;
        error.value = null;
        try {
            const rawData = await $fetch<{
                user: RecordModel;
                school: RecordModel | null;
                courses: RecordModel[];
            }>(`/api/users/${username}`);

            if (rawData.user) {
                await fetchFollowerStatus(rawData.user.id);
            }

            const parsedCourses = rawData.courses.map(parseCourseRecordToCard);

            const _profileData = {
                user: rawData.user,
                school: rawData.school,
                courses: parsedCourses,
            };
            profileData.value = _profileData

            return profileData;
        } catch (err: any) {
            error.value = err;
            const _profileData = {
                user: null,
                school: null,
                courses: [],
            };
            profileData.value = _profileData
            return null;
        } finally {
            pending.value = false;
        }
    };

    const follow = async (profileUserId: string) => {
        try {
            const response = await $fetch<{ success: boolean, followRecordId: string }>(`/api/users/${profileUserId}/follow`, {
                method: 'POST',
            });
            if (response.success) {
                isFollowing.value = true;
                followRecordId.value = response.followRecordId;
                followerCount.value++;
            }
        } catch (err) {
            console.error("Follow action failed:", err);
        }
    };

    const unfollow = async (profileUserId: string) => {
        try {
            await $fetch(`/api/users/${profileUserId}/unfollow`, {
                method: 'POST',
            });
            isFollowing.value = false;
            followRecordId.value = null;
            followerCount.value--;
        } catch (err) {
            console.error("Unfollow action failed:", err);
        }
    };

    return {
        profileData: profileData,
        pending: pending,
        error: error,
        followerCount: followerCount,
        followingCount: followingCount,
        isFollowing: isFollowing,
        fetchProfile,
        follow,
        unfollow,
    };
};