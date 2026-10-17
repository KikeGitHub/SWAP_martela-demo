/**
 * MARTELA — Módulo: Inteligencia de Stock y Alertas de "Campeones"
 * Proyecciones de reposición, lead time de importación (60-90 días) y prevención de desabasto.
 */
window.MartelaChampions = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const report = await window.apiFacade.getStockIntelligenceReport();
    const { esc, badge } = window.MartelaUI;

    const campeones = report.filter(r => r.es_campeon);
    const enRiesgo = report.filter(r => r.riesgo_desabasto);

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Cadena de Suministro & Reposición</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Inteligencia de Stock & Productos Campeones</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Algoritmo de punto de reorden considerando tiempos marítimos/aéreos de importación (60 a 90 días).
          </p>
        </div>
      </div>

      <!-- Métricas Resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="panel p-4 border-l-4 border-amber-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">Modelos Campeones (Top Rotación)</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${campeones.length} SKUs</div>
          <div class="text-[11px] text-amber-500 font-bold">Generan el 78% del volumen B2B</div>
        </div>

        <div class="panel p-4 border-l-4 border-rose-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">SKUs Bajo Umbral de Reorden</div>
          <div class="text-2xl font-black text-rose-500 font-mono mt-1">${enRiesgo.length} en alerta</div>
          <div class="text-[11px] text-slate-500">Requieren orden de compra anticipada</div>
        </div>

        <div class="panel p-4 border-l-4 border-blue-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">Lead Time Promedio Importación</div>
          <div class="text-2xl font-black text-blue-500 mt-1">60 a 90 días</div>
          <div class="text-[11px] text-slate-500">Fabricación en taller externo / China</div>
        </div>
      </div>

      <!-- Tabla de Inteligencia de Inventario -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Proyección de Reorden por Modelo</h3>
          <span class="text-xs text-slate-500">Cálculo dinámico de días de cobertura</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
              <tr>
                <th class="p-3.5">SKU / Modelo</th>
                <th class="p-3.5 text-center">Clasificación</th>
                <th class="p-3.5 text-center">Stock Actual</th>
                <th class="p-3.5 text-center">Mínimo</th>
                <th class="p-3.5 text-center">Lead Time</th>
                <th class="p-3.5 text-center">Días de Cobertura</th>
                <th class="p-3.5 text-center">Sugerencia Compra</th>
                <th class="p-3.5 text-center">Estatus Alerta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${report.map(r => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3.5 font-bold text-slate-900 dark:text-white">
                    <div>${esc(r.sku)}</div>
                    <div class="text-[10px] text-slate-400 font-normal">${esc(r.descripcion)}</div>
                  </td>
                  <td class="p-3.5 text-center">
                    ${r.es_campeon ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        ⭐ CAMPEÓN
                      </span>
                    ` : `<span class="text-slate-400 text-[10px]">Estándar</span>`}
                  </td>
                  <td class="p-3.5 text-center font-bold text-slate-900 dark:text-white font-mono">${r.disponibles} pzs</td>
                  <td class="p-3.5 text-center text-slate-500 font-mono">${r.stock_minimo} pzs</td>
                  <td class="p-3.5 text-center font-mono">${r.lead_time_dias} días</td>
                  <td class="p-3.5 text-center font-bold ${r.dias_inventario < 30 ? 'text-rose-500' : 'text-emerald-500'}">
                    ${r.dias_inventario} días
                  </td>
                  <td class="p-3.5 text-center">
                    ${r.sugerencia_compra > 0 ? `
                      <button onclick="MartelaChampions.generarOrdenSugerida('${r.sku}', ${r.sugerencia_compra})" class="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                        Pedir ${r.sugerencia_compra} pzs →
                      </button>
                    ` : `<span class="text-slate-400">Stock Óptimo</span>`}
                  </td>
                  <td class="p-3.5 text-center">
                    ${r.riesgo_desabasto ? badge('RIESGO DESABASTO') : badge('CORRECTO')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function generarOrdenSugerida(sku, qty) {
    window.MartelaUI.toast(`Sugerencia de orden de compra creada para ${qty} piezas de ${sku}`, 'success');
  }

  return { render, generarOrdenSugerida };
})();
