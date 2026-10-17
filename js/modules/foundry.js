/**
 * MARTELA — Módulo: Taller de Fundición, Mermas y Rebabas
 * Control de pesajes de entrada, metal recuperado, rebabas y actas internas de fundición.
 */
window.MartelaFoundry = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const logs = await window.apiFacade.getFoundryLogs();
    const db = window.apiFacade._getDB();
    const { money, grams, esc, badge } = window.MartelaUI;

    const piezasEnFundicion = db.inventory_pieces.filter(p => p.almacen_id === 'TALLER_FUNDICION' || p.estatus === 'EN_FUNDICION');
    const pesoPendienteFundir = piezasEnFundicion.reduce((s, p) => s + p.peso_neto_g, 0);

    const totalEntradaHistorica = logs.reduce((s, l) => s + l.peso_entrada_g, 0);
    const totalRecuperadoHistorico = logs.reduce((s, l) => s + l.peso_recuperado_g, 0);
    const totalDiferencia = +(totalEntradaHistorica - totalRecuperadoHistorico).toFixed(2);

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Control Metalúrgico de Oro</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Taller de Fundición y Mermas</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Recepción de piezas dañadas, registro de fusión de lingotes y conciliación de rebabas con actas internas.
          </p>
        </div>
        <button onclick="MartelaFoundry.openModalNuevoLote()" class="btn btn-gold">
          <span>🔥</span> Registrar Nuevo Lote de Fusión
        </button>
      </div>

      <!-- Tarjetas Resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div class="panel p-4 border-l-4 border-purple-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">Piezas en Taller</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${piezasEnFundicion.length} piezas</div>
          <div class="text-[11px] text-amber-500 font-bold">${grams(pesoPendienteFundir)} por fundir</div>
        </div>

        <div class="panel p-4 border-l-4 border-slate-400">
          <div class="text-xs text-slate-400 uppercase font-semibold">Metal Entrado a Horno</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${grams(totalEntradaHistorica)}</div>
          <div class="text-[11px] text-slate-500">Piezas rotas y pedacería</div>
        </div>

        <div class="panel p-4 border-l-4 border-emerald-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">Oro Físico Recuperado</div>
          <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">${grams(totalRecuperadoHistorico)}</div>
          <div class="text-[11px] text-slate-500">En lingote / granalla pura</div>
        </div>

        <div class="panel p-4 border-l-4 border-amber-500">
          <div class="text-xs text-slate-400 uppercase font-semibold">Diferencia Acumulada</div>
          <div class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">${grams(totalDiferencia)}</div>
          <div class="text-[11px] text-slate-400">Merma real + bote de rebabas</div>
        </div>
      </div>

      <!-- Explicación de la Regla de Rebabas vs Merma -->
      <div class="panel p-4 mb-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-3">
        <span class="text-lg text-amber-500">⚠️</span>
        <div>
          <b>Protocolo Martela de Diferencia de Peso:</b> No se clasifica automáticamente toda diferencia como merma definitiva.
          Se distingue entre <b>merma térmica volatilizada (aprox 20%)</b> y <b>material recuperable en crisol/rebabas (aprox 80%)</b> enviado a análisis por copelación.
        </div>
      </div>

      <!-- Historial de Lotes de Fundición -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Lotes Registrados de Fusión y Mermas</h3>
          <span class="text-xs text-slate-500">${logs.length} lotes</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
              <tr>
                <th class="p-3.5">Folio Lote</th>
                <th class="p-3.5">Fecha</th>
                <th class="p-3.5">Técnico Fundidor</th>
                <th class="p-3.5 text-right">Peso Entrada</th>
                <th class="p-3.5 text-right">Peso Recuperado</th>
                <th class="p-3.5 text-right">Diferencia</th>
                <th class="p-3.5 text-right">Bote Rebabas</th>
                <th class="p-3.5 text-center">Estatus</th>
                <th class="p-3.5 text-center">Acta Interna</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${logs.map(log => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3.5 font-mono font-bold text-purple-600 dark:text-purple-400">${esc(log.id)}</td>
                  <td class="p-3.5 font-mono text-slate-500">${esc(log.fecha)}</td>
                  <td class="p-3.5 font-medium text-slate-900 dark:text-white">${esc(log.tecnico)}</td>
                  <td class="p-3.5 text-right font-mono font-semibold">${grams(log.peso_entrada_g)}</td>
                  <td class="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">${grams(log.peso_recuperado_g)}</td>
                  <td class="p-3.5 text-right font-mono font-bold text-rose-500">${grams(log.diferencia_g)}</td>
                  <td class="p-3.5 text-right font-mono text-amber-500 font-bold">${grams(log.bote_rebabas_analisis_g)}</td>
                  <td class="p-3.5 text-center">${badge(log.estatus)}</td>
                  <td class="p-3.5 text-center">
                    <button onclick="MartelaFoundry.verActa('${log.id}')" class="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                      Ver Acta →
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

  function openModalNuevoLote() {
    const html = `
      <form onsubmit="MartelaFoundry.saveNuevoLote(event)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso de Entrada al Horno (g)</label>
            <input 
              name="peso_entrada_g" 
              id="fndEntrada" 
              type="number" 
              step="0.01" 
              min="0.01" 
              value="12.00" 
              required 
              oninput="MartelaFoundry.calcularPreviewLote()"
            />
          </div>

          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso Recuperado Lingote/Grano (g)</label>
            <input 
              name="peso_recuperado_g" 
              id="fndSalida" 
              type="number" 
              step="0.01" 
              min="0.01" 
              value="10.20" 
              required 
              oninput="MartelaFoundry.calcularPreviewLote()"
            />
          </div>
        </div>

        <div id="fndPreviewBox" class="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
          <div>Diferencia calculada: <b id="fndDifText" class="font-mono text-rose-500">1.80 g</b></div>
          <div class="text-[11px] text-slate-400">
            • Merma estimada en combustión (20%): <b id="fndMermaText">0.36 g</b><br>
            • En Bote de Rebabas para copelación (80%): <b id="fndRebabasText">1.44 g</b>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Técnico Fundidor</label>
          <input name="tecnico" value="Roberto Silva" required />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Observaciones del Crisol</label>
          <textarea name="notas" rows="2" placeholder="Retazos y anillos con deformación de fundición previa"></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Registrar Lote y Emitir Acta</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal('Registrar Lote de Fundición y Conciliación', html, 'max-w-lg');
  }

  function calcularPreviewLote() {
    const ent = parseFloat(document.getElementById('fndEntrada')?.value || 0);
    const sal = parseFloat(document.getElementById('fndSalida')?.value || 0);
    const dif = Math.max(0, ent - sal);
    const merma = dif * 0.20;
    const rebabas = dif - merma;

    const elDif = document.getElementById('fndDifText');
    const elMer = document.getElementById('fndMermaText');
    const elReb = document.getElementById('fndRebabasText');

    if (elDif) elDif.textContent = dif.toFixed(2) + ' g';
    if (elMer) elMer.textContent = merma.toFixed(2) + ' g';
    if (elReb) elReb.textContent = rebabas.toFixed(2) + ' g';
  }

  async function saveNuevoLote(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const batchData = {
      peso_entrada_g: parseFloat(f.get('peso_entrada_g')),
      peso_recuperado_g: parseFloat(f.get('peso_recuperado_g')),
      tecnico: f.get('tecnico'),
      notas: f.get('notas')
    };

    try {
      const batch = await window.apiFacade.createFoundryBatch(batchData);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Lote ${batch.id} registrado con éxito`, 'success');
      render(document.getElementById('contentContainer'));
      verActa(batch.id);
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function verActa(batchId) {
    const db = window.apiFacade._getDB();
    const log = db.foundry_logs.find(l => l.id === batchId);
    if (!log) return;

    const { grams, esc } = window.MartelaUI;

    const html = `
      <div class="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 text-xs">
        <div class="flex justify-between items-center border-b pb-3 border-amber-500">
          <div class="flex items-center gap-3">
            <img src="assets/brand/martela-symbol-gold.svg" class="w-10 h-10 object-contain" alt="Martela">
            <div>
              <div class="text-base font-black tracking-widest">MARTELA</div>
              <div class="text-[10px] text-amber-600 font-bold">ACTA INTERNA DE FUNDICIÓN Y MERMAS</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono font-bold text-sm text-purple-600">${esc(log.id)}</div>
            <div class="text-slate-400">${esc(log.fecha)}</div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-center">
          <div>
            <div class="text-slate-400">Metal Entrada:</div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">${grams(log.peso_entrada_g)}</div>
          </div>
          <div>
            <div class="text-slate-400">Oro Recuperado:</div>
            <div class="font-bold text-sm text-emerald-500">${grams(log.peso_recuperado_g)}</div>
          </div>
          <div>
            <div class="text-slate-400">Diferencia Total:</div>
            <div class="font-bold text-sm text-rose-500">${grams(log.diferencia_g)}</div>
          </div>
        </div>

        <div class="p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg space-y-1">
          <div>• Merma en Fundente / Horno: <b>${grams(log.merma_confirmada_g)}</b></div>
          <div>• Asignado a Bote de Rebabas para Análisis: <b>${grams(log.bote_rebabas_analisis_g)}</b></div>
          <div>• Responsable Técnico: <b>${esc(log.tecnico)}</b></div>
        </div>

        <p class="text-[11px] text-slate-400 italic">
          * Certificado interno de conciliación de metales preciosos para control de merma y auditoría.
        </p>
      </div>

      <div class="flex justify-end gap-3 mt-4">
        <button onclick="window.print()" class="btn btn-soft">Imprimir Acta</button>
      </div>
    `;

    window.MartelaUI.openModal(`Acta de Fundición · ${log.id}`, html, 'max-w-lg');
  }

  return {
    render,
    openModalNuevoLote,
    calcularPreviewLote,
    saveNuevoLote,
    verActa
  };
})();
