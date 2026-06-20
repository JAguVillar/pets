// Bloquea rutas que solo deberían ver administradores.
// Asume @nuxtjs/supabase global middleware ya garantiza usuario autenticado.
export default defineNuxtRouteMiddleware(async (to) => {
  // En SSR no sabemos el rol todavía y no queremos tirar 404; lo dejamos pasar
  // y la página se encarga de no renderizar contenido sensible si no es admin.
  if (import.meta.server) return;

  const { profile, isAdmin, loadMyProfile } = useProfile();
  if (!profile.value) {
    try {
      await loadMyProfile();
    } catch {
      // ignore — el supabase middleware tira a /login si no hay sesión
    }
  }
  if (!isAdmin.value) {
    return navigateTo("/", { replace: true });
  }
  // Evita warning: route param no usado en lógica simple.
  void to;
});
