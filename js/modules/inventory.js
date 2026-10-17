/**
 * MARTELA — Módulo: Inventario Inteligente (Gramaje Individual y Sub-piezas)
 * Resuelve el dolor central de ERPs como SAE: Mismo SKU base con piezas físicas de distinto peso.
 */
window.MartelaInventory = (function() {
  let currentFilters = {
    query: '',
    almacen: '',
    quilataje: '',
    estatus: ''
  };

  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const masterList = await window.apiFacade.getInventoryMasterTable(currentFilters);
    const db = window.apiFacade._getDB();
    const { money, grams, esc, badge } = window.MartelaUI;

    const totalPiezas = db.inventory_pieces.length;
    const totalGramos = db.inventory_pieces.reduce((s, p) => s + p.peso_neto_g, 0);
    const piezasDisponibles = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE').length;

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Trazabilidad de Metales Preciosos</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Inventario por Pieza y Gramaje Exacto</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cada pieza física cuenta con identificador serial único y pesaje con decimales bajo el mismo SKU maestro.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="MartelaInventory.openModalAlta()" class="btn btn-gold">
            <span>＋</span> Ingresar Pieza Física
          </button>
          <button onclick="MartelaInventory.exportExcel()" class="btn btn-soft">
            <span>⇩</span> Exportar Excel
          </button>
        </div>
      </div>

      <!-- Métricas Resumen Superior -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="panel p-4 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xl">
            💎
          </div>
          <div>
            <div class="text-xs text-slate-400 uppercase font-semibold">Total Piezas Físicas</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">${totalPiezas} piezas</div>
            <div class="text-[11px] text-emerald-500 font-medium">${piezasDisponibles} disponibles para venta/pedido</div>
          </div>
        </div>

        <div class="panel p-4 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xl">
            ⚖️
          </div>
          <div>
            <div class="text-xs text-slate-400 uppercase font-semibold">Peso Neto Total Acumulado</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">${grams(totalGramos)}</div>
            <div class="text-[11px] text-slate-500">Gramaje exacto sumado por balanza</div>
          </div>
        </div>

        <div class="panel p-4 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xl">
            🏛️
          </div>
          <div>
            <div class="text-xs text-slate-400 uppercase font-semibold">Almacenes Operativos</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white">${db.warehouses.length} almacenes</div>
            <div class="text-[11px] text-slate-500">Bóvedas, Sucursales y Fundición</div>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="panel p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Búsqueda Texto -->
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Buscar SKU o Descripción</label>
            <input 
              type="text" 
              placeholder="Ej. ANILLO-SOL, 10K, Esclava..." 
              value="${esc(currentFilters.query)}"
              oninput="MartelaInventory.onSearch(this.value)"
            />
          </div>

          <!-- Filtro Almacén -->
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Filtrar por Almacén</label>
            <select onchange="MartelaInventory.onFilterAlmacen(this.value)">
              <option value="">Todos los almacenes</option>
              ${db.warehouses.map(w => `<option value="${w.id}" ${currentFilters.almacen === w.id ? 'selected' : ''}>${esc(w.nombre)}</option>`).join('')}
            </select>
          </div>

          <!-- Filtro Quilataje -->
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Quilataje</label>
            <select onchange="MartelaInventory.onFilterQuilataje(this.value)">
              <option value="">Todos los quilates</option>
              <option value="10K" ${currentFilters.quilataje === '10K' ? 'selected' : ''}>Oro 10K (41.7% pureza)</option>
              <option value="14K" ${currentFilters.quilataje === '14K' ? 'selected' : ''}>Oro 14K (58.3% pureza)</option>
              <option value="18K" ${currentFilters.quilataje === '18K' ? 'selected' : ''}>Oro 18K (75.0% pureza)</option>
            </select>
          </div>

          <!-- Filtro Estatus -->
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Estatus Físico</label>
            <select onchange="MartelaInventory.onFilterEstatus(this.value)">
              <option value="">Todos los estatus</option>
              <option value="DISPONIBLE" ${currentFilters.estatus === 'DISPONIBLE' ? 'selected' : ''}>Disponible</option>
              <option value="EXHIBICION" ${currentFilters.estatus === 'EXHIBICION' ? 'selected' : ''}>En Exhibición</option>
              <option value="ASIGNADA" ${currentFilters.estatus === 'ASIGNADA' ? 'selected' : ''}>Asignada a Pedido</option>
              <option value="EN_FUNDICION" ${currentFilters.estatus === 'EN_FUNDICION' ? 'selected' : ''}>En Fundición</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla Máster de SKUs con Desglose Acordeón de Sub-piezas -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div class="text-sm font-bold text-slate-900 dark:text-white">
            Catálogo Maestro de Joyería & Piezas Físicas Vinculadas
          </div>
          <span class="text-xs text-slate-500">${masterList.length} modelos listados</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
              <tr>
                <th class="p-4">SKU / Modelo Base</th>
                <th class="p-4">Metal & Quilataje</th>
                <th class="p-4 text-center">Piezas Físicas</th>
                <th class="p-4 text-right">Peso Neto Acumulado</th>
                <th class="p-4 text-center">Clasificación</th>
                <th class="p-4 text-center">Existencias</th>
                <th class="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${masterList.length === 0 ? `
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-400">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ` : masterList.map(item => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td class="p-4">
                    <div class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>${esc(item.sku)}</span>
                      ${item.es_campeon ? '<span class="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Campeón</span>' : ''}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${esc(item.descripcion)}</div>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      <span>◈</span>
                      <span>${esc(item.quilataje)}</span> · <span>${esc(item.tipo_metal)}</span>
                    </span>
                  </td>
                  <td class="p-4 text-center">
                    <span class="font-bold text-slate-900 dark:text-white">${item.piezas_total}</span>
                    <span class="text-xs text-slate-400">(${item.piezas_disponibles} disp.)</span>
                  </td>
                  <td class="p-4 text-right font-black font-mono text-slate-900 dark:text-white">
                    ${grams(item.peso_neto_total_g)}
                  </td>
                  <td class="p-4 text-center text-xs text-slate-500">
                    ${esc(item.categoria)}
                  </td>
                  <td class="p-4 text-center">
                    ${item.alerta_stock ? badge('STOCK BAJO') : badge('DISPONIBLE')}
                  </td>
                  <td class="p-4 text-center">
                    <button 
                      onclick="MartelaInventory.toggleSubTable('${item.sku}')"
                      id="btn-toggle-${item.sku}"
                      class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 mx-auto"
                    >
                      <span>Ver piezas (${item.sub_piezas.length})</span>
                      <span id="icon-toggle-${item.sku}">▼</span>
                    </button>
                  </td>
                </tr>

                <!-- FILA DESPLEGABLE CON LAS SUB-PIEZAS FÍSICAS (EACH HAS UNIQUE SERIAL & DECIMAL GRAMS) -->
                <tr id="row-subpieces-${item.sku}" class="hidden bg-slate-50/70 dark:bg-slate-900/80 border-y border-amber-500/20">
                  <td colspan="7" class="p-5">
                    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner">
                      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span class="text-amber-500">⚖️</span>
                          <span>Piezas físicas registradas individualmente bajo el SKU <b class="text-amber-600 dark:text-amber-400">${item.sku}</b></span>
                        </div>
                        <button onclick="MartelaInventory.openModalAlta('${item.sku}')" class="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline">
                          ＋ Agregar pieza a este SKU
                        </button>
                      </div>

                      ${item.sub_piezas.length === 0 ? `
                        <div class="text-xs text-slate-400 py-3 text-center">No hay piezas físicas registradas bajo este SKU con los filtros activos.</div>
                      ` : `
                        <div class="overflow-x-auto max-h-64 overflow-y-auto">
                          <table class="w-full text-xs text-left">
                            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0">
                              <tr>
                                <th class="p-2.5">ID Pieza (Serial)</th>
                                <th class="p-2.5 text-right">Peso Bruto</th>
                                <th class="p-2.5 text-right">Peso Neto Exacto</th>
                                <th class="p-2.5">Almacén / Ubicación</th>
                                <th class="p-2.5">Fecha Ingreso</th>
                                <th class="p-2.5 text-center">Estatus</th>
                                <th class="p-2.5 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                              ${item.sub_piezas.map(p => `
                                <tr class="hover:bg-amber-50/40 dark:hover:bg-amber-950/20">
                                  <td class="p-2.5 font-mono font-bold text-slate-900 dark:text-white">${esc(p.piece_id)}</td>
                                  <td class="p-2.5 text-right font-mono text-slate-500">${grams(p.peso_bruto_g)}</td>
                                  <td class="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">${grams(p.peso_neto_g)}</td>
                                  <td class="p-2.5 text-slate-700 dark:text-slate-300">
                                    ${p.almacen_id === 'BOVEDA_GENERAL' ? '🏛️ Bóveda General' : 
                                      p.almacen_id === 'SUCURSAL_CDMX' ? '🏬 Sucursal CDMX' :
                                      p.almacen_id === 'SUCURSAL_MERIDA' ? '🏬 Sucursal Mérida' :
                                      p.almacen_id === 'TALLER_FUNDICION' ? '🔥 Taller Fundición' : esc(p.almacen_id)}
                                  </td>
                                  <td class="p-2.5 font-mono text-slate-400">${esc(p.fecha_ingreso)}</td>
                                  <td class="p-2.5 text-center">${badge(p.estatus)}</td>
                                  <td class="p-2.5 text-center">
                                    ${p.estatus === 'DISPONIBLE' ? `
                                      <button 
                                        onclick="MartelaInventory.openModalTransfer('${p.piece_id}')"
                                        class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 font-semibold text-[11px]"
                                      >
                                        Transferir ➔
                                      </button>
                                    ` : `<span class="text-slate-400 text-[11px]">—</span>`}
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function toggleSubTable(sku) {
    const row = document.getElementById(`row-subpieces-${sku}`);
    const icon = document.getElementById(`icon-toggle-${sku}`);
    if (row) {
      row.classList.toggle('hidden');
      if (icon) {
        icon.textContent = row.classList.contains('hidden') ? '▼' : '▲';
      }
    }
  }

  function onSearch(val) {
    currentFilters.query = val;
    render(document.getElementById('contentContainer'));
  }

  function onFilterAlmacen(val) {
    currentFilters.almacen = val;
    render(document.getElementById('contentContainer'));
  }

  function onFilterQuilataje(val) {
    currentFilters.quilataje = val;
    render(document.getElementById('contentContainer'));
  }

  function onFilterEstatus(val) {
    currentFilters.estatus = val;
    render(document.getElementById('contentContainer'));
  }

  // Modal de Alta de Pieza con lectura de báscula
  function openModalAlta(suggestedSku = '') {
    const db = window.apiFacade._getDB();
    const { esc } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaInventory.saveAltaPieza(event)" class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">SKU / Modelo Base</label>
          <select name="sku_ref" id="altaSkuSelect" required onchange="MartelaInventory.onAltaSkuChange(this.value)">
            ${db.products_sku.map(p => `
              <option value="${p.sku}" ${p.sku === suggestedSku ? 'selected' : ''}>
                ${esc(p.sku)} — ${esc(p.descripcion)} (${p.quilataje})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Peso Bruto en Balanza (g)
            </label>
            <div class="relative">
              <input 
                name="peso_bruto_g" 
                id="altaPesoBruto" 
                type="number" 
                step="0.01" 
                min="0.01" 
                value="1.92" 
                required 
                oninput="document.getElementById('altaPesoNeto').value = this.value"
              />
              <span class="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">g</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Incluye etiquetas de seguridad</span>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Peso Neto de Oro Exacto (g)
            </label>
            <div class="relative">
              <input 
                name="peso_neto_g" 
                id="altaPesoNeto" 
                type="number" 
                step="0.01" 
                min="0.01" 
                value="1.90" 
                required 
              />
              <span class="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">g</span>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Debe ser menor o igual al bruto</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Almacén Destino</label>
            <select name="almacen_id" required>
              ${db.warehouses.filter(w => w.id !== 'TALLER_FUNDICION').map(w => `
                <option value="${w.id}">${esc(w.nombre)}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Estatus Inicial</label>
            <select name="estatus">
              <option value="DISPONIBLE">Disponible para venta</option>
              <option value="EXHIBICION">Exhibición en mostrador</option>
            </select>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
          <b>Regla de Oro:</b> El sistema asignará un identificador serial automático único y sumará el peso neto a la valuación teórica de la bóveda.
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Guardar Pieza Física</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal('Registrar Nueva Pieza Física en Báscula', html, 'max-w-xl');
  }

  async function saveAltaPieza(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const pieceData = {
      sku_ref: formData.get('sku_ref'),
      peso_bruto_g: parseFloat(formData.get('peso_bruto_g')),
      peso_neto_g: parseFloat(formData.get('peso_neto_g')),
      almacen_id: formData.get('almacen_id'),
      estatus: formData.get('estatus')
    };

    try {
      const piece = await window.apiFacade.createPhysicalPiece(pieceData);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Pieza ${piece.piece_id} registrada con éxito (${piece.peso_neto_g}g)`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  // Modal de Transferencia entre Almacenes
  function openModalTransfer(pieceId) {
    const db = window.apiFacade._getDB();
    const piece = db.inventory_pieces.find(p => p.piece_id === pieceId);
    if (!piece) return;

    const { esc, grams } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaInventory.saveTransfer(event, '${pieceId}')" class="space-y-4">
        <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs space-y-1">
          <div>ID Pieza: <b class="font-mono text-amber-600 dark:text-amber-400">${esc(piece.piece_id)}</b></div>
          <div>SKU: <b>${esc(piece.sku_ref)}</b></div>
          <div>Peso Neto: <b>${grams(piece.peso_neto_g)}</b></div>
          <div>Ubicación Actual: <b>${esc(piece.almacen_id)}</b></div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Almacén Destino</label>
          <select name="targetWarehouseId" required>
            ${db.warehouses.filter(w => w.id !== piece.almacen_id).map(w => `
              <option value="${w.id}">${esc(w.nombre)}</option>
            `).join('')}
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Confirmar Transferencia</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal(`Transferir Pieza ${pieceId}`, html, 'max-w-md');
  }

  async function saveTransfer(e, pieceId) {
    e.preventDefault();
    const target = new FormData(e.target).get('targetWarehouseId');
    try {
      await window.apiFacade.transferPiece(pieceId, target);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Pieza ${pieceId} transferida a ${target}`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function exportExcel() {
    const db = window.apiFacade._getDB();
    const rows = db.inventory_pieces.map(p => {
      const prod = db.products_sku.find(x => x.sku === p.sku_ref) || {};
      return {
        'ID Pieza': p.piece_id,
        'SKU': p.sku_ref,
        'Descripción': prod.descripcion || '',
        'Metal': prod.tipo_metal || '',
        'Quilataje': prod.quilataje || '',
        'Peso Bruto (g)': p.peso_bruto_g,
        'Peso Neto (g)': p.peso_neto_g,
        'Almacén': p.almacen_id,
        'Estatus': p.estatus,
        'Fecha Ingreso': p.fecha_ingreso,
        'Pedido Relacionado': p.order_id || 'N/A'
      };
    });

    window.MartelaUI.exportToExcel(rows, `martela-inventario-piezas-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Inventario');
  }

  return {
    render,
    toggleSubTable,
    onSearch,
    onFilterAlmacen,
    onFilterQuilataje,
    onFilterEstatus,
    openModalAlta,
    saveAltaPieza,
    openModalTransfer,
    saveTransfer,
    exportExcel
  };
})();
