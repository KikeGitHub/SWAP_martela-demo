/**
/**
 * MARTELA — Módulo: Facturación Electrónica y Cuentas por Cobrar (CFDI 4.0 Suite)
 * Diseñado a la medida para joyería fina superando las limitantes de ASPEL-SAE:
 * - Facturación con 1 clic de pedidos B2B conciliados (ej. Coppel con 438 piezas por serial)
 * - Facturación directa/mostrador con cálculo dinámico por gramaje y FIX del oro
 * - Timbrado CFDI 4.0 simulado con generación y descarga real de archivos XML y PDF membretado
 * - Control de Cuentas por Cobrar (CxC), vencimientos y Complementos de Recepción de Pagos (REP)
 * - Notas de Crédito (Tipo E) con opción de canalizar devoluciones a taller de fundición
 * - Catálogo fiscal de clientes con validaciones SAT (RFC, Régimen, CP, Uso CFDI)
 */
window.MartelaBilling = (function() {
  let activeTab = 'invoices'; // 'invoices', 'new_invoice', 'cxc', 'credit_notes', 'clients'
  let filterSearch = '';
  let filterEstatusSat = '';
  let filterEstatusPago = '';

  // Estado temporal para asistente de nueva factura
  let newInvMode = 'order'; // 'order' | 'direct'
  let directItems = [];

  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const db = window.apiFacade._getDB();
    const invoices = await window.apiFacade.getInvoices();
    const cxcSummary = await window.apiFacade.getCxCSummary();
    const orders = await window.apiFacade.getCoppelOrders();
    const clients = await window.apiFacade.getClients();
    const payments = await window.apiFacade.getPayments();
    const creditNotes = await window.apiFacade.getCreditNotes();
    const { money, esc } = window.MartelaUI;

    const eligibleOrders = orders.filter(o => o.piezas_asignadas > 0 && !invoices.some(i => i.order_id === o.order_id && i.estatus_sat === 'VIGENTE'));
    const totalFacturadoVigente = invoices.filter(i => i.estatus_sat === 'VIGENTE').reduce((s, i) => s + i.total, 0);

    container.innerHTML = `
      <!-- Encabezado Principal -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1 flex items-center gap-1.5">
            <span>⚖</span> Facturación Electrónica CFDI 4.0 & Cobranza
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Facturación y Cuentas por Cobrar</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión comercial integral inspirada en ASPEL-SAE, potenciada con trazabilidad por gramaje y timbrado SAT.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="MartelaBilling.exportInvoicesExcel()" class="btn btn-soft text-xs py-2">
            <span>⇩</span> Exportar Excel
          </button>
          <button onclick="MartelaBilling.switchTab('new_invoice')" class="btn btn-gold text-xs py-2 shadow-lg shadow-amber-500/10">
            <span>⚡</span> + Nueva Factura CFDI
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas de Negocio -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="panel p-4 border-l-4 border-amber-500">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Facturación Vigente</div>
          <div class="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">${money(totalFacturadoVigente)}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${invoices.filter(i => i.estatus_sat === 'VIGENTE').length} CFDI timbrados activos</div>
        </div>

        <div class="panel p-4 border-l-4 border-blue-500">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Cuentas por Cobrar (CxC)</div>
          <div class="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">${money(cxcSummary.total_por_cobrar)}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${cxcSummary.facturas_pendientes_count} facturas con saldo</div>
        </div>

        <div class="panel p-4 border-l-4 ${cxcSummary.total_vencido > 0 ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20' : 'border-emerald-500'}">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Cartera Vencida</div>
          <div class="text-xl md:text-2xl font-black ${cxcSummary.total_vencido > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'} font-mono mt-1">${money(cxcSummary.total_vencido)}</div>
          <div class="text-[10px] text-slate-500 mt-0.5">${cxcSummary.total_vencido > 0 ? 'Requiere gestión de cobro' : 'Cartera 100% al corriente'}</div>
        </div>

        <div class="panel p-4 border-l-4 border-purple-500">
          <div class="text-[11px] text-slate-400 uppercase font-semibold">Pedidos Listos para Facturar</div>
          <div class="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">${eligibleOrders.length} pedidos</div>
          <div class="text-[10px] text-slate-500 mt-0.5">Empaque y seriales conciliados</div>
        </div>
      </div>

      <!-- Barra de Navegación por Pestañas -->
      <div class="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto text-xs font-bold">
        <button onclick="MartelaBilling.switchTab('invoices')" class="py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'invoices' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
          <span>📑</span> Facturas Emitidas (${invoices.length})
        </button>
        <button onclick="MartelaBilling.switchTab('new_invoice')" class="py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'new_invoice' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
          <span>⚡</span> Asistente Nueva Factura ${eligibleOrders.length > 0 ? `<span class="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">${eligibleOrders.length}</span>` : ''}
        </button>
        <button onclick="MartelaBilling.switchTab('cxc')" class="py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'cxc' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
          <span>💳</span> Cuentas por Cobrar & Pagos (REP)
        </button>
        <button onclick="MartelaBilling.switchTab('credit_notes')" class="py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'credit_notes' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
          <span>🔄</span> Notas de Crédito (${creditNotes.length})
        </button>
        <button onclick="MartelaBilling.switchTab('clients')" class="py-3 px-4 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'clients' ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
          <span>👥</span> Catálogo Fiscal Clientes (${clients.length})
        </button>
      </div>

      <!-- Contenedor Dinámico de la Pestaña Activa -->
      <div id="billingTabContent"></div>
    `;

    // Renderizar pestaña activa
    const content = document.getElementById('billingTabContent');
    if (activeTab === 'invoices') renderTabInvoices(content, invoices, eligibleOrders);
    else if (activeTab === 'new_invoice') renderTabNewInvoice(content, eligibleOrders, clients);
    else if (activeTab === 'cxc') renderTabCxC(content, cxcSummary, payments);
    else if (activeTab === 'credit_notes') renderTabCreditNotes(content, creditNotes, invoices);
    else if (activeTab === 'clients') renderTabClients(content, clients);
  }

  function switchTab(tab) {
    activeTab = tab;
    render(document.getElementById('contentContainer'));
  }

  // ==========================================
  // PESTAÑA 1: FACTURAS EMITIDAS (HISTORIAL CFDI)
  // ==========================================
  function renderTabInvoices(content, invoices, eligibleOrders) {
    const { money, esc } = window.MartelaUI;

    // Filtrado en vivo
    let filtered = [...invoices];
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      filtered = filtered.filter(i => 
        i.id.toLowerCase().includes(q) || 
        i.cliente.toLowerCase().includes(q) || 
        (i.uuid && i.uuid.toLowerCase().includes(q)) || 
        (i.rfc && i.rfc.toLowerCase().includes(q))
      );
    }
    if (filterEstatusSat) {
      filtered = filtered.filter(i => i.estatus_sat === filterEstatusSat);
    }
    if (filterEstatusPago) {
      filtered = filtered.filter(i => i.estatus_pago === filterEstatusPago);
    }

    content.innerHTML = `
      <!-- Alerta de Pedidos Listos para Facturar si existen -->
      ${eligibleOrders.length > 0 ? `
        <div class="panel p-4 mb-6 border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <span>⚡</span> Pedido B2B Empacado y Listo para Timbrar CFDI
            </div>
            <div class="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              ${esc(eligibleOrders[0].cliente)} · Folio ${esc(eligibleOrders[0].order_id)} (${eligibleOrders[0].piezas_asignadas} piezas asignadas)
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Las piezas físicas ya fueron asignadas con número de serie y pesadas en báscula electrónica.
            </p>
          </div>
          <button onclick="MartelaBilling.switchTab('new_invoice')" class="btn btn-gold text-xs py-2 whitespace-nowrap">
            Emitir Factura CFDI 4.0 Ahora →
          </button>
        </div>
      ` : ''}

      <!-- Barra de Filtros -->
      <div class="panel p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          <div class="sm:col-span-2">
            <label class="block text-slate-400 font-semibold mb-1">Buscar por Folio, UUID, Cliente o RFC:</label>
            <input 
              type="text" 
              placeholder="Ej. FAC-2026-1041, Coppel, COP920..." 
              value="${esc(filterSearch)}" 
              oninput="MartelaBilling.handleFilterSearch(this.value)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
          </div>
          <div>
            <label class="block text-slate-400 font-semibold mb-1">Estatus Fiscal SAT:</label>
            <select 
              onchange="MartelaBilling.handleFilterSat(this.value)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="">Todos los estatus SAT</option>
              <option value="VIGENTE" ${filterEstatusSat === 'VIGENTE' ? 'selected' : ''}>VIGENTE</option>
              <option value="CANCELADA" ${filterEstatusSat === 'CANCELADA' ? 'selected' : ''}>CANCELADA</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 font-semibold mb-1">Estatus de Cobro:</label>
            <select 
              onchange="MartelaBilling.handleFilterPago(this.value)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="">Todos los pagos</option>
              <option value="PAGADA" ${filterEstatusPago === 'PAGADA' ? 'selected' : ''}>PAGADA (Total)</option>
              <option value="PARCIAL" ${filterEstatusPago === 'PARCIAL' ? 'selected' : ''}>PARCIAL (Con abonos)</option>
              <option value="PENDIENTE" ${filterEstatusPago === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE (Por cobrar)</option>
              <option value="VENCIDA" ${filterEstatusPago === 'VENCIDA' ? 'selected' : ''}>VENCIDA (Fuera de plazo)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla de Facturas -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Listado de Comprobantes Fiscales Digitales (CFDI 4.0)</span>
            <span class="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
              ${filtered.length} documentos
            </span>
          </h3>
          <span class="text-xs text-slate-400 hidden sm:inline">Emisor: MARTELA JOYERIA FINA (RFC: MAR880915XYZ)</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th class="p-3.5">Folio Fiscal / UUID</th>
                <th class="p-3.5">Receptor / RFC</th>
                <th class="p-3.5">Fecha</th>
                <th class="p-3.5 text-center">Tipo / Método</th>
                <th class="p-3.5 text-right">Total MXN</th>
                <th class="p-3.5 text-right">Saldo Pendiente</th>
                <th class="p-3.5 text-center">Estatus SAT</th>
                <th class="p-3.5 text-center">Cobranza</th>
                <th class="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="9" class="p-8 text-center text-slate-400">
                    No se encontraron comprobantes fiscales con los criterios seleccionados.
                  </td>
                </tr>
              ` : filtered.map(inv => {
                const isCancel = inv.estatus_sat === 'CANCELADA';
                const isPaid = inv.estatus_pago === 'PAGADA';
                const isOverdue = inv.estatus_pago === 'VENCIDA';
                return `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td class="p-3.5">
                      <div class="font-mono font-bold ${isCancel ? 'text-slate-400 line-through' : 'text-amber-600 dark:text-amber-400'}">
                        ${esc(inv.id)}
                      </div>
                      <div class="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title="${esc(inv.uuid)}">
                        ${esc(inv.uuid ? inv.uuid.slice(0, 18) + '...' : 'Sin UUID')}
                      </div>
                    </td>
                    <td class="p-3.5">
                      <div class="font-semibold text-slate-900 dark:text-white">${esc(inv.cliente)}</div>
                      <div class="font-mono text-[10px] text-slate-400">${esc(inv.rfc || 'XAXX010101000')}</div>
                    </td>
                    <td class="p-3.5">
                      <div class="font-mono text-slate-600 dark:text-slate-300">${esc(inv.fecha ? inv.fecha.slice(0, 10) : '')}</div>
                      <div class="text-[10px] text-slate-400">Vence: ${esc(inv.fecha_vencimiento || 'Inmediato')}</div>
                    </td>
                    <td class="p-3.5 text-center font-mono">
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        ${esc(inv.tipo_comprobante || 'I')} · ${esc(inv.metodo_pago || 'PUE')}
                      </span>
                    </td>
                    <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${money(inv.total)}
                      <div class="text-[10px] text-slate-400 font-normal">${inv.piezas_count || 0} pzs · ${inv.gramos_totales || 0}g</div>
                    </td>
                    <td class="p-3.5 text-right font-mono font-bold ${inv.saldo_pendiente > 0 ? (isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400') : 'text-slate-400'}">
                      ${money(inv.saldo_pendiente || 0)}
                    </td>
                    <td class="p-3.5 text-center">
                      ${isCancel ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20">
                          CANCELADA
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                          VIGENTE
                        </span>
                      `}
                    </td>
                    <td class="p-3.5 text-center">
                      ${isPaid ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                          PAGADA
                        </span>
                      ` : isOverdue ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                          VENCIDA
                        </span>
                      ` : inv.estatus_pago === 'PARCIAL' ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                          PARCIAL
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                          PENDIENTE
                        </span>
                      `}
                    </td>
                    <td class="p-3.5 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button onclick="MartelaBilling.verFactura('${inv.id}')" class="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400" title="Ver Representación Impresa / PDF">
                          👁️
                        </button>
                        <button onclick="MartelaBilling.downloadXML('${inv.id}')" class="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]" title="Descargar Archivo Fiscal XML CFDI 4.0">
                          XML
                        </button>
                        ${inv.saldo_pendiente > 0 && !isCancel ? `
                          <button onclick="MartelaBilling.openPaymentModal('${inv.id}')" class="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400" title="Registrar Cobro / Abono">
                            💳
                          </button>
                        ` : ''}
                        ${!isCancel ? `
                          <button onclick="MartelaBilling.openCancelModal('${inv.id}')" class="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500" title="Cancelar CFDI ante SAT">
                            ✕
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function handleFilterSearch(val) {
    filterSearch = val;
    renderTabInvoices(document.getElementById('billingTabContent'), window.apiFacade._getDB().invoices, []);
  }

  function handleFilterSat(val) {
    filterEstatusSat = val;
    renderTabInvoices(document.getElementById('billingTabContent'), window.apiFacade._getDB().invoices, []);
  }

  function handleFilterPago(val) {
    filterEstatusPago = val;
    renderTabInvoices(document.getElementById('billingTabContent'), window.apiFacade._getDB().invoices, []);
  }

  // ==========================================
  // PESTAÑA 2: ASISTENTE NUEVA FACTURA CFDI 4.0
  // ==========================================
  function renderTabNewInvoice(content, eligibleOrders, clients) {
    const db = window.apiFacade._getDB();
    const rates = db.metal_rates;
    const { money, esc } = window.MartelaUI;

    content.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Selector de Modo de Facturación -->
        <div class="panel p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seleccione la Modalidad de Facturación:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onclick="MartelaBilling.setNewInvoiceMode('order')" class="p-4 rounded-xl border text-left transition ${newInvMode === 'order' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}">
              <div class="text-sm font-bold flex items-center gap-2">
                <span>📦</span> Modo A: A partir de Pedido B2B Conciliado
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Genera el CFDI 4.0 directamente de los pedidos de 26 cajas de Coppel con sus números de serie y pesos reales.
              </p>
            </button>

            <button onclick="MartelaBilling.setNewInvoiceMode('direct')" class="p-4 rounded-xl border text-left transition ${newInvMode === 'direct' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}">
              <div class="text-sm font-bold flex items-center gap-2">
                <span>⚡</span> Modo B: Facturación Libre / Mostrador Mayorista
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecciona cliente, agrega partidas por SKU o por báscula, define condiciones y timbra en vivo.
              </p>
            </button>
          </div>
        </div>

        ${newInvMode === 'order' ? `
          <!-- MODO A: Facturación de Pedidos B2B -->
          <div class="panel p-6 space-y-6">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="text-amber-500">◈</span> Pedidos Listos para Facturar
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                El sistema extrae el gramaje neto real acumulado de cada pieza asignada con su código serial individual.
              </p>
            </div>

            ${eligibleOrders.length === 0 ? `
              <div class="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>✓ Todos los pedidos B2B actuales ya cuentan con factura emitida.</div>
                <div class="text-xs text-slate-500 mt-2">Puedes emitir facturas directas en la pestaña "Modo B" o asignar piezas a un nuevo pedido en el módulo Coppel.</div>
              </div>
            ` : `
              <div class="space-y-4">
                ${eligibleOrders.map(o => `
                  <div class="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">${esc(o.order_id)}</span>
                        <span class="text-sm font-bold text-slate-900 dark:text-white ml-2">${esc(o.cliente)}</span>
                      </div>
                      <div class="text-xs text-slate-500">
                        Entrega programada: <b>${esc(o.fecha_entrega)}</b>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div class="text-slate-400">Piezas Amparadas:</div>
                        <div class="font-bold text-slate-900 dark:text-white text-sm font-mono">${o.piezas_asignadas} de ${o.total_piezas} piezas</div>
                      </div>
                      <div>
                        <div class="text-slate-400">Sucursales / Cajas:</div>
                        <div class="font-bold text-slate-900 dark:text-white text-sm font-mono">${o.sucursales ? o.sucursales.length : 26} CEDIS</div>
                      </div>
                      <div>
                        <div class="text-slate-400">Cotización FIX Aplicada:</div>
                        <div class="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono">$${Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd).toLocaleString()} USD</div>
                      </div>
                      <div>
                        <div class="text-slate-400">Condición Fiscal:</div>
                        <div class="font-bold text-slate-900 dark:text-white text-sm">PPD · 30 días crédito</div>
                      </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                      <button onclick="MartelaBilling.generateInvoiceFromOrder('${o.order_id}')" class="btn btn-gold text-xs py-2">
                        ⚡ Emitir y Timbrar CFDI 4.0 (${o.piezas_asignadas} pzs)
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : `
          <!-- MODO B: Facturación Libre / Mostrador Directo -->
          <div class="panel p-6 space-y-6">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span class="text-amber-500">◈</span> Nueva Factura Directa (Venta Mostrador / Mayorista)
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Emisión de comprobante fiscal digital seleccionando cliente, partidas, gramajes y método de pago.
              </p>
            </div>

            <!-- Datos del Cliente y Condiciones -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-400 mb-1">Cliente Fiscal Receptor:</label>
                <select id="directClienteId" onchange="MartelaBilling.handleDirectClientChange(this.value)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold outline-none">
                  ${clients.map(c => `
                    <option value="${c.id}">${esc(c.nombre)} (${esc(c.rfc)})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-400 mb-1">Método de Pago:</label>
                <select id="directMetodoPago" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
                  <option value="PUE">PUE - Pago en una sola exhibición (Contado)</option>
                  <option value="PPD">PPD - Pago en parcialidades o diferido (Crédito)</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-400 mb-1">Forma de Pago SAT:</label>
                <select id="directFormaPago" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
                  <option value="03">03 - Transferencia electrónica (SPEI)</option>
                  <option value="01">01 - Efectivo</option>
                  <option value="02">02 - Cheque nominativo</option>
                  <option value="17">17 - Compensación (Oro Fino Maquila)</option>
                  <option value="99">99 - Por definir (Para PPD)</option>
                </select>
              </div>
            </div>

            <!-- Fila para agregar partidas -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div class="text-xs font-bold text-slate-700 dark:text-slate-300">Agregar Concepto de Joyería:</div>
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div class="sm:col-span-2">
                  <label class="block text-slate-400 mb-1">Modelo / SKU:</label>
                  <select id="partidaSkuSelect" onchange="MartelaBilling.handlePartidaSkuChange(this.value)" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
                    ${db.products_sku.map(p => `
                      <option value="${p.sku}">${p.sku} - ${esc(p.descripcion)} (${p.quilataje})</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Cantidad:</label>
                  <input type="number" id="partidaCantidad" min="1" value="1" oninput="MartelaBilling.recalcPartida()" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-center font-bold">
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Peso Neto Est. (g):</label>
                  <input type="number" id="partidaPeso" step="0.01" value="2.50" oninput="MartelaBilling.recalcPartida()" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-right font-mono">
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Precio Unitario (MXN):</label>
                  <input type="number" id="partidaPrecioUnit" step="0.01" value="3200.00" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                </div>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" onclick="MartelaBilling.addDirectPartida()" class="btn btn-soft text-xs py-1.5">
                  + Agregar Partida
                </button>
              </div>
            </div>

            <!-- Tabla de Partidas Cargadas -->
            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table class="w-full text-xs text-left">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                  <tr>
                    <th class="p-3">Clave / SKU</th>
                    <th class="p-3">Descripción</th>
                    <th class="p-3 text-center">Cant.</th>
                    <th class="p-3 text-right">Peso (g)</th>
                    <th class="p-3 text-right">P. Unitario</th>
                    <th class="p-3 text-right">Importe</th>
                    <th class="p-3 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody id="directPartidasTbody" class="divide-y divide-slate-100 dark:divide-slate-800">
                  <!-- Inyectado dinámicamente -->
                </tbody>
              </table>
            </div>

            <!-- Resumen de Totales y Botón de Emisión -->
            <div class="flex flex-col sm:flex-row justify-between items-end gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <div class="text-xs text-slate-400 space-y-1">
                <div>Clave SAT automática: <b>54111601 (Joyería de oro)</b> · Unidad: <b>H87 (Pieza)</b></div>
                <div>Régimen Emisor: <b>601 General de Ley Personas Morales</b></div>
              </div>
              <div class="w-full sm:w-72 space-y-2 text-xs">
                <div class="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span id="directSubtotalLabel" class="font-mono font-bold">$0.00</span>
                </div>
                <div class="flex justify-between text-slate-500">
                  <span>IVA Trasladado (16%):</span>
                  <span id="directIvaLabel" class="font-mono font-bold">$0.00</span>
                </div>
                <div class="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Factura:</span>
                  <span id="directTotalLabel" class="font-mono text-xl text-amber-600 dark:text-amber-400">$0.00</span>
                </div>
                <button type="button" onclick="MartelaBilling.emitirFacturaDirecta()" class="w-full btn btn-gold py-2.5 text-xs font-bold shadow-lg shadow-amber-500/10 mt-3">
                  ⚡ Timbrar Factura CFDI 4.0
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    if (newInvMode === 'direct') {
      // Agregar partida default si está vacía
      if (directItems.length === 0) {
        directItems.push({
          sku: "ANILLO-SOL-10K",
          descripcion: "Anillo Solitario de Oro Amarillo 10K",
          cantidad: 2,
          peso_neto_g: 3.70,
          valor_unitario: 3100.00,
          importe: 6200.00
        });
      }
      renderDirectTable();
    }
  }

  function setNewInvoiceMode(mode) {
    newInvMode = mode;
    renderTabNewInvoice(document.getElementById('billingTabContent'), window.apiFacade._getDB().coppel_orders.filter(o => o.piezas_asignadas > 0), window.apiFacade._getDB().clients);
  }

  function handlePartidaSkuChange(sku) {
    const db = window.apiFacade._getDB();
    const prod = db.products_sku.find(p => p.sku === sku);
    if (!prod) return;
    const rates = db.metal_rates;
    const fix = Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd);
    const precioGramoFino = (fix * rates.tipo_cambio_usd_mxn) / 31.1035;
    const pureza = rates.coeficientes[prod.quilataje || '10K'] || 0.4167;

    const pesoEst = prod.quilataje === '18K' ? 4.5 : prod.quilataje === '14K' ? 3.8 : 2.5;
    const costoMetal = pesoEst * precioGramoFino * pureza;
    const precioSugerido = +(costoMetal + prod.costo_hechura_base * 1.35).toFixed(2);

    document.getElementById('partidaPeso').value = pesoEst;
    document.getElementById('partidaPrecioUnit').value = precioSugerido;
  }

  function recalcPartida() {
    // Calculador auxiliar si se desea
  }

  function addDirectPartida() {
    const sku = document.getElementById('partidaSkuSelect').value;
    const db = window.apiFacade._getDB();
    const prod = db.products_sku.find(p => p.sku === sku);
    const cant = parseInt(document.getElementById('partidaCantidad').value) || 1;
    const peso = parseFloat(document.getElementById('partidaPeso').value) || 1;
    const vu = parseFloat(document.getElementById('partidaPrecioUnit').value) || 1000;
    const imp = +(cant * vu).toFixed(2);

    directItems.push({
      sku: sku,
      descripcion: prod ? prod.descripcion : sku,
      cantidad: cant,
      peso_neto_g: +(peso * cant).toFixed(2),
      valor_unitario: vu,
      importe: imp
    });

    renderDirectTable();
    window.MartelaUI.toast(`Partida agregada: ${cant}x ${sku}`, 'info');
  }

  function removeDirectPartida(idx) {
    directItems.splice(idx, 1);
    renderDirectTable();
  }

  function renderDirectTable() {
    const tbody = document.getElementById('directPartidasTbody');
    if (!tbody) return;

    const { money, esc } = window.MartelaUI;
    let subtotal = 0;

    tbody.innerHTML = directItems.map((item, idx) => {
      subtotal += item.importe;
      return `
        <tr>
          <td class="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">${esc(item.sku)}</td>
          <td class="p-3 text-slate-800 dark:text-slate-200">${esc(item.descripcion)}</td>
          <td class="p-3 text-center font-bold font-mono">${item.cantidad}</td>
          <td class="p-3 text-right font-mono text-slate-500">${item.peso_neto_g}g</td>
          <td class="p-3 text-right font-mono text-slate-500">${money(item.valor_unitario)}</td>
          <td class="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${money(item.importe)}</td>
          <td class="p-3 text-center">
            <button onclick="MartelaBilling.removeDirectPartida(${idx})" class="text-rose-500 hover:text-rose-700 font-bold p-1">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    const iva = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);

    document.getElementById('directSubtotalLabel').innerText = money(subtotal);
    document.getElementById('directIvaLabel').innerText = money(iva);
    document.getElementById('directTotalLabel').innerText = money(total);
  }

  async function emitirFacturaDirecta() {
    if (directItems.length === 0) {
      window.MartelaUI.toast("Debe incluir al menos una partida de joyería", "error");
      return;
    }

    const clienteId = document.getElementById('directClienteId').value;
    const metodoPago = document.getElementById('directMetodoPago').value;
    const formaPago = document.getElementById('directFormaPago').value;

    try {
      const inv = await window.apiFacade.createInvoiceDirect({
        cliente_id: clienteId,
        metodo_pago: metodoPago,
        forma_pago: formaPago,
        partidas: directItems
      });

      directItems = [];
      window.MartelaUI.toast(`¡Factura ${inv.id} timbrada exitosamente con UUID ${inv.uuid.slice(0, 8)}...!`, 'success');
      activeTab = 'invoices';
      render(document.getElementById('contentContainer'));
      verFactura(inv.id);
    } catch (e) {
      window.MartelaUI.toast(e.message, 'error');
    }
  }

  async function generateInvoiceFromOrder(orderId) {
    try {
      const inv = await window.apiFacade.generateInvoiceForOrder(orderId);
      window.MartelaUI.toast(`Factura CFDI 4.0 ${inv.id} emitida exitosamente para pedido ${orderId}`, 'success');
      activeTab = 'invoices';
      render(document.getElementById('contentContainer'));
      verFactura(inv.id);
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  // ==========================================
  // PESTAÑA 3: CUENTAS POR COBRAR (CxC) & REP
  // ==========================================
  function renderTabCxC(content, cxcSummary, payments) {
    const { money, esc } = window.MartelaUI;

    content.innerHTML = `
      <div class="space-y-6">
        
        <!-- Semáforo de Cartera -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="panel p-5 bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30">
            <div class="text-xs text-blue-400 font-bold uppercase tracking-wider">Cartera Total por Cobrar</div>
            <div class="text-3xl font-black text-white font-mono mt-1">${money(cxcSummary.total_por_cobrar)}</div>
            <div class="text-xs text-slate-400 mt-1">${cxcSummary.facturas_pendientes_count} facturas con saldo comercial pendiente</div>
          </div>

          <div class="panel p-5 bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/30">
            <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cartera al Corriente (Vigente)</div>
            <div class="text-3xl font-black text-white font-mono mt-1">${money(cxcSummary.total_corriente)}</div>
            <div class="text-xs text-slate-400 mt-1">Dentro del plazo de crédito pactado</div>
          </div>

          <div class="panel p-5 bg-gradient-to-br from-rose-900/20 to-slate-900 border border-rose-500/30">
            <div class="text-xs text-rose-400 font-bold uppercase tracking-wider">Cartera Vencida</div>
            <div class="text-3xl font-black text-rose-400 font-mono mt-1">${money(cxcSummary.total_vencido)}</div>
            <div class="text-xs text-slate-400 mt-1">${cxcSummary.total_vencido > 0 ? 'Prioridad en cobranza telefónica' : 'Sin saldos vencidos'}</div>
          </div>
        </div>

        <!-- Estado de Cuenta por Cliente -->
        <div class="panel overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Estado de Cuenta y Límites de Crédito por Cliente</h3>
          </div>
          <div class="p-6 space-y-4">
            ${cxcSummary.clientes_cartera.map(c => {
              const pctUsado = Math.min(100, Math.round((c.saldo_total / c.limite_credito) * 100));
              return `
                <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span class="font-bold text-sm text-slate-900 dark:text-white">${esc(c.cliente)}</span>
                      <span class="font-mono text-xs text-slate-400 ml-2">RFC: ${esc(c.rfc)}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-xs text-slate-400">Saldo Pendiente:</span>
                      <span class="font-bold text-base text-blue-600 dark:text-blue-400 font-mono ml-1">${money(c.saldo_total)}</span>
                      ${c.saldo_vencido > 0 ? `
                        <span class="text-xs font-bold text-rose-500 font-mono ml-2">(${money(c.saldo_vencido)} vencido)</span>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Barra de crédito -->
                  <div>
                    <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Límite de crédito: <b>${money(c.limite_credito)}</b></span>
                      <span>Crédito utilizado: <b>${pctUsado}%</b></span>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div class="h-full ${pctUsado > 80 ? 'bg-rose-500' : 'bg-amber-500'}" style="width: ${pctUsado}%"></div>
                    </div>
                  </div>

                  <!-- Facturas pendientes de este cliente -->
                  <div class="border-t border-slate-200 dark:border-slate-700/60 pt-2 flex flex-wrap gap-2 items-center justify-between text-xs">
                    <div class="text-slate-500">
                      ${c.facturas.length} factura(s) con saldo pendiente
                    </div>
                    <div class="flex gap-2">
                      ${c.facturas.map(f => `
                        <button onclick="MartelaBilling.openPaymentModal('${f.id}')" class="btn btn-soft text-[11px] py-1">
                          Abonar a ${esc(f.id)} (${money(f.saldo_pendiente)}) →
                        </button>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Historial de Complementos de Pago (REP - CFDI 4.0 Tipo P) -->
        <div class="panel overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Recibos Electrónicos de Pago Emitidos (CFDI 4.0 Tipo P)</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                ${payments.length} recibos
              </span>
            </h3>
            <span class="text-xs text-slate-400">Timbrado automático al registrar cobranza</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                <tr>
                  <th class="p-3.5">Folio REP / UUID</th>
                  <th class="p-3.5">Factura Relacionada</th>
                  <th class="p-3.5">Cliente</th>
                  <th class="p-3.5">Fecha Pago</th>
                  <th class="p-3.5">Forma Pago / Ref</th>
                  <th class="p-3.5 text-right">Monto Pagado</th>
                  <th class="p-3.5 text-right">Saldo Insoluto</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${payments.map(p => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3.5 font-mono">
                      <div class="font-bold text-purple-600 dark:text-purple-400">${esc(p.id)}</div>
                      <div class="text-[10px] text-slate-400 truncate max-w-[120px]">${esc(p.uuid ? p.uuid.slice(0, 16) + '...' : '')}</div>
                    </td>
                    <td class="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ${esc(p.factura_id)}
                      <div class="text-[10px] text-slate-400">Parcialidad #${p.num_parcialidad}</div>
                    </td>
                    <td class="p-3.5">
                      <div class="font-semibold text-slate-900 dark:text-white">${esc(p.cliente)}</div>
                      <div class="font-mono text-[10px] text-slate-400">${esc(p.rfc)}</div>
                    </td>
                    <td class="p-3.5 font-mono text-slate-500">${esc(p.fecha ? p.fecha.slice(0, 10) : '')}</td>
                    <td class="p-3.5">
                      <div>${esc(p.forma_pago_desc)}</div>
                      <div class="font-mono text-[10px] text-slate-400">${esc(p.numero_operacion)}</div>
                    </td>
                    <td class="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${money(p.monto)}
                    </td>
                    <td class="p-3.5 text-right font-mono text-slate-500">
                      ${money(p.saldo_insoluto)}
                    </td>
                    <td class="p-3.5 text-center">
                      <button onclick="MartelaBilling.downloadREPXML('${p.id}')" class="btn btn-soft text-[10px] py-1 font-mono font-bold">
                        Descargar XML REP
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function openPaymentModal(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const { money, esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs">
        <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
          <div class="flex justify-between">
            <span class="text-slate-400">Factura a liquidar:</span>
            <span class="font-mono font-bold text-amber-600 dark:text-amber-400">${esc(inv.id)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Cliente:</span>
            <span class="font-bold text-slate-900 dark:text-white">${esc(inv.cliente)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Saldo insoluto actual:</span>
            <span class="font-mono font-bold text-base text-blue-600 dark:text-blue-400">${money(inv.saldo_pendiente)}</span>
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Monto a Abonar (MXN):</label>
          <div class="flex gap-2">
            <input type="number" id="pagoMontoInput" step="0.01" max="${inv.saldo_pendiente}" value="${inv.saldo_pendiente}" class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-lg outline-none text-right text-emerald-600">
            <button onclick="document.getElementById('pagoMontoInput').value='${inv.saldo_pendiente}'" class="btn btn-soft text-xs py-2">
              Liquidar Todo
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Forma de Pago:</label>
            <select id="pagoFormaSelect" onchange="MartelaBilling.handleFormaPagoChange(this.value)" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
              <option value="03">03 - Transferencia SPEI</option>
              <option value="01">01 - Efectivo</option>
              <option value="02">02 - Cheque nominativo</option>
              <option value="17">17 - Compensación (Oro fino maquila)</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">No. Operación / Ref:</label>
            <input type="text" id="pagoRefInput" value="SPEI-${Date.now().toString().slice(-7)}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono outline-none">
          </div>
        </div>

        <div id="compensacionOroDiv" class="hidden p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-500/30">
          <div class="text-[11px] font-bold text-amber-700 dark:text-amber-400">Compensación en Oro Fino (24K):</div>
          <div class="text-[10px] text-slate-500 mt-0.5">Se deducirá el gramaje equivalente del saldo en bóveda a favor del cliente.</div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button onclick="MartelaBilling.submitPayment('${inv.id}')" class="btn btn-gold">
            Aplicar Pago y Timbrar REP →
          </button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal(`Registrar Cobranza · Factura ${inv.id}`, html, 'max-w-md');
  }

  function handleFormaPagoChange(val) {
    const div = document.getElementById('compensacionOroDiv');
    if (div) {
      if (val === '17') div.classList.remove('hidden');
      else div.classList.add('hidden');
    }
  }

  async function submitPayment(invoiceId) {
    const monto = document.getElementById('pagoMontoInput').value;
    const forma = document.getElementById('pagoFormaSelect').value;
    const ref = document.getElementById('pagoRefInput').value;

    try {
      const pag = await window.apiFacade.registerPayment({
        factura_id: invoiceId,
        monto: monto,
        forma_pago: forma,
        numero_operacion: ref
      });

      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`¡Pago registrado exitosamente! Se emitió el Complemento de Pago ${pag.id}`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (e) {
      window.MartelaUI.toast(e.message, 'error');
    }
  }

  // ==========================================
  // PESTAÑA 4: NOTAS DE CRÉDITO (CFDI TIPO E)
  // ==========================================
  function renderTabCreditNotes(content, creditNotes, invoices) {
    const { money, esc } = window.MartelaUI;

    content.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Notas de Crédito Emitidas (CFDI 4.0 Egreso)</h3>
            <p class="text-xs text-slate-500">Documentan devoluciones de producto dañado, bonificaciones o ajustes comerciales.</p>
          </div>
          <button onclick="MartelaBilling.openNewCreditNoteModal()" class="btn btn-gold text-xs py-2">
            + Emitir Nota de Crédito
          </button>
        </div>

        <div class="panel overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                <tr>
                  <th class="p-3.5">Folio NC / UUID</th>
                  <th class="p-3.5">Factura Relacionada</th>
                  <th class="p-3.5">Cliente</th>
                  <th class="p-3.5">Fecha</th>
                  <th class="p-3.5">Motivo de Emisión</th>
                  <th class="p-3.5 text-right">Subtotal</th>
                  <th class="p-3.5 text-right">IVA (16%)</th>
                  <th class="p-3.5 text-right">Total MXN</th>
                  <th class="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${creditNotes.length === 0 ? `
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400">
                      No se han emitido notas de crédito aún.
                    </td>
                  </tr>
                ` : creditNotes.map(nc => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3.5 font-mono">
                      <div class="font-bold text-amber-600 dark:text-amber-400">${esc(nc.id)}</div>
                      <div class="text-[10px] text-slate-400 truncate max-w-[130px]">${esc(nc.uuid ? nc.uuid.slice(0, 16) + '...' : '')}</div>
                    </td>
                    <td class="p-3.5 font-mono font-bold text-slate-900 dark:text-white">${esc(nc.factura_id)}</td>
                    <td class="p-3.5">${esc(nc.cliente)}</td>
                    <td class="p-3.5 font-mono text-slate-500">${esc(nc.fecha ? nc.fecha.slice(0, 10) : '')}</td>
                    <td class="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">${esc(nc.motivo)}</td>
                    <td class="p-3.5 text-right font-mono">${money(nc.subtotal)}</td>
                    <td class="p-3.5 text-right font-mono">${money(nc.impuesto_iva)}</td>
                    <td class="p-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">${money(nc.total)}</td>
                    <td class="p-3.5 text-center">
                      <button onclick="MartelaBilling.downloadNCXML('${nc.id}')" class="btn btn-soft text-[10px] py-1 font-mono">
                        Descargar XML NC
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function openNewCreditNoteModal() {
    const db = window.apiFacade._getDB();
    const invoices = db.invoices.filter(i => i.estatus_sat === 'VIGENTE');
    const { esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-400 mb-1">Factura Origen Relacionada (TipoRelacion 01):</label>
          <select id="ncFacturaSelect" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono outline-none">
            ${invoices.map(i => `
              <option value="${i.id}">${i.id} - ${esc(i.cliente)} (Total: $${i.total.toLocaleString()} MXN)</option>
            `).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Importe Subtotal a Bonificar (MXN):</label>
            <input type="number" id="ncSubtotalInput" value="4000.00" step="0.01" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-right outline-none">
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Tipo de Relación SAT:</label>
            <input type="text" value="01 - Nota de crédito de doc. relacionados" disabled class="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-400">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Motivo Comercial de la Nota de Crédito:</label>
          <textarea id="ncMotivoInput" rows="2" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none" placeholder="Ej. Devolución de esclava con defecto de broche"></textarea>
        </div>

        <div class="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-500/20 space-y-2">
          <label class="flex items-center gap-2 cursor-pointer font-bold text-purple-700 dark:text-purple-300">
            <input type="checkbox" id="ncCanalizarFundicion" checked class="rounded text-amber-500 focus:ring-amber-500">
            <span>Canalizar piezas devueltas al Taller de Fundición y Mermas</span>
          </label>
          <div class="flex items-center gap-2">
            <span class="text-slate-400">Peso en gramos a remitir al crisol:</span>
            <input type="number" id="ncPesoFundicion" value="5.20" step="0.01" class="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-right font-mono">
            <span>gramos</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button onclick="MartelaBilling.submitCreditNote()" class="btn btn-gold">
            Emitir y Timbrar Nota de Crédito →
          </button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal("Emitir Nota de Crédito (CFDI 4.0 Egreso)", html, "max-w-lg");
  }

  async function submitCreditNote() {
    const facturaId = document.getElementById('ncFacturaSelect').value;
    const subtotal = document.getElementById('ncSubtotalInput').value;
    const motivo = document.getElementById('ncMotivoInput').value;
    const canalizar = document.getElementById('ncCanalizarFundicion').checked;
    const peso = document.getElementById('ncPesoFundicion').value;

    try {
      const nc = await window.apiFacade.createCreditNote({
        factura_id: facturaId,
        subtotal: subtotal,
        motivo: motivo,
        canalizar_a_fundicion: canalizar,
        peso_g: peso
      });

      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Nota de crédito ${nc.id} emitida con éxito`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (e) {
      window.MartelaUI.toast(e.message, 'error');
    }
  }

  // ==========================================
  // PESTAÑA 5: CATÁLOGO FISCAL DE CLIENTES
  // ==========================================
  function renderTabClients(content, clients) {
    const { money, esc } = window.MartelaUI;

    content.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Directorio Fiscal SAT (Catálogo de Clientes)</h3>
            <p class="text-xs text-slate-500">Parámetros de facturación electrónica CFDI 4.0, plazos y condiciones de pago.</p>
          </div>
          <button onclick="MartelaBilling.openClientModal()" class="btn btn-gold text-xs py-2">
            + Nuevo Cliente Fiscal
          </button>
        </div>

        <div class="panel overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                <tr>
                  <th class="p-3.5">ID / RFC</th>
                  <th class="p-3.5">Razón Social</th>
                  <th class="p-3.5">Régimen SAT</th>
                  <th class="p-3.5">C.P. Fiscal</th>
                  <th class="p-3.5">Uso CFDI</th>
                  <th class="p-3.5">Días Crédito</th>
                  <th class="p-3.5 text-right">Límite Crédito</th>
                  <th class="p-3.5 text-right">Oro Maquila (g)</th>
                  <th class="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${clients.map(c => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3.5 font-mono">
                      <div class="font-bold text-amber-600 dark:text-amber-400">${esc(c.id)}</div>
                      <div class="text-[10px] text-slate-400 font-bold">${esc(c.rfc)}</div>
                    </td>
                    <td class="p-3.5">
                      <div class="font-bold text-slate-900 dark:text-white">${esc(c.razon_social || c.nombre)}</div>
                      <div class="text-[10px] text-slate-400">${esc(c.correo_facturacion || 'contacto@empresa.com')}</div>
                    </td>
                    <td class="p-3.5 font-mono">
                      <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800">${esc(c.regimen_fiscal || '601')}</span>
                    </td>
                    <td class="p-3.5 font-mono">${esc(c.cp_fiscal || '06000')}</td>
                    <td class="p-3.5 font-mono">${esc(c.uso_cfdi || 'G01')}</td>
                    <td class="p-3.5 font-semibold">${c.dias_credito || 0} días</td>
                    <td class="p-3.5 text-right font-mono font-bold">${money(c.limite_credito || 0)}</td>
                    <td class="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">${c.saldo_oro_fino_g ? c.saldo_oro_fino_g + 'g' : '—'}</td>
                    <td class="p-3.5 text-center">
                      <button onclick="MartelaBilling.openClientModal('${c.id}')" class="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                        Editar
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function openClientModal(clientId = null) {
    const db = window.apiFacade._getDB();
    const c = clientId ? db.clients.find(x => x.id === clientId) : {
      id: '',
      nombre: '',
      razon_social: '',
      rfc: '',
      regimen_fiscal: '601',
      cp_fiscal: '06000',
      uso_cfdi: 'G01',
      correo_facturacion: '',
      dias_credito: 15,
      limite_credito: 1000000
    };
    const { esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs">
        <input type="hidden" id="modalClientId" value="${esc(c.id)}">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Nombre Comercial:</label>
            <input type="text" id="modalCliNombre" value="${esc(c.nombre)}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none font-bold">
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">RFC Fiscal (SAT):</label>
            <input type="text" id="modalCliRfc" value="${esc(c.rfc)}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none font-mono uppercase font-bold">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Razón Social Completa (como en Constancia Fiscal):</label>
          <input type="text" id="modalCliRazon" value="${esc(c.razon_social || c.nombre)}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Régimen Fiscal:</label>
            <select id="modalCliRegimen" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
              <option value="601" ${c.regimen_fiscal === '601' ? 'selected' : ''}>601 General de Ley PM</option>
              <option value="612" ${c.regimen_fiscal === '612' ? 'selected' : ''}>612 Personas Físicas Act. Emp.</option>
              <option value="626" ${c.regimen_fiscal === '626' ? 'selected' : ''}>626 RESICO</option>
              <option value="603" ${c.regimen_fiscal === '603' ? 'selected' : ''}>603 Sin Fines Lucrativos</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">C.P. Domicilio Fiscal:</label>
            <input type="text" id="modalCliCp" value="${esc(c.cp_fiscal || '06000')}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none font-mono text-center">
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Uso de CFDI:</label>
            <select id="modalCliUso" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
              <option value="G01" ${c.uso_cfdi === 'G01' ? 'selected' : ''}>G01 Adquisición de mercancías</option>
              <option value="G03" ${c.uso_cfdi === 'G03' ? 'selected' : ''}>G03 Gastos en general</option>
              <option value="S01" ${c.uso_cfdi === 'S01' ? 'selected' : ''}>S01 Sin efectos fiscales</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Correo de Facturación:</label>
            <input type="email" id="modalCliCorreo" value="${esc(c.correo_facturacion || '')}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none">
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Días de Crédito:</label>
            <input type="number" id="modalCliDias" value="${c.dias_credito || 0}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-center">
          </div>
          <div>
            <label class="block font-semibold text-slate-400 mb-1">Límite de Crédito (MXN):</label>
            <input type="number" id="modalCliLimite" value="${c.limite_credito || 1000000}" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none text-right font-mono">
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button onclick="MartelaBilling.saveClientModal()" class="btn btn-gold">
            Guardar Cliente Fiscal
          </button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal(clientId ? "Editar Cliente Fiscal" : "Nuevo Cliente Fiscal SAT", html, "max-w-xl");
  }

  async function saveClientModal() {
    const id = document.getElementById('modalClientId').value;
    const nombre = document.getElementById('modalCliNombre').value;
    const rfc = document.getElementById('modalCliRfc').value;
    const razon = document.getElementById('modalCliRazon').value;
    const regimen = document.getElementById('modalCliRegimen').value;
    const cp = document.getElementById('modalCliCp').value;
    const uso = document.getElementById('modalCliUso').value;
    const correo = document.getElementById('modalCliCorreo').value;
    const dias = parseInt(document.getElementById('modalCliDias').value) || 0;
    const limite = parseFloat(document.getElementById('modalCliLimite').value) || 0;

    if (!nombre || !rfc) {
      window.MartelaUI.toast("Nombre y RFC son obligatorios", "error");
      return;
    }

    try {
      await window.apiFacade.saveClient({
        id: id || undefined,
        nombre: nombre,
        razon_social: razon || nombre,
        rfc: rfc.toUpperCase(),
        regimen_fiscal: regimen,
        cp_fiscal: cp,
        uso_cfdi: uso,
        correo_facturacion: correo,
        dias_credito: dias,
        limite_credito: limite,
        metodo_pago_defecto: dias > 0 ? 'PPD' : 'PUE',
        forma_pago_defecto: dias > 0 ? '99' : '03'
      });

      window.MartelaUI.closeModal();
      window.MartelaUI.toast("Cliente fiscal actualizado correctamente", "success");
      render(document.getElementById('contentContainer'));
    } catch (e) {
      window.MartelaUI.toast(e.message, 'error');
    }
  }

  // ==========================================
  // MODAL OFICIAL: REPRESENTACIÓN IMPRESA CFDI 4.0
  // ==========================================
  function verFactura(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const { money, esc, numeroALetras, generateQRCodeSVG } = window.MartelaUI;
    const qrUrl = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${inv.uuid}&re=MAR880915XYZ&rr=${inv.rfc}&tt=${inv.total.toFixed(2)}&fe=${(inv.sello_cfd || '').slice(-8)}`;
    const qrSvg = generateQRCodeSVG(qrUrl, 115);
    const importeLetras = numeroALetras(inv.total);

    const html = `
      <div id="printableInvoiceDoc" class="p-6 md:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
        
        <!-- Cabecera Oficial con Logotipo SVG Martela y Datos Fiscales -->
        <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-amber-500">
          <div class="flex items-center gap-3.5">
            <img src="assets/brand/martela-symbol-gold.svg" class="w-14 h-14 object-contain filter drop-shadow-md" alt="Martela">
            <div>
              <div class="text-2xl font-black tracking-widest leading-none text-slate-900 dark:text-white">MARTELA</div>
              <div class="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider mt-1">JOYERÍA FINA · MATRIZ MAYORISTA</div>
              <div class="text-[10px] text-slate-500 mt-0.5">RFC: <b>MAR880915XYZ</b> · Régimen 601 General de Ley Personas Morales</div>
              <div class="text-[10px] text-slate-400">Av. Vallarta 2440, Guadalajara, Jalisco, México · C.P. 44100</div>
            </div>
          </div>
          <div class="text-left sm:text-right w-full sm:w-auto">
            <div class="inline-block px-3 py-1 rounded-full text-xs font-bold ${inv.estatus_sat === 'CANCELADA' ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'}">
              FACTURA ELECTRÓNICA (CFDI 4.0)
            </div>
            <div class="text-2xl font-black font-mono mt-1">${esc(inv.id)}</div>
            <div class="text-[11px] text-slate-500">Tipo: <b>Ingreso (I)</b> · Serie: <b>${esc(inv.serie || 'A')}</b> · Folio: <b>${esc(inv.folio || '1042')}</b></div>
          </div>
        </div>

        <!-- Bloque de Folio Fiscal Digital (UUID) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <div class="text-slate-400 text-[10px] uppercase font-bold">Folio Fiscal Digital (UUID SAT):</div>
            <div class="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs break-all">${esc(inv.uuid)}</div>
            <div class="text-[10px] text-slate-400 mt-1">No. Serie Certificado SAT: <b class="font-mono">${esc(inv.no_certificado_sat || '00001000000504465028')}</b></div>
          </div>
          <div class="sm:text-right">
            <div class="text-slate-400 text-[10px] uppercase font-bold">Fecha y Hora de Certificación:</div>
            <div class="font-mono font-bold text-slate-700 dark:text-slate-300">${esc(inv.fecha_timbrado || inv.fecha)}</div>
            <div class="text-[10px] text-slate-400 mt-1">Lugar de Expedición: <b>44100 (Jalisco, México)</b></div>
          </div>
        </div>

        <!-- Datos del Receptor Fiscal -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <div class="text-[10px] uppercase text-slate-400 font-bold">Receptor / Cliente Fiscal:</div>
            <div class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">${esc(inv.razon_social || inv.cliente)}</div>
            <div class="mt-1 text-slate-600 dark:text-slate-300">RFC: <b class="font-mono text-amber-600 dark:text-amber-400">${esc(inv.rfc)}</b></div>
            <div class="text-slate-500">Régimen Fiscal: <b>${esc(inv.regimen_fiscal || '601')}</b> · Domicilio Fiscal C.P.: <b>${esc(inv.cp_fiscal || '06000')}</b></div>
          </div>
          <div class="md:text-right space-y-1">
            <div>Uso de CFDI: <b>${esc(inv.uso_cfdi || 'G01')} - Adquisición de mercancías</b></div>
            <div>Método de Pago: <b>${esc(inv.metodo_pago === 'PPD' ? 'PPD - Pago en parcialidades o diferido' : 'PUE - Pago en una sola exhibición')}</b></div>
            <div>Forma de Pago: <b>${esc(inv.forma_pago_desc || '03 - Transferencia electrónica')}</b></div>
            <div class="font-mono text-[10px] text-amber-600 dark:text-amber-400">Expediente PLD: <b>${esc(inv.vinculo_pld)}</b></div>
          </div>
        </div>

        <!-- Tabla de Conceptos Facturados -->
        <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
              <tr>
                <th class="p-3">Clave SAT</th>
                <th class="p-3">SKU / Concepto</th>
                <th class="p-3 text-center">Cant.</th>
                <th class="p-3 text-right">Peso Neto</th>
                <th class="p-3 text-right">Valor Unitario</th>
                <th class="p-3 text-right">Importe</th>
                <th class="p-3 text-right">IVA (16%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${(inv.partidas || []).map(p => `
                <tr>
                  <td class="p-3 font-mono text-slate-500">${esc(p.clave_sat || '54111601')}</td>
                  <td class="p-3">
                    <div class="font-bold text-slate-900 dark:text-white">${esc(p.descripcion)}</div>
                    <div class="font-mono text-[10px] text-amber-600 dark:text-amber-400">SKU: ${esc(p.sku)}</div>
                  </td>
                  <td class="p-3 text-center font-bold font-mono">${p.cantidad}</td>
                  <td class="p-3 text-right font-mono font-semibold">${p.peso_neto_g}g</td>
                  <td class="p-3 text-right font-mono text-slate-600 dark:text-slate-300">${money(p.valor_unitario)}</td>
                  <td class="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">${money(p.importe)}</td>
                  <td class="p-3 text-right font-mono text-slate-500">${money(p.iva)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totales e Importe en Letras -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div class="md:col-span-2 space-y-2">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cantidad en Letra:</div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 uppercase font-mono">
              ${esc(importeLetras)}
            </div>
            <div class="text-[11px] text-slate-400 italic">
              Moneda: Peso Mexicano (MXN) · Tipo de cambio: $19.50 · Exportación: 01 No aplica
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span class="font-mono font-bold">${money(inv.subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Impuesto IVA (16% Trasladado):</span>
              <span class="font-mono font-bold">${money(inv.impuesto_iva)}</span>
            </div>
            <div class="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Total Comprobante:</span>
              <span class="font-mono text-xl text-amber-600 dark:text-amber-400">${money(inv.total)}</span>
            </div>
          </div>
        </div>

        <!-- Pie Fiscal Digital SAT: QR, Cadena y Sellos -->
        <div class="border-t-2 border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div class="flex justify-center sm:justify-start">
            ${qrSvg}
          </div>
          <div class="sm:col-span-3 space-y-2 text-[10px]">
            <div>
              <div class="text-slate-400 font-bold uppercase">Cadena Original del Complemento de Certificación Digital del SAT:</div>
              <div class="font-mono text-slate-600 dark:text-slate-400 break-all leading-tight">
                ||1.1|${esc(inv.uuid)}|${esc(inv.fecha_timbrado || inv.fecha)}|SAT970701NN3|${esc((inv.sello_cfd || '').slice(0, 40))}...|${esc(inv.no_certificado_sat || '00001000000504465028')}||
              </div>
            </div>
            <div>
              <div class="text-slate-400 font-bold uppercase">Sello Digital del Emisor (CFDI):</div>
              <div class="font-mono text-slate-600 dark:text-slate-400 break-all leading-tight">
                ${esc(inv.sello_cfd || 'SelloDigitalSimuladoMartelaJoyeriaFinaEnterprise2026')}
              </div>
            </div>
            <div class="text-slate-400 italic text-[9px] pt-1">
              Este documento es una representación impresa y legal de un CFDI 4.0 emitida en cumplimiento con los estándares del SAT y la Ley Federal de Prevención e Identificación de Operaciones con Recursos Ilícitos (PLD).
            </div>
          </div>
        </div>
      </div>

      <!-- Barra de Acciones del Documento -->
      <div class="flex flex-wrap justify-between items-center gap-3 mt-4">
        <div class="text-xs text-slate-500">
          Folio Interno: <b class="font-mono">${esc(inv.id)}</b>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="MartelaBilling.downloadXML('${inv.id}')" class="btn btn-soft text-xs py-2 font-mono font-bold">
            <span>📄</span> Descargar Archivo XML (CFDI 4.0)
          </button>
          <button onclick="window.print()" class="btn btn-soft text-xs py-2">
            <span>🖨️</span> Imprimir Documento
          </button>
          <button onclick="MartelaBilling.downloadHTMLDoc('${inv.id}')" class="btn btn-gold text-xs py-2">
            <span>⇩</span> Guardar PDF/HTML
          </button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal(`CFDI 4.0 · ${inv.id} (${inv.cliente})`, html, 'max-w-4xl');
  }

  // ==========================================
  // DESCARGA REAL DE XML CFDI 4.0 Y DOCUMENTOS
  // ==========================================
  function downloadXML(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const xml = window.apiFacade.generateCFDI40XML(inv);
    window.MartelaUI.downloadBlob(xml, `${inv.id}_${inv.uuid}.xml`, 'application/xml');
    window.MartelaUI.toast(`XML CFDI 4.0 descargado (${inv.id}.xml)`, 'success');
  }

  function downloadREPXML(paymentId) {
    const db = window.apiFacade._getDB();
    const pag = db.payments_cxc.find(p => p.id === paymentId);
    if (!pag) return;

    const xml = window.apiFacade.generateREPDocumentXML(pag);
    window.MartelaUI.downloadBlob(xml, `${pag.id}_REP_${pag.uuid}.xml`, 'application/xml');
    window.MartelaUI.toast(`XML Recibo de Pago REP descargado (${pag.id}.xml)`, 'success');
  }

  function downloadNCXML(ncId) {
    const db = window.apiFacade._getDB();
    const nc = db.credit_notes.find(n => n.id === ncId);
    if (!nc) return;

    const xml = window.apiFacade.generateNCXML(nc);
    window.MartelaUI.downloadBlob(xml, `${nc.id}_NC_${nc.uuid}.xml`, 'application/xml');
    window.MartelaUI.toast(`XML Nota de Crédito descargado (${nc.id}.xml)`, 'success');
  }

  function downloadHTMLDoc(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const printable = document.getElementById('printableInvoiceDoc');
    if (!printable) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura Fiscal ${inv.id} — MARTELA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; padding: 20px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body class="max-w-4xl mx-auto">
  ${printable.outerHTML}
</body>
</html>`;

    window.MartelaUI.downloadBlob(fullHtml, `factura-${inv.id}.html`, 'text/html');
    window.MartelaUI.toast(`Representación impresa descargada (${inv.id}.html)`, 'success');
  }

  function openCancelModal(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const { esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs">
        <div class="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-300 dark:border-rose-700/60 text-rose-800 dark:text-rose-300">
          <div class="font-bold">⚠️ Cancelación de Comprobante Fiscal Digital ante el SAT</div>
          <div class="mt-1">Esta acción cancelará el folio <b>${esc(inv.id)}</b> con UUID <b>${esc(inv.uuid)}</b> y liberará las piezas al inventario disponible.</div>
        </div>

        <div>
          <label class="block font-semibold text-slate-400 mb-1">Motivo de Cancelación SAT (Catálogo Oficial):</label>
          <select id="cancelMotivoSelect" class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold outline-none">
            <option value="02">02 - Comprobante emitido con errores sin relación</option>
            <option value="01">01 - Comprobante emitido con errores con relación</option>
            <option value="03">03 - No se llevó a cabo la operación</option>
            <option value="04">04 - Operación nominativa relacionada en una factura global</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">No Cancelar</button>
          <button onclick="MartelaBilling.confirmCancel('${inv.id}')" class="btn btn-danger">
            Confirmar Cancelación ante SAT
          </button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal(`Cancelar Factura ${inv.id}`, html, 'max-w-md');
  }

  async function confirmCancel(invoiceId) {
    const motivo = document.getElementById('cancelMotivoSelect').value;
    try {
      await window.apiFacade.cancelInvoice(invoiceId, motivo);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Factura ${invoiceId} cancelada exitosamente ante el SAT (Motivo ${motivo})`, 'info');
      render(document.getElementById('contentContainer'));
    } catch (e) {
      window.MartelaUI.toast(e.message, 'error');
    }
  }

  function exportInvoicesExcel() {
    const db = window.apiFacade._getDB();
    const rows = db.invoices.map(i => ({
      'Folio': i.id,
      'UUID Fiscal': i.uuid,
      'Cliente': i.cliente,
      'RFC': i.rfc,
      'Fecha Emisión': i.fecha,
      'Fecha Vence': i.fecha_vencimiento,
      'Tipo': i.tipo_comprobante,
      'Método Pago': i.metodo_pago,
      'Forma Pago': i.forma_pago_desc,
      'Piezas': i.piezas_count,
      'Gramos': i.gramos_totales,
      'Subtotal (MXN)': i.subtotal,
      'IVA 16% (MXN)': i.impuesto_iva,
      'Total (MXN)': i.total,
      'Saldo Pendiente (MXN)': i.saldo_pendiente,
      'Estatus Cobro': i.estatus_pago,
      'Estatus SAT': i.estatus_sat,
      'Folio PLD': i.vinculo_pld
    }));

    window.MartelaUI.exportToExcel(rows, `martela-cfdi-facturacion-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Facturas');
  }

  return {
    render,
    switchTab,
    handleFilterSearch,
    handleFilterSat,
    handleFilterPago,
    setNewInvoiceMode,
    handlePartidaSkuChange,
    recalcPartida,
    addDirectPartida,
    removeDirectPartida,
    emitirFacturaDirecta,
    generateInvoiceFromOrder,
    openPaymentModal,
    handleFormaPagoChange,
    submitPayment,
    openNewCreditNoteModal,
    submitCreditNote,
    openClientModal,
    saveClientModal,
    verFactura,
    downloadXML,
    downloadREPXML,
    downloadNCXML,
    downloadHTMLDoc,
    openCancelModal,
    confirmCancel,
    exportInvoicesExcel
  };
})();
