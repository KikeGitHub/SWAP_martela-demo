/**
 * MARTELA — Control de Acceso, Autenticación y Roles Simulados
 */
window.MartelaAuth = (function() {
  const USERS = {
    admin: {
      key: 'admin',
      name: 'Carlos Mendoza',
      role: 'Administrador',
      email: 'carlos.mendoza@martela.mx',
      modules: ['dashboard', 'inventory', 'pricing', 'coppel', 'billing', 'logistics', 'foundry', 'champions', 'reports', 'audit']
    },
    facturacion: {
      key: 'facturacion',
      name: 'Adriana López',
      role: 'Administración / Facturación (PLD)',
      email: 'adriana.lopez@martela.mx',
      modules: ['dashboard', 'coppel', 'billing', 'pricing', 'reports', 'audit']
    },
    boveda: {
      key: 'boveda',
      name: 'Elisa Ramírez',
      role: 'Almacenista Bóveda General',
      email: 'elisa.ramirez@martela.mx',
      modules: ['dashboard', 'inventory', 'coppel', 'foundry', 'reports']
    },
    chofer: {
      key: 'chofer',
      name: 'Miguel Torres',
      role: 'Chofer / Repartidor PWA',
      email: 'miguel.torres@martela.mx',
      modules: ['logistics']
    },
    fundicion: {
      key: 'fundicion',
      name: 'Roberto Silva',
      role: 'Taller de Fundición y Mermas',
      email: 'roberto.silva@martela.mx',
      modules: ['foundry', 'inventory', 'reports']
    }
  };

  const STORAGE_KEY = 'martela_current_user_key';

  function getCurrentUser() {
    const key = localStorage.getItem(STORAGE_KEY) || 'admin';
    return USERS[key] || USERS.admin;
  }

  function login(username, password) {
    if (password !== 'martela123') {
      return { success: false, message: 'Contraseña de demostración incorrecta (Use: martela123)' };
    }
    const user = USERS[username];
    if (!user) {
      return { success: false, message: 'Usuario no reconocido en el catálogo de roles.' };
    }
    localStorage.setItem(STORAGE_KEY, user.key);
    return { success: true, user };
  }

  function switchRole(roleKey) {
    if (USERS[roleKey]) {
      localStorage.setItem(STORAGE_KEY, roleKey);
      return USERS[roleKey];
    }
    return getCurrentUser();
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasAccess(moduleKey) {
    const u = getCurrentUser();
    return u.modules.includes(moduleKey);
  }

  return {
    USERS,
    getCurrentUser,
    login,
    switchRole,
    logout,
    hasAccess
  };
})();
