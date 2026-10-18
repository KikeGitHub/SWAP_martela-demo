/**
 * MARTELA — Controlador Principal de la Aplicación (App Router & State Controller)
 */
window.MartelaApp = (function() {
  const MODULE_MAP = {
    dashboard: { name: 'Resumen Ejecutivo', icon: '▦', module: window.MartelaDashboard },
    inventory: { name: 'Inventario por Pieza', icon: '▤', module: window.MartelaInventory },
    pricing: { name: 'Cotizador Fix Oro', icon: '◇', module: window.MartelaPricing },
    coppel: { name: 'Módulo Coppel B2B', icon: '🏢', module: window.MartelaCoppel },
    billing: { name: 'Facturación & CFDI 4.0', icon: '⚖', module: window.MartelaBilling },
    logistics: { name: 'Logística y Entregas PWA', icon: '🚚', module: window.MartelaLogistics },
    foundry: { name: 'Fundición y Mermas', icon: '🔥', module: window.MartelaFoundry },
    champions: { name: 'Alertas de Campeones', icon: '⭐', module: window.MartelaChampions },
    reports: { name: 'Reportes y Auditoría', icon: '▥', module: window.MartelaReports }
  };

  let currentTab = 'dashboard';

  function init() {
    applyTheme();
    const user = window.MartelaAuth.getCurrentUser();
    if (localStorage.getItem('martela_logged_in') === 'true') {
      showApp(user);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    document.getElementById('loginView')?.classList.remove('hidden');
    document.getElementById('appView')?.classList.add('hidden');
  }

  function showApp(user) {
    document.getElementById('loginView')?.classList.add('hidden');
    document.getElementById('appView')?.classList.remove('hidden');

    // Actualizar datos de usuario en la UI
    const sideUser = document.getElementById('sideUserName');
    const sideRole = document.getElementById('sideUserRole');
    const topUser = document.getElementById('topUserName');
    const topRole = document.getElementById('topUserRole');
    const roleSelect = document.getElementById('topRoleSelector');

    if (sideUser) sideUser.textContent = user.name;
    if (sideRole) sideRole.textContent = user.role;
    if (topUser) topUser.textContent = user.name;
    if (topRole) topRole.textContent = user.role;
    if (roleSelect) roleSelect.value = user.key;

    renderNavigation(user);

    // Si el usuario no tiene acceso al tab actual, ir al primer tab permitido
    if (!user.modules.includes(currentTab)) {
      currentTab = user.modules[0] || 'dashboard';
    }

    switchTab(currentTab);
  }

  function renderNavigation(user) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    nav.innerHTML = Object.entries(MODULE_MAP)
      .filter(([key]) => user.modules.includes(key))
      .map(([key, item]) => `
        <button 
          onclick="MartelaApp.switchTab('${key}')"
          id="navbtn-${key}"
          class="navbtn ${currentTab === key ? 'active' : ''}"
        >
          <span class="text-base w-5 text-center">${item.icon}</span>
          <span>${item.name}</span>
        </button>
      `).join('');
  }

  async function switchTab(tabId) {
    const user = window.MartelaAuth.getCurrentUser();
    if (!user.modules.includes(tabId)) {
      window.MartelaUI.toast('Su rol actual no cuenta con permisos para este módulo', 'error');
      return;
    }

    currentTab = tabId;

    // Actualizar botones de navegación
    document.querySelectorAll('.navbtn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`navbtn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Breadcrumb y título
    const mod = MODULE_MAP[tabId];
    const crumb = document.getElementById('pageCrumb');
    const title = document.getElementById('pageTitle');
    if (crumb) crumb.textContent = mod?.name || '';
    if (title) title.textContent = mod?.name || '';

    closeSidebar();

    const container = document.getElementById('contentContainer');
    if (container && mod?.module?.render) {
      await mod.module.render(container);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUserSelect')?.value;
    const password = document.getElementById('loginPasswordInput')?.value;

    const res = window.MartelaAuth.login(username, password);
    if (!res.success) {
      const err = document.getElementById('loginErrorMessage');
      if (err) {
        err.textContent = res.message;
        err.classList.remove('hidden');
      }
      return;
    }

    localStorage.setItem('martela_logged_in', 'true');
    window.apiFacade.audit('INICIO_SESION', 'Seguridad', res.user.key, `Acceso con rol ${res.user.role}`);
    showApp(res.user);
  }

  function handleRoleSwitch(roleKey) {
    const user = window.MartelaAuth.switchRole(roleKey);
    window.MartelaUI.toast(`Cambiado al perfil: ${user.name} (${user.role})`, 'info');
    window.apiFacade.audit('CAMBIO_ROL_SIMULADO', 'Seguridad', user.key, user.role);
    showApp(user);
  }

  function handleLogout() {
    window.MartelaAuth.logout();
    localStorage.removeItem('martela_logged_in');
    showLogin();
  }

  // Tema oscuro / claro
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('martela_theme', !isDark ? 'dark' : 'light');
    updateThemeButtons(!isDark);
  }

  function applyTheme() {
    const saved = localStorage.getItem('martela_theme') || 'dark';
    const isDark = saved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeButtons(isDark);
  }

  function updateThemeButtons(isDark) {
    const label = isDark ? 'Modo Claro' : 'Modo Oscuro';
    const icon = isDark ? '☀' : '☾';

    const loginBtn = document.getElementById('loginThemeBtn');
    if (loginBtn) loginBtn.innerHTML = `<span>${icon}</span> <span>${label}</span>`;

    const topBtn = document.getElementById('topThemeBtn');
    if (topBtn) topBtn.innerHTML = `<span>${icon}</span> <span class="hidden sm:inline">${label}</span>`;
  }

  function openSidebar() {
    document.getElementById('appSidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.remove('hidden');
  }

  function closeSidebar() {
    document.getElementById('appSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.add('hidden');
  }

  async function exportBackup() {
    const json = await window.apiFacade.exportBackupJSON();
    const filename = `martela-db-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    window.MartelaUI.downloadBlob(json, filename, 'application/json');
    window.MartelaUI.toast('Respaldo JSON preparado y descargado', 'success');
  }

  async function resetDemo() {
    if (!confirm('¿Restablecer toda la base de datos a los valores iniciales de demostración? Se perderán las piezas y pedidos nuevos creados en esta sesión.')) {
      return;
    }
    await window.apiFacade.resetDemo();
    window.MartelaUI.toast('Base de datos restablecida a valores iniciales', 'info');
    init();
  }

  return {
    init,
    showLogin,
    showApp,
    switchTab,
    handleLogin,
    handleRoleSwitch,
    handleLogout,
    toggleTheme,
    openSidebar,
    closeSidebar,
    exportBackup,
    resetDemo
  };
})();

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  window.MartelaApp.init();
});
