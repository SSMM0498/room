export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuthUser();
  const nuxt = useNuxtApp()

  if (user.value) {
    return navigateTo(nuxt.$localePath('/catalog'), {
      replace: true,
    });
  }
});