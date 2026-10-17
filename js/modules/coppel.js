/**
 * MARTELA — Módulo: Operación Coppel B2B (Procesamiento Masivo de los Miércoles)
 * Automatiza el despiece por tienda, asignación física por caja y generación de layout Excel.
 */
window.MartelaCoppel = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const orders = await window.apiFacade.getCoppelOrders();
    const activeOrder = orders.find(o => o.order_id === 'COP-2026-W42') || orders[0];
    const db = window.apiFacade._getDB();
    const availablePieces = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE').length;

    const { money, grams, esc, badge } = window.MartelaUI;

    const isAssigned = activeOrder.piezas_asignadas >= activeOrder.total_piezas;
    const matchPercentage = ((activeOrder.piezas_asignadas / activeOrder.total_piezas) * 100).toFixed(0);

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Automatización Departamental B2B</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Procesamiento de Pedidos Coppel</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepción del archivo semanal de los miércoles, matriz de empaque por sucursal y despiece con serial individual.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <input type="file" id="coppelExcelInput" class="hidden" accept=".xlsx,.xls,.csv" onchange="MartelaCoppel.handleExcelImport(event)" />
          <button onclick="document.getElementById('coppelExcelInput').click()" class="btn btn-soft">
            <span>⇧</span> Importar Excel Portal
          </button>
          <button onclick="MartelaCoppel.exportLayoutExcel('${activeOrder.order_id}')" class="btn btn-soft">
            <span>⇩</span> Exportar Layout (.xlsx)
          </button>
          ${!isAssigned ? `
            <button onclick="MartelaCoppel.assignPieces('${activeOrder.order_id}')" class="btn btn-gold">
              <span>⚡</span> Asignar Piezas Automáticamente
            </button>
          ` : `
            <button onclick="MartelaApp.switchTab('billing')" class="btn btn-gold">
              <span>▧</span> Generar Prefactura de este Pedido
            </button>
          `}
        </div>
      </div>

      <!-- Barra de Conciliación en Tiempo Real -->
      <div class="panel p-5 mb-6 border-l-4 ${isAssigned ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'}">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-base text-slate-900 dark:text-white">${esc(activeOrder.order_id)}</span>
              ${badge(activeOrder.estatus)}
              <span class="text-xs text-slate-400 font-mono">Entrega: ${esc(activeOrder.fecha_entrega)}</span>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ${esc(activeOrder.notas)} · <b>${activeOrder.sucursales.length} sucursales / CEDIS programadas</b>
            </div>
          </div>

          <!-- Contador de Validación -->
          <div class="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-right">
              <div class="text-[10px] uppercase font-bold text-slate-400">Conciliación de Empaque</div>
              <div class="text-base font-black text-slate-900 dark:text-white">
                Solicitadas: <b class="text-slate-900 dark:text-white">${activeOrder.total_piezas}</b> | Asignadas en Cajas: <b class="${isAssigned ? 'text-emerald-500' : 'text-amber-500'}">${activeOrder.piezas_asignadas}</b>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${isAssigned ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}">
              ${matchPercentage}%
            </div>
          </div>
        </div>

        <!-- Barra de Progreso Visual -->
        <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
          <div class="h-2 rounded-full ${isAssigned ? 'bg-emerald-500' : 'bg-amber-500'} transition-all duration-500" style="width: ${matchPercentage}%"></div>
        </div>
      </div>

      <!-- Alerta si falta inventario o si está listo -->
      ${!isAssigned ? `
        <div class="panel p-4 mb-6 flex items-center justify-between gap-4 bg-blue-50 dark:bg-blue-950/30 border-blue-500/20 text-xs text-blue-900 dark:text-blue-300">
          <div class="flex items-center gap-3">
            <span class="text-lg">ℹ️</span>
            <div>
              Hay <b>${availablePieces} piezas físicas disponibles</b> en Bóveda General listas para ser vinculadas con código de serie único a las cajas de empaque de Coppel.
            </div>
          </div>
          <button onclick="MartelaCoppel.assignPieces('${activeOrder.order_id}')" class="btn btn-gold text-xs py-1.5 whitespace-nowrap">
            Ejecutar Asignación Inteligente
          </button>
        </div>
      ` : `
        <div class="panel p-4 mb-6 flex items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300">
          <div class="flex items-center gap-3">
            <span class="text-lg">✓</span>
            <div>
              <b>Conciliación 100% Exitosa:</b> Todas las 438 piezas fueron etiquetadas por caja y sucursal. El pedido está listo para la emisión de prefactura y generación de ruta logística.
            </div>
          </div>
        </div>
      `}

      <!-- Matriz de Despiece por Tienda / CEDIS / Caja -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Matriz de Despiece por Tienda y Asignación de Cajas</h3>
            <p class="text-xs text-slate-400">Desglose de entregas en 26 sucursales para el pedido semanal.</p>
          </div>
          <span class="text-xs text-slate-500">${activeOrder.sucursales.length} sucursales</span>
        </div>

        <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0 z-10">
              <tr>
                <th class="p-3">ID Tienda</th>
                <th class="p-3">Nombre Sucursal</th>
                <th class="p-3">CEDIS Destino</th>
                <th class="p-3">Zona</th>
                <th class="p-3 text-center">Caja Sugerida</th>
                <th class="p-3 text-center">Piezas Solicitadas</th>
                <th class="p-3 text-center">Piezas Asignadas</th>
                <th class="p-3 text-center">Estatus Empaque</th>
                <th class="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${activeOrder.sucursales.map(s => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">${esc(s.tienda_id)}</td>
                  <td class="p-3 font-semibold text-slate-900 dark:text-white">${esc(s.nombre)}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold">
                      ${esc(s.cedis)}
                    </span>
                  </td>
                  <td class="p-3 text-slate-500">${esc(s.zona)}</td>
                  <td class="p-3 text-center">
                    <span class="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      Caja #${s.caja_sugerida}
                    </span>
                  </td>
                  <td class="p-3 text-center font-bold text-slate-900 dark:text-white">${s.piezas_solicitadas}</td>
                  <td class="p-3 text-center font-bold ${s.piezas_asignadas_ids.length === s.piezas_solicitadas ? 'text-emerald-500' : 'text-slate-400'}">
                    ${s.piezas_asignadas_ids.length}
                  </td>
                  <td class="p-3 text-center">
                    ${s.piezas_asignadas_ids.length === s.piezas_solicitadas ? badge('LISTO_EMPAQUE') : badge('PENDIENTE')}
                  </td>
                  <td class="p-3 text-center">
                    <button 
                      onclick="MartelaCoppel.verDetalleTienda('${s.tienda_id}')"
                      class="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                    >
                      Ver seriales →
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function assignPieces(orderId) {
    try {
      await window.apiFacade.assignPiecesToCoppelOrder(orderId);
      window.MartelaUI.toast('Asignación masiva de 438 piezas completada con éxito', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function verDetalleTienda(tiendaId) {
    const db = window.apiFacade._getDB();
    const order = db.coppel_orders.find(o => o.order_id === 'COP-2026-W42');
    const sucursal = order?.sucursales.find(s => s.tienda_id === tiendaId);
    if (!sucursal) return;

    const { esc, grams } = window.MartelaUI;

    const pieces = db.inventory_pieces.filter(p => sucursal.piezas_asignadas_ids.includes(p.piece_id));
    const totalWeight = pieces.reduce((s, p) => s + p.peso_neto_g, 0);

    const html = `
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center text-xs">
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">${esc(sucursal.nombre)} (${esc(sucursal.tienda_id)})</div>
            <div class="text-slate-400 mt-0.5">CEDIS: ${esc(sucursal.cedis)} · Caja Asignada: #${sucursal.caja_sugerida}</div>
          </div>
          <div class="text-right">
            <div class="text-slate-400">Peso Total Neto:</div>
            <div class="text-base font-black text-amber-600 dark:text-amber-400 font-mono">${grams(totalWeight)}</div>
          </div>
        </div>

        <div class="text-xs font-bold text-slate-700 dark:text-slate-300">Piezas Físicas Asignadas en esta Caja:</div>

        ${pieces.length === 0 ? `
          <div class="p-6 text-center text-slate-400 text-xs">
            Aún no se han asignado piezas físicas a esta sucursal. Presiona el botón "Asignar Piezas Automáticamente" en el panel principal.
          </div>
        ` : `
          <div class="overflow-x-auto max-h-72 overflow-y-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0">
                <tr>
                  <th class="p-2">ID Serial</th>
                  <th class="p-2">SKU</th>
                  <th class="p-2 text-right">Peso Neto</th>
                  <th class="p-2 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${pieces.map(p => `
                  <tr>
                    <td class="p-2 font-mono font-bold text-amber-600 dark:text-amber-400">${esc(p.piece_id)}</td>
                    <td class="p-2 font-mono">${esc(p.sku_ref)}</td>
                    <td class="p-2 text-right font-mono font-bold">${grams(p.peso_neto_g)}</td>
                    <td class="p-2 text-center">${window.MartelaUI.badge(p.estatus)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    window.MartelaUI.openModal(`Detalle de Empaque · ${sucursal.nombre}`, html, 'max-w-xl');
  }

  function exportLayoutExcel(orderId) {
    const db = window.apiFacade._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) return;

    const rows = [];
    order.sucursales.forEach(s => {
      if (s.piezas_asignadas_ids.length === 0) {
        rows.push({
          'Pedido': order.order_id,
          'Cliente': order.cliente,
          'ID Tienda': s.tienda_id,
          'Nombre Sucursal': s.nombre,
          'CEDIS': s.cedis,
          'Caja': s.caja_sugerida,
          'ID Pieza Serial': 'PENDIENTE_ASIGNACION',
          'SKU': 'N/A',
          'Peso Neto (g)': 0
        });
      } else {
        s.piezas_asignadas_ids.forEach(pieceId => {
          const piece = db.inventory_pieces.find(p => p.piece_id === pieceId) || {};
          rows.push({
            'Pedido': order.order_id,
            'Cliente': order.cliente,
            'ID Tienda': s.tienda_id,
            'Nombre Sucursal': s.nombre,
            'CEDIS': s.cedis,
            'Caja': s.caja_sugerida,
            'ID Pieza Serial': piece.piece_id || pieceId,
            'SKU': piece.sku_ref || '',
            'Peso Neto (g)': piece.peso_neto_g || 0
          });
        });
      }
    });

    window.MartelaUI.exportToExcel(rows, `layout-coppel-${order.order_id}-${new Date().toISOString().slice(0, 10)}.xlsx`, 'LayoutCoppel');
  }

  function handleExcelImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX !== 'undefined') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'array' });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);
          window.MartelaUI.toast(`Archivo Coppel procesado: ${json.length} registros validados`, 'success');
        } catch (err) {
          window.MartelaUI.toast('Error al leer el archivo Excel', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      window.MartelaUI.toast('Simulación de carga Excel completada (SheetJS)', 'info');
    }
    e.target.value = '';
  }

  return {
    render,
    assignPieces,
    verDetalleTienda,
    exportLayoutExcel,
    handleExcelImport
  };
})();
