// Configuración para evitar prerendering en rutas con parámetros
export const prerenderConfig = {
  routes: [
    '/',
    '/login',
    '/home',
    '/workspace-list',
    '/dashboard'
    // Excluir rutas con parámetros como /workspace-viewer/:id
  ]
};