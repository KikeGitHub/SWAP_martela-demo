/**
 * MARTELA — Módulo: Logística por Zonas & Simulador PWA Móvil para Choferes (PLD)
 * Captura de firma en Canvas, evidencia fotográfica del sello de sucursal y geolocalización simulada.
 */
window.MartelaLogistics = (function() {
  let isMobileFrameActive = false;

  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const routes = await window.apiFacade.getRoutes();
    const route = routes[0]; // Ruta activa de demostración
    const { esc, badge } = window.MartelaUI;

    const completadas = route.paradas.filter(p => p.estatus === 'ENTREGADA').length;
    const totalParadas = route.paradas.length;

    container.innerHTML = `
      <!-- Encabezado con Toggle de Vista Móvil PWA -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Rutas Blindadas y Cumplimiento PLD</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Logística de Entregas & PWA Chofer</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de paradas, firma táctil en Canvas y expediente fotográfico vinculado a la auditoría PLD.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button 
            onclick="MartelaLogistics.togglePhoneFrame()" 
            class="btn ${isMobileFrameActive ? 'btn-gold' : 'btn-soft'}"
          >
            <span>📱</span> ${isMobileFrameActive ? 'Desactivar Marco Smartphone' : 'Simular Vista Smartphone PWA'}
          </button>
        </div>
      </div>

      <!-- Contenedor con Posible Marco Smartphone PWA -->
      <div class="${isMobileFrameActive ? 'max-w-sm mx-auto p-4 bg-slate-900 rounded-[40px] shadow-2xl border-4 border-slate-700 my-4' : ''}">
        ${isMobileFrameActive ? `
          <!-- Cabecera de Teléfono Móvil -->
          <div class="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4"></div>
          <div class="flex justify-between items-center text-[10px] text-slate-400 px-2 mb-3">
            <span>09:41 AM · GPS Activo</span>
            <span class="text-amber-400 font-bold">MARTELA DRIVER</span>
            <span>LTE 100%</span>
          </div>
        ` : ''}

        <!-- Resumen de Ruta Activa -->
        <div class="panel p-5 mb-6 border-l-4 border-amber-500">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-base text-slate-900 dark:text-white">${esc(route.id)}</span>
                ${badge(route.estatus)}
                <span class="text-xs text-slate-400">Fecha: ${esc(route.fecha)}</span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chofer Asignado: <b>${esc(route.chofer)}</b> · Vehículo: <b>${esc(route.vehiculo)}</b>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 font-semibold">Progreso de Entrega:</span>
              <div class="text-lg font-black text-amber-600 dark:text-amber-400">${completadas} / ${totalParadas} paradas</div>
            </div>
          </div>
        </div>

        <!-- Lista de Paradas / Sucursales -->
        <div class="space-y-4">
          ${route.paradas.map((parada, idx) => `
            <div class="panel p-5 ${parada.estatus === 'ENTREGADA' ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'}">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${parada.estatus === 'ENTREGADA' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                    ${idx + 1}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${esc(parada.sucursal)}</h4>
                    <p class="text-xs text-slate-400">${esc(parada.direccion)}</p>
                  </div>
                </div>
                ${badge(parada.estatus)}
              </div>

              <!-- Metadatos de Entrega -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg mb-4">
                <div>
                  <span class="text-slate-400 block text-[10px]">Horario Sugerido:</span>
                  <span class="font-semibold">${esc(parada.hora_programada)}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Caja / Bulto:</span>
                  <span class="font-semibold">Caja #${parada.caja_numero} (${parada.piezas_caja} pzs)</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Factura / PLD:</span>
                  <span class="font-mono text-amber-600 dark:text-amber-400 font-bold">${esc(parada.folio_factura || 'En preparación')}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Hora Llegada GPS:</span>
                  <span class="font-mono">${esc(parada.hora_llegada || 'No registrada')}</span>
                </div>
              </div>

              ${parada.estatus === 'ENTREGADA' ? `
                <div class="flex flex-wrap items-center gap-4 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20">
                  <span>✓ <b>Entrega Certificada:</b> Recibió: <b>${esc(parada.receptor_nombre)}</b></span>
                  ${parada.firma_canvas_data ? `<button onclick="MartelaLogistics.verFirmaModal('${parada.parada_id}')" class="underline font-bold">Ver Firma Digital</button>` : ''}
                  ${parada.evidencia_sello_url ? `<span class="text-slate-400">· Foto Sello Adjunta</span>` : ''}
                </div>
              ` : `
                <div class="flex justify-end gap-2">
                  <button 
                    onclick="MartelaLogistics.registrarLlegadaGPS('${route.id}', '${parada.parada_id}')"
                    class="btn btn-soft text-xs py-1.5"
                  >
                    📍 Simular Llegada GPS
                  </button>
                  <button 
                    onclick="MartelaLogistics.abrirModalEntrega('${route.id}', '${parada.parada_id}')"
                    class="btn btn-gold text-xs py-1.5"
                  >
                    ✍ Capturar Firma y Sello
                  </button>
                </div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function togglePhoneFrame() {
    isMobileFrameActive = !isMobileFrameActive;
    render(document.getElementById('contentContainer'));
  }

  async function registrarLlegadaGPS(routeId, paradaId) {
    const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const db = window.apiFacade._getDB();
    const route = db.routes.find(r => r.id === routeId);
    const stop = route?.paradas.find(p => p.parada_id === paradaId);
    if (stop) {
      stop.hora_llegada = hora;
      window.apiFacade._saveDB(db);
      window.MartelaUI.toast(`Llegada GPS registrada en ${stop.sucursal} (${hora})`, 'info');
      render(document.getElementById('contentContainer'));
    }
  }

  function abrirModalEntrega(routeId, paradaId) {
    const db = window.apiFacade._getDB();
    const route = db.routes.find(r => r.id === routeId);
    const parada = route?.paradas.find(p => p.parada_id === paradaId);
    if (!parada) return;

    const { esc } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaLogistics.confirmarEntrega(event, '${routeId}', '${paradaId}')" class="space-y-4">
        <div class="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          Entregando en: <b>${esc(parada.sucursal)}</b> — Factura amparada: <b>${esc(parada.folio_factura || 'PRE-2026-0001')}</b>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Nombre Completo de quien Recibe en Sucursal</label>
          <input name="receptor_nombre" placeholder="Ej. Lic. Claudia Mendoza (Gerente Sucursal)" required />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Observaciones / Notas de Entrega</label>
          <textarea name="observaciones" rows="2" placeholder="Sellos de caja intactos, doble candado verificado"></textarea>
        </div>

        <!-- Canvas de Firma Digital Táctil -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Firma Digital del Encargado (Dibuja con dedo o ratón)
            </label>
            <button type="button" onclick="MartelaUI.clearSignature('canvasFirmaEntrega')" class="text-[11px] text-amber-600 dark:text-amber-400 hover:underline">
              Limpiar Firma
            </button>
          </div>
          <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950">
            <canvas id="canvasFirmaEntrega" width="500" height="150" class="w-full h-36 touch-none cursor-crosshair"></canvas>
          </div>
          <span class="text-[10px] text-slate-400 mt-1 block">La firma se estampa y encripta en base64 en la base de datos local.</span>
        </div>

        <!-- Evidencia de Foto de Sello -->
        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Foto del Recibo Sellado por Coppel (Opcional)</label>
          <input type="file" name="foto_sello" accept="image/*" class="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950" />
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Confirmar Entrega y Sellar Folio</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal(`Evidencia de Entrega · ${parada.sucursal}`, html, 'max-w-xl');

    setTimeout(() => {
      window.MartelaUI.initSignatureCanvas('canvasFirmaEntrega');
    }, 100);
  }

  async function confirmarEntrega(e, routeId, paradaId) {
    e.preventDefault();
    const isSigned = window.MartelaUI.isCanvasSigned('canvasFirmaEntrega');
    if (!isSigned) {
      window.MartelaUI.toast('Por favor capture la firma del receptor antes de continuar', 'error');
      return;
    }

    const form = e.target;
    const receptor_nombre = form.receptor_nombre.value;
    const observaciones = form.observaciones.value;
    const firma_canvas_data = window.MartelaUI.getCanvasDataURL('canvasFirmaEntrega');

    // Manejo de foto simulada
    let evidencia_sello_url = "sello-coppel-certificado.jpg";

    try {
      await window.apiFacade.confirmDeliveryStop(routeId, paradaId, {
        receptor_nombre,
        observaciones,
        firma_canvas_data,
        evidencia_sello_url
      });

      window.MartelaUI.closeModal();
      window.MartelaUI.toast('Entrega confirmada y asociada al expediente PLD', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function verFirmaModal(paradaId) {
    const db = window.apiFacade._getDB();
    const route = db.routes[0];
    const parada = route?.paradas.find(p => p.parada_id === paradaId);
    if (!parada || !parada.firma_canvas_data) return;

    const html = `
      <div class="space-y-4 text-center">
        <div class="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
          <img src="${parada.firma_canvas_data}" alt="Firma Digital" class="max-h-40 mx-auto" />
        </div>
        <div class="text-xs text-slate-500">
          Receptor: <b>${parada.receptor_nombre}</b> · Hora: <b>${parada.hora_salida}</b>
        </div>
      </div>
    `;

    window.MartelaUI.openModal('Firma Registrada en Entrega', html, 'max-w-md');
  }

  return {
    render,
    togglePhoneFrame,
    registrarLlegadaGPS,
    abrirModalEntrega,
    confirmarEntrega,
    verFirmaModal
  };
})();
