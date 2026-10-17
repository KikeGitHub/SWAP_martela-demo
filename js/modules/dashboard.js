/**
 * MARTELA — Módulo: Dashboard Ejecutivo
 */
window.MartelaDashboard = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const summary = await window.apiFacade.getDashboardSummary();
    const { money, grams, esc, badge } = window.MartelaUI;

    container.innerHTML = `
      <!-- Encabezado de Sección -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Mando Central de Operaciones</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Resumen Ejecutivo</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Visibilidad integral del inventario de oro, pedidos B2B y logística en tiempo real.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="MartelaApp.exportBackup()" class="btn btn-soft">
            <span>⇩</span> Respaldo JSON
          </button>
          <button onclick="MartelaApp.switchTab('inventory')" class="btn btn-gold">
            <span>＋</span> Registrar Pieza
          </button>
        </div>
      </div>

      <!-- Tarjetas KPI Principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- KPI 1 -->
        <div class="panel p-5 border-l-4 border-amber-500 relative overflow-hidden">
          <div class="flex justify-between items-start">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Piezas Físicas Disponibles</span>
            <span class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-sm">📦</span>
          </div>
          <div class="text-3xl font-black mt-3 text-slate-900 dark:text-white">${summary.piezas_disponibles}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span class="text-emerald-500 font-bold">●</span> Trazabilidad serial individual
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="panel p-5 border-l-4 border-amber-600 relative overflow-hidden">
          <div class="flex justify-between items-start">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peso Neto en Bóvedas</span>
            <span class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-sm">⚖️</span>
          </div>
          <div class="text-3xl font-black mt-3 text-slate-900 dark:text-white">${grams(summary.peso_neto_disponible_g)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span class="text-amber-600 font-bold">◈</span> En ${summary.almacenes_count} almacenes físicos
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="panel p-5 border-l-4 border-blue-500 relative overflow-hidden">
          <div class="flex justify-between items-start">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valuación Teórica de Metal</span>
            <span class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-sm">💰</span>
          </div>
          <div class="text-2xl font-black mt-3 text-slate-900 dark:text-white">${money(summary.valor_estimado_mxn)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span class="text-blue-500 font-bold">Fix: $${summary.fix_aplicado_usd} USD</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="panel p-5 border-l-4 border-purple-500 relative overflow-hidden">
          <div class="flex justify-between items-start">
            <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alertas de Reorden</span>
            <span class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-sm">🚨</span>
          </div>
          <div class="text-3xl font-black mt-3 text-slate-900 dark:text-white">${summary.alertas_reorden_campeones}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span class="text-rose-500 font-bold">Lead time 60-90 días</span>
          </div>
        </div>
      </div>

      <!-- Cuadrante Central: Coppel B2B Callout & Accesos Rápidos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Banner Coppel B2B -->
        <div class="panel lg:col-span-2 p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/50 text-white border-amber-500/20 shadow-xl">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase">Operación Masiva</span>
              <span class="text-xs text-slate-300">Pedido Miércoles Coppel COP-2026-W42</span>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              438 piezas solicitadas
            </span>
          </div>
          <h3 class="text-xl font-bold mb-2">Despiece y Asignación Automatizada de Sucursales</h3>
          <p class="text-sm text-slate-300 mb-5 leading-relaxed">
            El sistema distribuye y asigna piezas físicas con peso específico para las 26 tiendas/CEDIS (Huehuetoca, Puebla, Monterrey, etc.), conciliando el gramaje y emitiendo el layout Excel en un solo clic.
          </p>
          <div class="flex flex-wrap gap-3">
            <button onclick="MartelaApp.switchTab('coppel')" class="btn btn-gold text-slate-950">
              <span>🏢</span> Ir al Módulo Coppel B2B <span>→</span>
            </button>
            <button onclick="MartelaApp.switchTab('pricing')" class="btn btn-soft bg-slate-800/80 text-white border-slate-700 hover:border-amber-400">
              <span>◇</span> Consultar FIX de Oro
            </button>
          </div>
        </div>

        <!-- Accesos Rápidos -->
        <div class="panel p-6">
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4">Accesos Directos</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            <button onclick="MartelaInventory.openModalAlta()" class="btn btn-soft w-full justify-start text-xs py-2.5">
              <span class="text-amber-500 text-sm">＋</span> Ingresar pieza con pesaje
            </button>
            <button onclick="MartelaApp.switchTab('coppel')" class="btn btn-soft w-full justify-start text-xs py-2.5">
              <span class="text-amber-500 text-sm">▣</span> Procesar pedido B2B Coppel
            </button>
            <button onclick="MartelaApp.switchTab('billing')" class="btn btn-soft w-full justify-start text-xs py-2.5">
              <span class="text-amber-500 text-sm">▧</span> Generar prefactura
            </button>
            <button onclick="MartelaApp.switchTab('logistics')" class="btn btn-soft w-full justify-start text-xs py-2.5">
              <span class="text-amber-500 text-sm">🚚</span> Simular entrega y firma Chofer
            </button>
            <button onclick="MartelaApp.switchTab('foundry')" class="btn btn-soft w-full justify-start text-xs py-2.5">
              <span class="text-amber-500 text-sm">🛠️</span> Taller de fundición y mermas
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla de Actividad Reciente / Auditoría -->
      <div class="panel p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Bitácora de Trazabilidad Reciente</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Registro inmutable de movimientos de oro, pesajes y prefacturas.</p>
          </div>
          <button onclick="MartelaApp.switchTab('reports')" class="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">
            Ver auditoría completa →
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th class="p-3">Fecha y Hora</th>
                <th class="p-3">Usuario / Rol</th>
                <th class="p-3">Operación</th>
                <th class="p-3">Registro / ID</th>
                <th class="p-3">Resultado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${summary.actividad_reciente.map(a => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3 font-mono text-slate-500">${esc(a.fecha)}</td>
                  <td class="p-3 font-medium text-slate-900 dark:text-white">
                    <div>${esc(a.usuario)}</div>
                    <div class="text-[10px] text-slate-400">${esc(a.rol)}</div>
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      ${esc(a.accion)}
                    </span>
                  </td>
                  <td class="p-3 font-mono font-bold">${esc(a.registro_id)}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-300">${esc(a.resultado)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return { render };
})();
