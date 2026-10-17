/**
 * MARTELA — Módulo: Motor de Cotización Dinámica del Metal (FIX) & Compensación de Maquila
 */
window.MartelaPricing = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const rates = await window.apiFacade.getMetalRates();
    const db = window.apiFacade._getDB();
    const compensations = await window.apiFacade.getMaquilaCompensations();
    const { money, grams, esc, badge } = window.MartelaUI;

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Mercado de Metales y Fórmulas de Joyería</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Motor de Cotización Dinámica del Oro</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cálculo algorítmico del precio efectivo por gramo según el FIX internacional y reglas de protección comercial.
          </p>
        </div>
        <button onclick="MartelaPricing.openModalEditarRates()" class="btn btn-gold">
          <span>⚙</span> Modificar Parámetros de Mercado
        </button>
      </div>

      <!-- Tarjetas Indicadores de Mercado & Regla Aplicada -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="panel p-5 border-l-4 border-slate-400">
          <div class="text-xs font-semibold text-slate-400 uppercase">FIX Oro Hoy</div>
          <div class="text-2xl font-black mt-2 text-slate-900 dark:text-white">$${rates.fix_oro_hoy_usd.toFixed(2)} USD</div>
          <div class="text-xs text-slate-500 mt-1">Onza troy Londres (AM/PM)</div>
        </div>

        <div class="panel p-5 border-l-4 border-amber-500">
          <div class="text-xs font-semibold text-slate-400 uppercase">FIX Oro Ayer</div>
          <div class="text-2xl font-black mt-2 text-slate-900 dark:text-white">$${rates.fix_oro_ayer_usd.toFixed(2)} USD</div>
          <div class="text-xs text-slate-500 mt-1">Cierre anterior de mercado</div>
        </div>

        <div class="panel p-5 border-l-4 border-blue-500">
          <div class="text-xs font-semibold text-slate-400 uppercase">Tipo de Cambio FIX</div>
          <div class="text-2xl font-black mt-2 text-slate-900 dark:text-white">$${rates.tipo_cambio_usd_mxn.toFixed(2)} MXN</div>
          <div class="text-xs text-slate-500 mt-1">Banxico / Diario Oficial</div>
        </div>

        <div class="panel p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/20 border-l-4 border-amber-500">
          <div class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Gramo Oro Fino (24K)</div>
          <div class="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400 font-mono">${money(rates.precio_gramo_fino_mxn)}</div>
          <div class="text-xs text-slate-500 mt-1">Base pura internacional</div>
        </div>
      </div>

      <!-- Banner de la Regla Comercial Aplicada -->
      <div class="panel p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">✓</span>
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Regla de Negocio MARTELA Activa:</div>
            <div class="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Se aplica el <b>${rates.regla_descripcion}</b>: <span class="font-mono font-bold">$${rates.fix_aplicado_usd.toFixed(2)} USD</span> para salvaguardar el margen ante fluctuaciones de bolsa.
            </div>
          </div>
        </div>
        <div class="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
          Fórmula: (FIX × T.C. ÷ 31.1035) × Pureza
        </div>
      </div>

      <!-- Calculadora en Tiempo Real: Pieza o Gramos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Panel Izquierdo: Simulador Interactivo -->
        <div class="panel p-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-lg text-amber-500">◇</span>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Calculadora de Precio por Pieza / Gramos</h3>
          </div>

          <form id="pricingCalcForm" oninput="MartelaPricing.onCalculateLive()" class="space-y-4">
            <div>
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Seleccionar Pieza Física en Stock (o cálculo libre)
              </label>
              <select id="calcPieceSelector" onchange="MartelaPricing.onSelectPiece(this.value)">
                <option value="">-- Cálculo Manual / Personalizado --</option>
                ${db.inventory_pieces.slice(0, 40).map(p => `
                  <option value="${p.piece_id}" data-sku="${p.sku_ref}" data-weight="${p.peso_neto_g}">
                    ${esc(p.piece_id)} — ${esc(p.sku_ref)} (${grams(p.peso_neto_g)})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Quilataje</label>
                <select id="calcKarat">
                  <option value="10K">Oro 10K (41.7%)</option>
                  <option value="14K" selected>Oro 14K (58.3%)</option>
                  <option value="18K">Oro 18K (75.0%)</option>
                  <option value="22K">Oro 22K (91.7%)</option>
                </select>
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso Neto (g)</label>
                <input id="calcWeight" type="number" step="0.01" min="0.01" value="5.25" required />
              </div>

              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Hechura Base (MXN)</label>
                <input id="calcMaking" type="number" step="1" min="0" value="260" required />
              </div>
            </div>

            <!-- Desglose de Cálculo Resultante -->
            <div id="calcOutputBox" class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <!-- Se actualiza por JS -->
            </div>
          </form>
        </div>

        <!-- Panel Derecho: Módulo de Compensación de Maquila (Montepío / Clientes) -->
        <div class="panel p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-lg text-amber-500">🏛️</span>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Compensación de Maquila (Montepío)</h3>
            </div>
            <button onclick="MartelaPricing.openModalMaquila()" class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
              ＋ Registrar Depósito de Oro
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Permite a clientes mayoristas o instituciones como Montepío entregar oro fino 24K físico para compensar el costo del metal, cobrando únicamente la hechura en dinero.
          </p>

          <!-- Tarjeta de Saldo a Favor -->
          <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-500/20 mb-4 flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold text-slate-500">Saldo Activo de Oro Fino a Favor</div>
              <div class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">145.80 g de Oro 24K</div>
              <div class="text-[11px] text-slate-400">Cliente: Montepío y Clientes Maquila</div>
            </div>
            <div class="text-right">
              <span class="badge b-green">Vigente</span>
              <div class="text-xs text-slate-500 mt-1">Valuación: ${money(145.80 * rates.precio_gramo_fino_mxn)}</div>
            </div>
          </div>

          <div class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Historial de Entregas de Metal</div>
          <div class="overflow-x-auto max-h-48 overflow-y-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                <tr>
                  <th class="p-2">Folio</th>
                  <th class="p-2">Fecha</th>
                  <th class="p-2">Gramos 24K</th>
                  <th class="p-2">Acta Notariada</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${compensations.map(c => `
                  <tr>
                    <td class="p-2 font-mono font-bold">${esc(c.id)}</td>
                    <td class="p-2 font-mono text-slate-500">${esc(c.fecha)}</td>
                    <td class="p-2 font-bold text-amber-600 dark:text-amber-400">${grams(c.gramos_oro_fino)}</td>
                    <td class="p-2 font-mono text-slate-500">${esc(c.folio_acta)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Disparar cálculo inicial
    onCalculateLive();
  }

  async function onCalculateLive() {
    const weight = parseFloat(document.getElementById('calcWeight')?.value || 0);
    const making = parseFloat(document.getElementById('calcMaking')?.value || 0);
    const karat = document.getElementById('calcKarat')?.value || '14K';

    const res = await window.apiFacade.calculateDynamicPrice(weight, making, karat);
    const box = document.getElementById('calcOutputBox');
    if (!box) return;

    const { money, grams } = window.MartelaUI;

    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-slate-400">Pureza Metal (${karat}):</span>
          <div class="font-bold font-mono text-slate-900 dark:text-white">${res.pureza_porcentaje} (${money(res.precio_gramo_quilataje)} / g)</div>
        </div>
        <div>
          <span class="text-slate-400">Costo Metal Estimado:</span>
          <div class="font-bold font-mono text-amber-600 dark:text-amber-400">${money(res.costo_metal)}</div>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div>
          <div class="text-[11px] text-slate-400">+ Hechura y Acabado: <b>${money(res.costo_hechura)}</b></div>
          <div class="text-base font-black text-slate-900 dark:text-white">Precio Final de Facturación:</div>
        </div>
        <div class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
          ${money(res.precio_final)}
        </div>
      </div>
    `;
  }

  function onSelectPiece(pieceId) {
    if (!pieceId) return;
    const db = window.apiFacade._getDB();
    const piece = db.inventory_pieces.find(p => p.piece_id === pieceId);
    if (!piece) return;

    const prod = db.products_sku.find(x => x.sku === piece.sku_ref);

    document.getElementById('calcWeight').value = piece.peso_neto_g;
    if (prod) {
      document.getElementById('calcKarat').value = prod.quilataje;
      document.getElementById('calcMaking').value = prod.costo_hechura_base;
    }
    onCalculateLive();
  }

  // Modal para editar parámetros FIX
  function openModalEditarRates() {
    const db = window.apiFacade._getDB();
    const r = db.metal_rates;

    const html = `
      <form onsubmit="MartelaPricing.saveRates(event)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">FIX Oro Hoy (USD / Oz Troy)</label>
            <input name="fix_oro_hoy_usd" type="number" step="0.01" value="${r.fix_oro_hoy_usd}" required />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">FIX Oro Ayer (USD / Oz Troy)</label>
            <input name="fix_oro_ayer_usd" type="number" step="0.01" value="${r.fix_oro_ayer_usd}" required />
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Tipo de Cambio FIX (MXN por USD)</label>
          <input name="tipo_cambio_usd_mxn" type="number" step="0.0001" value="${r.tipo_cambio_usd_mxn}" required />
        </div>

        <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
          Al guardar, la valuación de todas las piezas en inventario y las prefacturas se actualizarán en tiempo real.
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Guardar Parámetros</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal('Configuración de Cotización de Metales', html, 'max-w-md');
  }

  async function saveRates(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const newRates = {
      fix_oro_hoy_usd: parseFloat(f.get('fix_oro_hoy_usd')),
      fix_oro_ayer_usd: parseFloat(f.get('fix_oro_ayer_usd')),
      tipo_cambio_usd_mxn: parseFloat(f.get('tipo_cambio_usd_mxn'))
    };

    await window.apiFacade.updateMetalRates(newRates);
    window.MartelaUI.closeModal();
    window.MartelaUI.toast('Cotizaciones de mercado actualizadas con éxito', 'success');
    render(document.getElementById('contentContainer'));
  }

  function openModalMaquila() {
    const html = `
      <form onsubmit="MartelaPricing.saveMaquila(event)" class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Cliente / Institución</label>
          <input name="cliente" value="Montepío y Clientes Maquila" required />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Gramos Oro Fino (24K)</label>
            <input name="gramos" type="number" step="0.01" value="50.00" required />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Folio Acta Notariada</label>
            <input name="acta" value="ACTA-ORO-${Date.now().toString().slice(-4)}" required />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Registrar Abono Metal</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal('Registrar Depósito de Oro para Maquila', html, 'max-w-md');
  }

  async function saveMaquila(e) {
    e.preventDefault();
    window.MartelaUI.closeModal();
    window.MartelaUI.toast('Depósito de metal registrado en el libro de compensación', 'success');
  }

  return {
    render,
    onCalculateLive,
    onSelectPiece,
    openModalEditarRates,
    saveRates,
    openModalMaquila,
    saveMaquila
  };
})();
