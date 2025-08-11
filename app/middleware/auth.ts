import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuthUser();
  const nuxt = useNuxtApp()

  if (!user.value) {
    return navigateTo(nuxt.$localePath('/login'), {
      replace: true,
    });
  }
});