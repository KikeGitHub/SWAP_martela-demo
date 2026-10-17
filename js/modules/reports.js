/**
 * MARTELA — Módulo: Reportes Operativos, Auditoría Integral & Respaldo JSON
 */
window.MartelaReports = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const auditLogs = await window.apiFacade.getAuditLogs();
    const db = window.apiFacade._getDB();
    const { grams, esc } = window.MartelaUI;

    // Resumen por almacén
    const resumenAlmacenes = db.warehouses.map(w => {
      const pieces = db.inventory_pieces.filter(p => p.almacen_id === w.id);
      const gramsTotal = pieces.reduce((s, p) => s + p.peso_neto_g, 0);
      return {
        almacen: w.nombre,
        tipo: w.tipo,
        piezas: pieces.length,
        gramos: gramsTotal
      };
    });

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Inteligencia de Datos & Trazabilidad</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Reportes Operativos & Auditoría</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas consolidadas por almacén, movimientos de oro y bitácora de acciones del sistema.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="MartelaReports.exportAuditCSV()" class="btn btn-soft">
            <span>⇩</span> Exportar Auditoría CSV
          </button>
          <button onclick="MartelaApp.exportBackup()" class="btn btn-soft">
            <span>⇩</span> Descargar Respaldo JSON
          </button>
          <button onclick="MartelaApp.resetDemo()" class="btn btn-soft text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
            <span>↻</span> Restablecer Demo
          </button>
        </div>
      </div>

      <!-- Resumen de Inventario Consolidado por Almacén -->
      <div class="panel p-6 mb-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">Distribución Física de Oro por Bóveda y Sucursal</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          ${resumenAlmacenes.map(a => `
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <div class="text-xs font-bold text-slate-900 dark:text-white">${esc(a.almacen)}</div>
              <div class="text-[11px] text-slate-400">${esc(a.tipo)}</div>
              <div class="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-2">${grams(a.gramos)}</div>
              <div class="text-[11px] text-slate-500 font-medium">${a.piezas} piezas registradas</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tabla de Auditoría del Sistema -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Bitácora General de Auditoría del Sistema</h3>
            <p class="text-xs text-slate-400">Registro histórico de sesiones, altas, transferencias, FIX y prefacturas.</p>
          </div>
          <span class="text-xs text-slate-500">${auditLogs.length} eventos registrados</span>
        </div>

        <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0">
              <tr>
                <th class="p-3">ID Log</th>
                <th class="p-3">Fecha y Hora</th>
                <th class="p-3">Usuario</th>
                <th class="p-3">Rol</th>
                <th class="p-3">Acción</th>
                <th class="p-3">Módulo / Entidad</th>
                <th class="p-3">Registro</th>
                <th class="p-3">Detalle / Resultado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${auditLogs.map(a => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3 font-mono text-slate-400">${esc(a.id)}</td>
                  <td class="p-3 font-mono text-slate-500">${esc(a.fecha)}</td>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">${esc(a.usuario)}</td>
                  <td class="p-3 text-slate-500">${esc(a.rol)}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ${esc(a.accion)}
                    </span>
                  </td>
                  <td class="p-3 text-slate-700 dark:text-slate-300">${esc(a.entidad)}</td>
                  <td class="p-3 font-mono font-bold">${esc(a.registro_id)}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-400">${esc(a.resultado)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function exportAuditCSV() {
    const logs = await window.apiFacade.getAuditLogs();
    const rows = logs.map(l => ({
      'ID Auditoria': l.id,
      'Fecha': l.fecha,
      'Usuario': l.usuario,
      'Rol': l.rol,
      'Accion': l.accion,
      'Entidad': l.entidad,
      'Registro ID': l.registro_id,
      'Resultado': l.resultado
    }));

    window.MartelaUI.exportToExcel(rows, `martela-auditoria-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Auditoria');
  }

  return { render, exportAuditCSV };
})();
