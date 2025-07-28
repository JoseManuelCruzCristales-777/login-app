// Configuración temporal para build sin prerendering
export const buildConfig = {
  prerender: false,
  routes: [
    '/',
    '/login', 
    '/home',
    '/workspace-list',
    '/dashboard'
    // Excluir workspace-viewer/:id por tener parámetros
  ]
};