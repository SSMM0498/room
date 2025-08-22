export default defineNuxtPlugin(async () => {
  const { me } = useAuth();
  const user = useAuthUser();
  const { getOrCreateSchool } = useSchools()

  if (!user.value || !user.value.school) {
    await me();
    const school = await getOrCreateSchool();
    user.value!.school = school;
  }
});
