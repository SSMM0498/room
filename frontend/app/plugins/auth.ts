export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth();
  const user = useAuthUser();

  if (import.meta.client && user.value && !user.value.school) {
    await checkAuth();
    const { getOrCreateSchool } = useSchools()
    const school = await getOrCreateSchool();
    user.value!.school = school;
  }
});
