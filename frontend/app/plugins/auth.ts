export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth();
  const user = useAuthUser();

  // A workspace sub-domain has its own, initially empty, storage: there the
  // session cookie handed over by the main domain is the only trace of the user.
  if (import.meta.client && !user.value && useWorkspaceHost().currentSubdomain()) {
    await checkAuth();
  }

  if (import.meta.client && user.value && !user.value.school) {
    await checkAuth();
    const { getOrCreateSchool } = useSchools()
    const school = await getOrCreateSchool();
    user.value!.school = school;
  }
});
