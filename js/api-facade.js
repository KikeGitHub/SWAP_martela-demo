/**
 * MARTELA — Capa de Servicios y Fachada API (ApiFacade)
 * Implementa el Patrón Facade desacoplando la interfaz de usuario de la persistencia LocalStorage
 * y simulando la latencia de red mediante Promises (preparado para futura migración a Spring Boot).
 */
class ApiFacade {
  constructor() {
    this.storageKey = 'martela_enterprise_db';
    this.initDatabase();
  }

  initDatabase(forceReset = false) {
    if (forceReset || !localStorage.getItem(this.storageKey)) {
      if (window.MartelaSeed) {
        const initial = window.MartelaSeed.getInitialData();
        localStorage.setItem(this.storageKey, JSON.stringify(initial));
      }
    }
  }

  _getDB() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        this.initDatabase(true);
        return JSON.parse(localStorage.getItem(this.storageKey));
      }
      return JSON.parse(data);
    } catch (e) {
      this.initDatabase(true);
      return JSON.parse(localStorage.getItem(this.storageKey));
    }
  }

  _saveDB(db) {
    localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  // Simulación de retraso de red REST API (120ms - 220ms)
  async _simulateNetwork(ms = 150) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auditoría centralizada
  async audit(action, entity, recordId, result = "Correcto") {
    const db = this._getDB();
    const currentUser = window.MartelaAuth?.getCurrentUser() || { name: 'Sistema', role: 'Sistema' };
    const log = {
      id: `AUD-${Date.now()}`,
      fecha: new Date().toLocaleString('es-MX', { hour12: false }),
      usuario: currentUser.name,
      rol: currentUser.role,
      accion: action,
      entidad: entity,
      registro_id: String(recordId),
      resultado: result
    };
    db.audit_logs.unshift(log);
    db.audit_logs = db.audit_logs.slice(0, 500); // Límite 500
    this._saveDB(db);
    return log;
  }

  // ==========================================
  // 1. DASHBOARD & MÉTRICAS GENERALES
  // ==========================================
  async getDashboardSummary() {
    await this._simulateNetwork();
    const db = this._getDB();
    const rates = db.metal_rates;
    const fixMayor = Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd);
    const precioGramoFino = (fixMayor * rates.tipo_cambio_usd_mxn) / 31.1035;

    const availablePieces = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');
    const totalGramsAvailable = availablePieces.reduce((sum, p) => sum + p.peso_neto_g, 0);

    // Valuación estimada de inventario disponible
    let valorEstimadoTotal = 0;
    availablePieces.forEach(piece => {
      const prod = db.products_sku.find(p => p.sku === piece.sku_ref);
      const pureza = rates.coeficientes[prod?.quilataje || '10K'] || 0.4167;
      const costoMetal = piece.peso_neto_g * precioGramoFino * pureza;
      const hechura = prod?.costo_hechura_base || 180;
      valorEstimadoTotal += (costoMetal + hechura);
    });

    // Pedidos pendientes
    const openOrders = db.coppel_orders.filter(o => o.estatus !== 'ENTREGADO');

    // Alertas de campeones / bajo stock
    const lowStockSku = db.products_sku.filter(sku => {
      const count = availablePieces.filter(p => p.sku_ref === sku.sku).length;
      return count < sku.stock_minimo;
    });

    return {
      piezas_disponibles: availablePieces.length,
      peso_neto_disponible_g: +totalGramsAvailable.toFixed(2),
      valor_estimado_mxn: +valorEstimadoTotal.toFixed(2),
      pedidos_abiertos: openOrders.length,
      alertas_reorden_campeones: lowStockSku.length,
      almacenes_count: db.warehouses.length,
      fix_aplicado_usd: fixMayor,
      precio_gramo_fino_mxn: +precioGramoFino.toFixed(2),
      actividad_reciente: db.audit_logs.slice(0, 6)
    };
  }

  // ==========================================
  // 2. CATÁLOGO & INVENTARIO POR PIEZA INDIVIDUAL
  // ==========================================
  async getProductsCatalog() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.products_sku;
  }

  async getPieceInventoryBySKU(sku) {
    await this._simulateNetwork();
    const db = this._getDB();
    const prod = db.products_sku.find(p => p.sku === sku);
    const pieces = db.inventory_pieces.filter(p => p.sku_ref === sku && p.estatus !== 'VENDIDA');
    const available = pieces.filter(p => p.estatus === 'DISPONIBLE');
    const totalGrams = pieces.reduce((sum, p) => sum + p.peso_neto_g, 0);

    return {
      producto: prod,
      sku: sku,
      total_piezas: pieces.length,
      disponibles_count: available.length,
      total_gramos: +totalGrams.toFixed(2),
      piezas: pieces
    };
  }

  async getInventoryMasterTable(filters = {}) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { query = '', almacen = '', quilataje = '', estatus = '' } = filters;

    // Agrupar por SKU
    return db.products_sku.map(prod => {
      let pieces = db.inventory_pieces.filter(p => p.sku_ref === prod.sku);
      
      if (almacen) pieces = pieces.filter(p => p.almacen_id === almacen);
      if (estatus) pieces = pieces.filter(p => p.estatus === estatus);

      const disponibles = pieces.filter(p => p.estatus === 'DISPONIBLE');
      const totalGrams = pieces.reduce((s, p) => s + p.peso_neto_g, 0);

      return {
        ...prod,
        piezas_total: pieces.length,
        piezas_disponibles: disponibles.length,
        peso_neto_total_g: +totalGrams.toFixed(2),
        sub_piezas: pieces,
        alerta_stock: disponibles.length < prod.stock_minimo
      };
    }).filter(item => {
      if (quilataje && item.quilataje !== quilataje) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return item.sku.toLowerCase().includes(q) ||
             item.descripcion.toLowerCase().includes(q) ||
             item.categoria.toLowerCase().includes(q);
    });
  }

  async createPhysicalPiece(pieceData) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { sku_ref, peso_bruto_g, peso_neto_g, almacen_id, estatus = 'DISPONIBLE' } = pieceData;

    if (!sku_ref || !peso_neto_g || !peso_bruto_g || !almacen_id) {
      throw new Error("Datos incompletos para registrar la pieza física.");
    }
    if (peso_neto_g > peso_bruto_g) {
      throw new Error("El peso neto no puede exceder al peso bruto.");
    }

    db.counter = (db.counter || 500) + 1;
    const piece_id = `PZ-2026-${String(db.counter).padStart(4, "0")}`;

    const newPiece = {
      piece_id,
      sku_ref,
      peso_bruto_g: +peso_bruto_g.toFixed(2),
      peso_neto_g: +peso_neto_g.toFixed(2),
      almacen_id,
      estatus,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      order_id: null,
      box_id: null,
      store_id: null
    };

    db.inventory_pieces.unshift(newPiece);
    this._saveDB(db);
    await this.audit('ALTA_PIEZA', 'Inventario', piece_id, `${peso_neto_g}g en ${almacen_id}`);
    return newPiece;
  }

  async transferPiece(pieceId, targetWarehouseId) {
    await this._simulateNetwork();
    const db = this._getDB();
    const piece = db.inventory_pieces.find(p => p.piece_id === pieceId);

    if (!piece) throw new Error("Pieza física no encontrada.");
    if (piece.estatus !== 'DISPONIBLE') {
      throw new Error(`Solo se pueden transferir piezas DISPONIBLES (Estatus actual: ${piece.estatus}).`);
    }

    const previousWarehouse = piece.almacen_id;
    piece.almacen_id = targetWarehouseId;

    // Si se transfiere al taller de fundición, cambia su estatus
    if (targetWarehouseId === 'TALLER_FUNDICION') {
      piece.estatus = 'EN_FUNDICION';
    }

    this._saveDB(db);
    await this.audit('TRANSFERENCIA_PIEZA', 'Inventario', pieceId, `${previousWarehouse} ➔ ${targetWarehouseId}`);
    return piece;
  }

  // ==========================================
  // 3. MOTOR DE COTIZACIÓN DINÁMICA (FIX ORO)
  // ==========================================
  async getMetalRates() {
    await this._simulateNetwork(80);
    const db = this._getDB();
    const r = db.metal_rates;
    const fixMayor = Math.max(r.fix_oro_hoy_usd, r.fix_oro_ayer_usd);
    const regla = r.fix_oro_ayer_usd >= r.fix_oro_hoy_usd ? "FIX DE AYER (Mayor valor)" : "FIX DE HOY (Mayor valor)";
    const precioGramoFino = (fixMayor * r.tipo_cambio_usd_mxn) / 31.1035;

    return {
      ...r,
      fix_aplicado_usd: fixMayor,
      regla_descripcion: regla,
      precio_gramo_fino_mxn: +precioGramoFino.toFixed(2)
    };
  }

  async updateMetalRates(newRates) {
    await this._simulateNetwork();
    const db = this._getDB();
    db.metal_rates = {
      ...db.metal_rates,
      ...newRates,
      fecha_hoy: new Date().toISOString().slice(0, 10)
    };
    this._saveDB(db);
    await this.audit('ACTUALIZACION_METALES', 'Cotizador', 'FIX', `Hoy: $${newRates.fix_oro_hoy_usd} | Ayer: $${newRates.fix_oro_ayer_usd}`);
    return this.getMetalRates();
  }

  async calculateDynamicPrice(pesoGramos, hechura, quilataje = "10K") {
    await this._simulateNetwork(60);
    const db = this._getDB();
    const rates = db.metal_rates;
    const fixMayor = Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd);
    const pureza = rates.coeficientes[quilataje] || 0.4167;
    const precioGramoFino = (fixMayor * rates.tipo_cambio_usd_mxn) / 31.1035;
    const precioGramoQuilataje = precioGramoFino * pureza;
    const costoMetal = pesoGramos * precioGramoQuilataje;
    const precioFinal = costoMetal + hechura;

    return {
      fix_usado: fixMayor,
      precio_gramo_fino: +precioGramoFino.toFixed(2),
      pureza_porcentaje: (pureza * 100).toFixed(1) + "%",
      precio_gramo_quilataje: +precioGramoQuilataje.toFixed(2),
      costo_metal: +costoMetal.toFixed(2),
      costo_hechura: +hechura.toFixed(2),
      precio_final: +precioFinal.toFixed(2)
    };
  }

  // ==========================================
  // 4. MÓDULO COPPEL B2B (DESPIECE Y EMBARQUE)
  // ==========================================
  async getCoppelOrders() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.coppel_orders;
  }

  async getCoppelOrderById(orderId) {
    await this._simulateNetwork();
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido Coppel no encontrado.");
    return order;
  }

  async assignPiecesToCoppelOrder(orderId) {
    await this._simulateNetwork(350);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    const available = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');
    const needed = order.total_piezas - order.piezas_asignadas;

    if (available.length < needed) {
      throw new Error(`Inventario insuficiente: Se requieren ${needed} piezas disponibles en bóveda y solo hay ${available.length}.`);
    }

    // Asignación determinista por tienda y caja
    let assignedIndex = 0;
    order.sucursales.forEach(sucursal => {
      const faltantesTienda = sucursal.piezas_solicitadas - sucursal.piezas_asignadas_ids.length;
      if (faltantesTienda > 0) {
        for (let i = 0; i < faltantesTienda; i++) {
          const piece = available[assignedIndex++];
          piece.estatus = 'ASIGNADA';
          piece.order_id = orderId;
          piece.store_id = sucursal.tienda_id;
          piece.box_id = `CAJA-${String(sucursal.caja_sugerida).padStart(2, '0')}`;
          sucursal.piezas_asignadas_ids.push(piece.piece_id);
        }
        sucursal.estatus_empaque = 'LISTO_PARA_EMPAQUE';
      }
    });

    order.piezas_asignadas = order.total_piezas;
    order.estatus = 'ASIGNADO';

    this._saveDB(db);
    await this.audit('ASIGNACION_MASIVA_COPPEL', 'Pedido B2B', orderId, `${needed} piezas asignadas a 26 sucursales`);
    return order;
  }

  // ==========================================
  // 5. FACTURACIÓN Y PREFACTURAS
  // ==========================================
  async getInvoices() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.invoices;
  }

  async generateInvoiceForOrder(orderId) {
    await this._simulateNetwork();
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    if (db.invoices.some(i => i.order_id === orderId)) {
      throw new Error("Ya existe una prefactura para este pedido.");
    }

    const assignedPieces = db.inventory_pieces.filter(p => p.order_id === orderId);
    if (assignedPieces.length === 0) {
      throw new Error("El pedido aún no tiene piezas físicas asignadas.");
    }

    const rates = await this.getMetalRates();
    const precioGramoFino = rates.precio_gramo_fino_mxn;

    let subtotal = 0;
    assignedPieces.forEach(p => {
      const prod = db.products_sku.find(x => x.sku === p.sku_ref);
      const pureza = rates.coeficientes[prod?.quilataje || '10K'] || 0.4167;
      const costoMetal = p.peso_neto_g * precioGramoFino * pureza;
      const hechura = prod?.costo_hechura_base || 180;
      subtotal += (costoMetal + hechura);
    });

    const impuesto = subtotal * 0.16;
    const total = subtotal + impuesto;
    const invId = `PRE-2026-${String(db.invoices.length + 1).padStart(4, '0')}`;

    const newInvoice = {
      id: invId,
      order_id: orderId,
      cliente: order.cliente,
      fecha: new Date().toISOString().slice(0, 10),
      subtotal: +subtotal.toFixed(2),
      impuesto: +impuesto.toFixed(2),
      total: +total.toFixed(2),
      estatus: "Prefactura de demostración",
      piezas_count: assignedPieces.length,
      vinculo_pld: `PLD-AUD-${Date.now().toString().slice(-6)}`
    };

    db.invoices.unshift(newInvoice);
    order.estatus = 'FACTURADO';

    // Vincular folio a sucursales
    order.sucursales.forEach(s => s.factura_folio = invId);

    this._saveDB(db);
    await this.audit('GENERACION_PREFACTURA', 'Facturación', invId, `Total: $${newInvoice.total} MXN (${assignedPieces.length} piezas)`);
    return newInvoice;
  }

  // ==========================================
  // 6. LOGÍSTICA PWA CHOFER & ENTREGAS (PLD)
  // ==========================================
  async getRoutes() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.routes;
  }

  async confirmDeliveryStop(routeId, paradaId, deliveryData) {
    await this._simulateNetwork(200);
    const db = this._getDB();
    const route = db.routes.find(r => r.id === routeId);
    if (!route) throw new Error("Ruta no encontrada.");

    const stop = route.paradas.find(p => p.parada_id === paradaId);
    if (!stop) throw new Error("Parada no encontrada.");

    const { receptor_nombre, firma_canvas_data, evidencia_sello_url, observaciones } = deliveryData;

    stop.estatus = 'ENTREGADA';
    stop.hora_llegada = stop.hora_llegada || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.hora_salida = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.receptor_nombre = receptor_nombre;
    stop.firma_canvas_data = firma_canvas_data;
    stop.evidencia_sello_url = evidencia_sello_url;
    stop.observaciones = observaciones || stop.observaciones;

    // Si todas las paradas terminaron, marcar ruta como completa
    if (route.paradas.every(p => p.estatus === 'ENTREGADA')) {
      route.estatus = 'COMPLETADA';
    }

    this._saveDB(db);
    await this.audit('ENTREGA_CONCILIADA_PLD', 'Logística PWA', `${routeId} / ${stop.sucursal}`, `Recibió: ${receptor_nombre} | Sello Adjunto`);
    return stop;
  }

  // ==========================================
  // 7. TALLER DE FUNDICIÓN Y MERMAS
  // ==========================================
  async getFoundryLogs() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.foundry_logs;
  }

  async createFoundryBatch(batchData) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { peso_entrada_g, peso_recuperado_g, tecnico, notas } = batchData;

    if (peso_recuperado_g > peso_entrada_g) {
      throw new Error("El peso recuperado no puede exceder al peso de entrada de metal.");
    }

    const diferencia = +(peso_entrada_g - peso_recuperado_g).toFixed(2);
    // Estimación controlada de merma real vs residuo recuperable
    const merma_confirmada = +(diferencia * 0.20).toFixed(2);
    const bote_rebabas = +(diferencia - merma_confirmada).toFixed(2);

    const id = `FUN-2026-${String(db.foundry_logs.length + 2).padStart(3, '0')}`;
    const newBatch = {
      id,
      fecha: new Date().toISOString().slice(0, 10),
      tecnico: tecnico || "Roberto Silva",
      piezas_origen: ["LOTE-ROT-" + Date.now().toString().slice(-4)],
      peso_entrada_g: +peso_entrada_g.toFixed(2),
      peso_recuperado_g: +peso_recuperado_g.toFixed(2),
      diferencia_g: diferencia,
      merma_confirmada_g: merma_confirmada,
      bote_rebabas_analisis_g: bote_rebabas,
      estatus: "PENDIENTE_CONCILIACION",
      ley_oro_obtenida: "14K (58.3%)",
      acta_folio: `ACTA-FUND-${Date.now().toString().slice(-4)}`,
      notas: notas || "Fusión interna con control de rebabas."
    };

    db.foundry_logs.unshift(newBatch);
    this._saveDB(db);
    await this.audit('LOTE_FUNDICION', 'Fundición', id, `Entrada: ${peso_entrada_g}g | Salida: ${peso_recuperado_g}g | Dif: ${diferencia}g`);
    return newBatch;
  }

  // ==========================================
  // 8. INTELIGENCIA DE STOCK & CAMPEONES
  // ==========================================
  async getStockIntelligenceReport() {
    await this._simulateNetwork();
    const db = this._getDB();
    const pieces = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');

    return db.products_sku.map(prod => {
      const disponibles = pieces.filter(p => p.sku_ref === prod.sku).length;
      const consumoDiarioSimulado = prod.es_campeon ? 2.5 : 0.8;
      const diasInventario = +(disponibles / consumoDiarioSimulado).toFixed(0);
      const puntoReorden = +(consumoDiarioSimulado * prod.lead_time_dias).toFixed(0);
      const riesgoDesabasto = disponibles < prod.stock_minimo;
      const sugerenciaCompra = riesgoDesabasto ? Math.max(prod.stock_minimo * 2 - disponibles, 30) : 0;

      return {
        sku: prod.sku,
        descripcion: prod.descripcion,
        quilataje: prod.quilataje,
        es_campeon: prod.es_campeon,
        disponibles: disponibles,
        stock_minimo: prod.stock_minimo,
        lead_time_dias: prod.lead_time_dias,
        dias_inventario: diasInventario,
        punto_reorden: puntoReorden,
        riesgo_desabasto: riesgoDesabasto,
        sugerencia_compra: sugerenciaCompra
      };
    });
  }

  // ==========================================
  // 9. MAQUILA & MONTEPÍO
  // ==========================================
  async getMaquilaCompensations() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.maquila_compensations;
  }

  // ==========================================
  // 10. AUDITORÍA & RESTAURACIÓN
  // ==========================================
  async getAuditLogs() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.audit_logs;
  }

  async resetDemo() {
    this.initDatabase(true);
    await this.audit('REINICIO_SISTEMA', 'Sistema', 'RESET', 'Restablecimiento a valores de demostración iniciales');
    return true;
  }

  async exportBackupJSON() {
    const db = this._getDB();
    return JSON.stringify(db, null, 2);
  }
}

// Instancia global accesible por la UI
window.apiFacade = new ApiFacade();
