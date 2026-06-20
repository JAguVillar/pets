// Centralizamos las URLs que apuntan a otras apps del monorepo.
// PUBLIC_ADMIN_URL se setea por env (ver .env.example); fallback a localhost dev.
export const ADMIN_URL =
  import.meta.env.PUBLIC_ADMIN_URL || "http://localhost:3000";

export const ROUTES = {
  adminLogin: `${ADMIN_URL}/login`,
  adminAdoptionsNew: `${ADMIN_URL}/adopciones/nuevo`,
  adminLostNew: `${ADMIN_URL}/perdidos/nuevo`,
  adminProfile: `${ADMIN_URL}/perfil`,
};
