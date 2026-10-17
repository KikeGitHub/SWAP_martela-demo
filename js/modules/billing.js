/**
 * MARTELA — Módulo: Administración y Facturación
 * Gestión de clientes mayoristas, emisión de prefacturas comerciales y relación con PLD.
 */
window.MartelaBilling = (function() {
  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const invoices = await window.apiFacade.getInvoices();
    const orders = await window.apiFacade.getCoppelOrders();
    const db = window.apiFacade._getDB();
    const { money, grams, esc, badge } = window.MartelaUI;

    // Pedidos listos para facturar (que tienen piezas asignadas y no tienen prefactura emitida)
    const eligibleOrders = orders.filter(o => o.piezas_asignadas > 0 && !invoices.some(i => i.order_id === o.order_id));
    const totalFacturado = invoices.reduce((s, i) => s + i.total, 0);

    container.innerHTML = `
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">Administración Comercial & Prefacturas</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Facturación y Cierre de Pedidos</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generación de documentos comerciales de demostración vinculados a pedidos y conciliación con PLD.
          </p>
        </div>
        <button onclick="MartelaBilling.exportInvoicesExcel()" class="btn btn-soft">
          <span>⇩</span> Exportar Prefacturas Excel
        </button>
      </div>

      <!-- Métricas Superiores -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="panel p-4">
          <div class="text-xs text-slate-400 uppercase font-semibold">Documentos Emitidos</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${invoices.length} prefacturas</div>
          <div class="text-[11px] text-slate-500">Folios PRE-2026 secuenciales</div>
        </div>

        <div class="panel p-4">
          <div class="text-xs text-slate-400 uppercase font-semibold">Importe Total Facturado (Simulado)</div>
          <div class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">${money(totalFacturado)}</div>
          <div class="text-[11px] text-slate-500">Incluye IVA 16% comercial</div>
        </div>

        <div class="panel p-4">
          <div class="text-xs text-slate-400 uppercase font-semibold">Pedidos Pendientes de Facturar</div>
          <div class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">${eligibleOrders.length} pedidos</div>
          <div class="text-[11px] text-slate-500">Con piezas físicas asignadas</div>
        </div>
      </div>

      <!-- Pedidos Listos para Prefacturar -->
      ${eligibleOrders.length > 0 ? `
        <div class="panel p-5 mb-6 border-l-4 border-amber-500 bg-amber-50/20 dark:bg-amber-950/20">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Pedidos con Piezas Asignadas Listos para Generar Prefactura</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                <tr>
                  <th class="p-3">Folio Pedido</th>
                  <th class="p-3">Cliente</th>
                  <th class="p-3 text-center">Piezas Asignadas</th>
                  <th class="p-3">Fecha Entrega</th>
                  <th class="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                ${eligibleOrders.map(o => `
                  <tr>
                    <td class="p-3 font-mono font-bold">${esc(o.order_id)}</td>
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${esc(o.cliente)}</td>
                    <td class="p-3 text-center font-bold font-mono text-amber-600 dark:text-amber-400">${o.piezas_asignadas} piezas</td>
                    <td class="p-3 font-mono text-slate-500">${esc(o.fecha_entrega)}</td>
                    <td class="p-3 text-center">
                      <button onclick="MartelaBilling.generateInvoice('${o.order_id}')" class="btn btn-gold text-xs py-1.5">
                        ⚡ Generar Prefactura Ahora
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Historial de Prefacturas Generadas -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Documentos de Facturación Generados</h3>
          <span class="text-xs text-slate-500">${invoices.length} documentos</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
              <tr>
                <th class="p-3.5">Folio Prefactura</th>
                <th class="p-3.5">Cliente</th>
                <th class="p-3.5">Pedido Origen</th>
                <th class="p-3.5">Fecha</th>
                <th class="p-3.5 text-center">Piezas</th>
                <th class="p-3.5 text-right">Subtotal</th>
                <th class="p-3.5 text-right">IVA (16%)</th>
                <th class="p-3.5 text-right">Total MXN</th>
                <th class="p-3.5 text-center">Auditoría PLD</th>
                <th class="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${invoices.map(inv => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td class="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">${esc(inv.id)}</td>
                  <td class="p-3.5 font-semibold text-slate-900 dark:text-white">${esc(inv.cliente)}</td>
                  <td class="p-3.5 font-mono text-slate-500">${esc(inv.order_id)}</td>
                  <td class="p-3.5 font-mono text-slate-400">${esc(inv.fecha)}</td>
                  <td class="p-3.5 text-center font-bold">${inv.piezas_count}</td>
                  <td class="p-3.5 text-right font-mono text-slate-500">${money(inv.subtotal)}</td>
                  <td class="p-3.5 text-right font-mono text-slate-500">${money(inv.impuesto)}</td>
                  <td class="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">${money(inv.total)}</td>
                  <td class="p-3.5 text-center">
                    <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
                      ${esc(inv.vinculo_pld)}
                    </span>
                  </td>
                  <td class="p-3.5 text-center">
                    <button onclick="MartelaBilling.verPrefactura('${inv.id}')" class="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                      Ver Documento →
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="text-[11px] text-slate-400 mt-3 text-center">
        * Documentos de demostración sin validez fiscal (CFDI / SAT). La integración de timbrado con PAC se define en fase productiva.
      </div>
    `;
  }

  async function generateInvoice(orderId) {
    try {
      const inv = await window.apiFacade.generateInvoiceForOrder(orderId);
      window.MartelaUI.toast(`Prefactura ${inv.id} emitida exitosamente`, 'success');
      render(document.getElementById('contentContainer'));
      verPrefactura(inv.id);
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function verPrefactura(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const { money, esc } = window.MartelaUI;

    const html = `
      <div id="printableInvoiceDoc" class="p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
        <!-- Cabecera Oficial con Logotipo SVG Martela -->
        <div class="flex justify-between items-start gap-4 pb-4 border-b-2 border-amber-500">
          <div class="flex items-center gap-3.5">
            <img src="assets/brand/martela-symbol-gold.svg" class="w-12 h-12 object-contain" alt="Martela">
            <div>
              <div class="text-2xl font-black tracking-widest text-slate-900 dark:text-white leading-none">MARTELA</div>
              <div class="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider mt-1">JOYERÍA FINA · CONTROL B2B</div>
              <div class="text-[10px] text-slate-400">RFC: MAR-880915-XYZ · Guadalajara, Jalisco, México</div>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
              PREFACTURA DE CONTROL
            </span>
            <div class="text-xl font-black font-mono mt-1.5">${esc(inv.id)}</div>
            <div class="text-xs text-slate-400">Fecha de Emisión: ${esc(inv.fecha)}</div>
          </div>
        </div>

        <!-- Datos del Cliente y Pedido -->
        <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
          <div>
            <div class="text-slate-400">Razón Social del Cliente:</div>
            <div class="font-bold text-sm text-slate-900 dark:text-white mt-0.5">${esc(inv.cliente)}</div>
            <div class="text-slate-500 mt-1">Pedido Relacionado: <b>${esc(inv.order_id)}</b></div>
          </div>
          <div class="text-right">
            <div class="text-slate-400">Expediente de Cumplimiento PLD:</div>
            <div class="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">${esc(inv.vinculo_pld)}</div>
            <div class="text-slate-500 mt-1">Total de Piezas Amparadas: <b>${inv.piezas_count} piezas</b></div>
          </div>
        </div>

        <!-- Resumen de Importes -->
        <div class="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-xs">
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Subtotal de Metal y Hechura:</span>
            <span class="font-mono font-semibold">${money(inv.subtotal)}</span>
          </div>
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Impuesto al Valor Agregado (16% IVA):</span>
            <span class="font-mono font-semibold">${money(inv.impuesto)}</span>
          </div>
          <div class="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Total Comercial a Liquidar:</span>
            <span class="text-xl font-mono text-amber-600 dark:text-amber-400">${money(inv.total)}</span>
          </div>
        </div>

        <div class="text-[10px] text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 italic">
          * Nota legal de demostración: Este documento es una prefactura de control interno y no sustituye un Comprobante Fiscal Digital por Internet (CFDI).
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-4">
        <button onclick="window.print()" class="btn btn-soft">
          <span>🖨️</span> Imprimir
        </button>
        <button onclick="MartelaBilling.downloadInvoiceHTML('${inv.id}')" class="btn btn-gold">
          <span>⇩</span> Descargar Archivo HTML
        </button>
      </div>
    `;

    window.MartelaUI.openModal(`Prefactura Comercial · ${inv.id}`, html, 'max-w-2xl');
  }

  function downloadInvoiceHTML(invoiceId) {
    const db = window.apiFacade._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const { money, esc } = window.MartelaUI;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Prefactura ${inv.id} — MARTELA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d4a017; padding-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 99px; font-weight: bold; font-size: 11px; }
    .box { background: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0; display: flex; justify-content: space-between; font-size: 13px; }
    .totals { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 20px; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-final { font-size: 20px; font-weight: bold; color: #b8860b; border-top: 2px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="assets/brand/martela-symbol-gold.svg" width="50" height="50" alt="Martela">
      <div>
        <h1 style="margin:0; letter-spacing: 2px;">MARTELA</h1>
        <div style="font-size:11px; color:#d4a017; font-weight:bold; letter-spacing:1px;">JOYERÍA FINA · PLATAFORMA B2B</div>
      </div>
    </div>
    <div style="text-align:right">
      <span class="badge">PREFACTURA DE CONTROL</span>
      <h2 style="margin:5px 0 0 0; font-family:monospace;">${esc(inv.id)}</h2>
      <small style="color:#64748b;">Fecha: ${esc(inv.fecha)}</small>
    </div>
  </div>

  <div class="box">
    <div>
      <div>Cliente: <b>${esc(inv.cliente)}</b></div>
      <div>Pedido: <b>${esc(inv.order_id)}</b></div>
    </div>
    <div style="text-align:right">
      <div>Auditoría PLD: <b>${esc(inv.vinculo_pld)}</b></div>
      <div>Piezas amparadas: <b>${inv.piezas_count} piezas</b></div>
    </div>
  </div>

  <div class="totals">
    <div class="total-row"><span>Subtotal Metal y Hechura:</span> <b>${money(inv.subtotal)}</b></div>
    <div class="total-row"><span>IVA (16%):</span> <b>${money(inv.impuesto)}</b></div>
    <div class="total-row total-final"><span>Total a Liquidar:</span> <b>${money(inv.total)}</b></div>
  </div>

  <p style="margin-top:30px; font-size:11px; color:#94a3b8; font-style:italic;">
    Documento de demostración sin validez fiscal (CFDI). Generado por la Plataforma Operativa Martela.
  </p>
</body>
</html>`;

    window.MartelaUI.downloadBlob(html, `prefactura-${inv.id}.html`, 'text/html');
  }

  function exportInvoicesExcel() {
    const db = window.apiFacade._getDB();
    const rows = db.invoices.map(i => ({
      'Folio Prefactura': i.id,
      'Cliente': i.cliente,
      'Pedido Relacionado': i.order_id,
      'Fecha Emisión': i.fecha,
      'Piezas Amparadas': i.piezas_count,
      'Subtotal (MXN)': i.subtotal,
      'IVA 16% (MXN)': i.impuesto,
      'Total (MXN)': i.total,
      'Folio PLD': i.vinculo_pld,
      'Estatus': i.estatus
    }));

    window.MartelaUI.exportToExcel(rows, `martela-prefacturas-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Prefacturas');
  }

  return {
    render,
    generateInvoice,
    verPrefactura,
    downloadInvoiceHTML,
    exportInvoicesExcel
  };
})();
