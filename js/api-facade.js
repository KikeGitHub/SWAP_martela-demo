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
      const parsed = JSON.parse(data);
      // Migración suave si faltan nuevas colecciones de facturación CFDI 4.0
      if (!parsed.payments_cxc || !parsed.credit_notes || !parsed.invoices?.[0]?.uuid) {
        const seed = window.MartelaSeed ? window.MartelaSeed.getInitialData() : {};
        if (!parsed.payments_cxc) parsed.payments_cxc = seed.payments_cxc || [];
        if (!parsed.credit_notes) parsed.credit_notes = seed.credit_notes || [];
        if (seed.invoices && (!parsed.invoices || !parsed.invoices[0]?.uuid)) {
          parsed.invoices = seed.invoices;
        }
        if (seed.clients && parsed.clients && !parsed.clients[0]?.regimen_fiscal) {
          parsed.clients = seed.clients;
        }
        this._saveDB(parsed);
      }
      return parsed;
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
  // 5. FACTURACIÓN ELECTRÓNICA & CFDI 4.0 (ASPEL-SAE SUITE)
  // ==========================================

  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  _generateSello() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let s = '';
    for (let i = 0; i < 172; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  async getInvoices(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...db.invoices];
    if (filters.cliente_id) res = res.filter(i => i.cliente_id === filters.cliente_id);
    if (filters.estatus_sat) res = res.filter(i => i.estatus_sat === filters.estatus_sat);
    if (filters.estatus_pago) res = res.filter(i => i.estatus_pago === filters.estatus_pago);
    if (filters.tipo_comprobante) res = res.filter(i => i.tipo_comprobante === filters.tipo_comprobante);
    return res;
  }

  async getInvoiceById(id) {
    await this._simulateNetwork(50);
    const db = this._getDB();
    return db.invoices.find(i => i.id === id) || null;
  }

  async getClients() {
    await this._simulateNetwork(60);
    const db = this._getDB();
    return db.clients;
  }

  async saveClient(clientData) {
    await this._simulateNetwork(100);
    const db = this._getDB();
    const idx = db.clients.findIndex(c => c.id === clientData.id);
    if (idx >= 0) {
      db.clients[idx] = { ...db.clients[idx], ...clientData };
    } else {
      const newId = `CLI-${String(db.clients.length + 1).padStart(3, '0')}`;
      clientData.id = newId;
      db.clients.push(clientData);
    }
    this._saveDB(db);
    await this.audit('GUARDAR_CLIENTE_FISCAL', 'Catálogo Clientes', clientData.rfc, clientData.razon_social || clientData.nombre);
    return clientData;
  }

  async generateInvoiceForOrder(orderId, options = {}) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    if (db.invoices.some(i => i.order_id === orderId && i.estatus_sat === 'VIGENTE')) {
      throw new Error("Ya existe una factura vigente emitida para este pedido.");
    }

    const assignedPieces = db.inventory_pieces.filter(p => p.order_id === orderId);
    if (assignedPieces.length === 0) {
      throw new Error("El pedido aún no tiene piezas físicas asignadas con serial.");
    }

    const rates = await this.getMetalRates();
    const precioGramoFino = rates.precio_gramo_fino_mxn;
    const client = db.clients.find(c => c.nombre === order.cliente || c.id === 'CLI-001') || db.clients[0];

    // Agrupar piezas por SKU para desglose de conceptos CFDI 4.0
    const skuMap = {};
    let totalGramos = 0;
    let subtotal = 0;

    assignedPieces.forEach(p => {
      totalGramos += p.peso_neto_g;
      if (!skuMap[p.sku_ref]) {
        const prod = db.products_sku.find(x => x.sku === p.sku_ref);
        skuMap[p.sku_ref] = {
          sku: p.sku_ref,
          descripcion: prod?.descripcion || p.sku_ref,
          quilataje: prod?.quilataje || '10K',
          clave_sat: "54111601", // Joyería de Oro SAT
          unidad_sat: "H87", // Pieza
          cantidad: 0,
          peso_neto_g: 0,
          hechura_unit: prod?.costo_hechura_base || 180,
          piezas_ids: []
        };
      }
      skuMap[p.sku_ref].cantidad++;
      skuMap[p.sku_ref].peso_neto_g += p.peso_neto_g;
      skuMap[p.sku_ref].piezas_ids.push(p.id);
    });

    const partidas = Object.values(skuMap).map(item => {
      const pureza = rates.coeficientes[item.quilataje] || 0.4167;
      const costoMetalPartida = item.peso_neto_g * precioGramoFino * pureza;
      const hechuraPartida = item.hechura_unit * item.cantidad;
      const importePartida = +(costoMetalPartida + hechuraPartida).toFixed(2);
      const valorUnitario = +(importePartida / item.cantidad).toFixed(2);
      const ivaPartida = +(importePartida * 0.16).toFixed(2);
      subtotal += importePartida;
      return {
        sku: item.sku,
        descripcion: item.descripcion,
        clave_sat: item.clave_sat,
        unidad_sat: item.unidad_sat,
        cantidad: item.cantidad,
        peso_neto_g: +item.peso_neto_g.toFixed(2),
        valor_unitario: valorUnitario,
        importe: importePartida,
        iva: ivaPartida,
        piezas_ids: item.piezas_ids.slice(0, 10) // Muestra representativa
      };
    });

    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto).toFixed(2);
    const folioNum = 1042 + db.invoices.length;
    const invId = `FAC-2026-${folioNum}`;
    const metodoPago = options.metodo_pago || client.metodo_pago_defecto || "PPD";
    const formaPago = options.forma_pago || (metodoPago === "PPD" ? "99" : (client.forma_pago_defecto || "03"));
    const uuid = this._generateUUID();

    const diasCredito = client.dias_credito || 30;
    const fechaEmision = new Date();
    const fechaVence = new Date();
    fechaVence.setDate(fechaEmision.getDate() + diasCredito);

    const newInvoice = {
      id: invId,
      serie: "A",
      folio: folioNum,
      uuid: uuid,
      order_id: orderId,
      cliente_id: client.id,
      cliente: client.nombre,
      razon_social: client.razon_social || client.nombre,
      rfc: client.rfc,
      regimen_fiscal: client.regimen_fiscal || "601",
      cp_fiscal: client.cp_fiscal || "80000",
      uso_cfdi: options.uso_cfdi || client.uso_cfdi || "G01",
      fecha: fechaEmision.toISOString().slice(0, 19),
      fecha_vencimiento: fechaVence.toISOString().slice(0, 10),
      tipo_comprobante: "I",
      metodo_pago: metodoPago,
      forma_pago: formaPago,
      forma_pago_desc: formaPago === "99" ? "Por definir (PPD)" : "Transferencia electrónica (SPEI)",
      condiciones_pago: metodoPago === "PPD" ? `Crédito ${diasCredito} días` : "Contado comercial",
      subtotal: +subtotal.toFixed(2),
      impuesto_iva: impuesto,
      total: total,
      saldo_pendiente: metodoPago === "PPD" ? total : 0.00,
      estatus_pago: metodoPago === "PPD" ? "PENDIENTE" : "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: assignedPieces.length,
      gramos_totales: +totalGramos.toFixed(2),
      vinculo_pld: `PLD-AUD-${Date.now().toString().slice(-6)}`,
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      no_certificado: "30001000000500003416",
      no_certificado_sat: "00001000000504465028",
      fecha_timbrado: fechaEmision.toISOString().slice(0, 19),
      partidas: partidas
    };

    db.invoices.unshift(newInvoice);
    order.estatus = 'FACTURADO';
    order.sucursales.forEach(s => s.factura_folio = invId);

    // Marcar piezas como FACTURADA
    assignedPieces.forEach(p => p.estatus = 'FACTURADA');

    this._saveDB(db);
    await this.audit('EMISION_CFDI_40', 'Facturación', invId, `UUID: ${uuid} | Total: $${total} MXN (${assignedPieces.length} piezas / ${newInvoice.gramos_totales}g)`);
    return newInvoice;
  }

  async createInvoiceDirect(data) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const client = db.clients.find(c => c.id === data.cliente_id) || db.clients[0];
    if (!client) throw new Error("Cliente fiscal no seleccionado.");

    if (!data.partidas || data.partidas.length === 0) {
      throw new Error("Debe agregar al menos una partida a la factura.");
    }

    let subtotal = 0;
    let totalGramos = 0;
    let totalPiezas = 0;

    const partidasFormateadas = data.partidas.map(p => {
      const cant = parseInt(p.cantidad) || 1;
      const vu = parseFloat(p.valor_unitario) || 0;
      const peso = parseFloat(p.peso_neto_g) || 0;
      const imp = +(cant * vu).toFixed(2);
      const iva = +(imp * 0.16).toFixed(2);
      subtotal += imp;
      totalGramos += peso;
      totalPiezas += cant;
      return {
        sku: p.sku || "JOYERIA-ORO",
        descripcion: p.descripcion || "Joyería Fina de Oro Martela",
        clave_sat: "54111601",
        unidad_sat: "H87",
        cantidad: cant,
        peso_neto_g: +peso.toFixed(2),
        valor_unitario: vu,
        importe: imp,
        iva: iva,
        piezas_ids: p.piezas_ids || []
      };
    });

    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto).toFixed(2);
    const folioNum = 1042 + db.invoices.length;
    const invId = `FAC-2026-${folioNum}`;
    const uuid = this._generateUUID();
    const metodoPago = data.metodo_pago || client.metodo_pago_defecto || "PUE";
    const formaPago = data.forma_pago || (metodoPago === "PPD" ? "99" : (client.forma_pago_defecto || "03"));
    const diasCredito = metodoPago === "PPD" ? (client.dias_credito || 15) : 0;

    const fechaEmision = new Date();
    const fechaVence = new Date();
    fechaVence.setDate(fechaEmision.getDate() + diasCredito);

    const newInvoice = {
      id: invId,
      serie: "A",
      folio: folioNum,
      uuid: uuid,
      order_id: data.order_id || "VENTA-DIRECTA",
      cliente_id: client.id,
      cliente: client.nombre,
      razon_social: client.razon_social || client.nombre,
      rfc: client.rfc,
      regimen_fiscal: client.regimen_fiscal || "601",
      cp_fiscal: client.cp_fiscal || "06000",
      uso_cfdi: data.uso_cfdi || client.uso_cfdi || "G01",
      fecha: fechaEmision.toISOString().slice(0, 19),
      fecha_vencimiento: fechaVence.toISOString().slice(0, 10),
      tipo_comprobante: "I",
      metodo_pago: metodoPago,
      forma_pago: formaPago,
      forma_pago_desc: formaPago === "03" ? "Transferencia electrónica (SPEI)" : formaPago === "01" ? "Efectivo" : formaPago === "17" ? "Compensación oro fino" : "Por definir",
      condiciones_pago: metodoPago === "PPD" ? `Crédito ${diasCredito} días` : "Contado comercial",
      subtotal: +subtotal.toFixed(2),
      impuesto_iva: impuesto,
      total: total,
      saldo_pendiente: metodoPago === "PPD" ? total : 0.00,
      estatus_pago: metodoPago === "PPD" ? "PENDIENTE" : "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: totalPiezas,
      gramos_totales: +totalGramos.toFixed(2),
      vinculo_pld: `PLD-AUD-${Date.now().toString().slice(-6)}`,
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      no_certificado: "30001000000500003416",
      no_certificado_sat: "00001000000504465028",
      fecha_timbrado: fechaEmision.toISOString().slice(0, 19),
      partidas: partidasFormateadas
    };

    // Actualizar piezas físicas seleccionadas a FACTURADA
    const allPieceIds = partidasFormateadas.flatMap(p => p.piezas_ids);
    allPieceIds.forEach(id => {
      const piece = db.inventory_pieces.find(p => p.id === id);
      if (piece) piece.estatus = 'FACTURADA';
    });

    db.invoices.unshift(newInvoice);
    this._saveDB(db);
    await this.audit('EMISION_FACTURA_DIRECTA', 'Facturación', invId, `Cliente: ${client.nombre} | UUID: ${uuid} | Total: $${total} MXN`);
    return newInvoice;
  }

  async cancelInvoice(invoiceId, reason = '02') {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error("Factura no encontrada.");

    if (inv.estatus_sat === 'CANCELADA') {
      throw new Error("Esta factura ya fue cancelada ante el SAT.");
    }

    inv.estatus_sat = 'CANCELADA';
    inv.fecha_cancelacion = new Date().toISOString();
    inv.motivo_cancelacion_sat = reason;
    inv.saldo_pendiente = 0.00;
    inv.estatus_pago = 'CANCELADA';

    // Liberar piezas físicas a inventario DISPONIBLE si corresponde
    if (inv.partidas) {
      const pieceIds = inv.partidas.flatMap(p => p.piezas_ids || []);
      pieceIds.forEach(pid => {
        const p = db.inventory_pieces.find(x => x.id === pid);
        if (p && p.estatus === 'FACTURADA') p.estatus = 'DISPONIBLE';
      });
    }

    this._saveDB(db);
    await this.audit('CANCELACION_CFDI', 'Facturación', invoiceId, `UUID: ${inv.uuid} | Motivo SAT: ${reason}`);
    return inv;
  }

  async getCxCSummary() {
    await this._simulateNetwork(80);
    const db = this._getDB();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const pendientes = db.invoices.filter(i => i.estatus_sat === 'VIGENTE' && i.saldo_pendiente > 0);
    let totalPorCobrar = 0;
    let totalVencido = 0;
    let totalCorriente = 0;

    const clienteMap = {};

    pendientes.forEach(i => {
      totalPorCobrar += i.saldo_pendiente;
      const esVencida = i.fecha_vencimiento && i.fecha_vencimiento < todayStr;
      if (esVencida) {
        totalVencido += i.saldo_pendiente;
      } else {
        totalCorriente += i.saldo_pendiente;
      }

      if (!clienteMap[i.cliente_id]) {
        const client = db.clients.find(c => c.id === i.cliente_id);
        clienteMap[i.cliente_id] = {
          cliente_id: i.cliente_id,
          cliente: i.cliente,
          rfc: i.rfc,
          limite_credito: client?.limite_credito || 1000000,
          saldo_total: 0,
          saldo_vencido: 0,
          facturas_count: 0,
          facturas: []
        };
      }
      clienteMap[i.cliente_id].saldo_total += i.saldo_pendiente;
      if (esVencida) clienteMap[i.cliente_id].saldo_vencido += i.saldo_pendiente;
      clienteMap[i.cliente_id].facturas_count++;
      clienteMap[i.cliente_id].facturas.push(i);
    });

    return {
      total_por_cobrar: +totalPorCobrar.toFixed(2),
      total_vencido: +totalVencido.toFixed(2),
      total_corriente: +totalCorriente.toFixed(2),
      facturas_pendientes_count: pendientes.length,
      clientes_cartera: Object.values(clienteMap)
    };
  }

  async getPayments(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...(db.payments_cxc || [])];
    if (filters.factura_id) res = res.filter(p => p.factura_id === filters.factura_id);
    if (filters.cliente_id) res = res.filter(p => p.cliente_id === filters.cliente_id);
    return res;
  }

  async registerPayment(paymentData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === paymentData.factura_id);
    if (!inv) throw new Error("Factura a abonar no encontrada.");

    if (inv.estatus_sat !== 'VIGENTE') {
      throw new Error("No se puede registrar pago a una factura cancelada.");
    }

    if (inv.saldo_pendiente <= 0) {
      throw new Error("La factura ya se encuentra liquidada en su totalidad.");
    }

    const monto = +parseFloat(paymentData.monto).toFixed(2);
    if (isNaN(monto) || monto <= 0) {
      throw new Error("Monto de pago inválido.");
    }

    if (monto > inv.saldo_pendiente) {
      throw new Error(`El monto ($${monto.toLocaleString()}) excede el saldo pendiente ($${inv.saldo_pendiente.toLocaleString()}).`);
    }

    const saldoAnterior = inv.saldo_pendiente;
    const saldoInsoluto = +(saldoAnterior - monto).toFixed(2);
    inv.saldo_pendiente = saldoInsoluto;
    inv.estatus_pago = saldoInsoluto <= 0.01 ? "PAGADA" : "PARCIAL";

    // Si el pago es compensación de oro fino (Forma 17), deducir gramos del cliente
    if (paymentData.forma_pago === '17') {
      const client = db.clients.find(c => c.id === inv.cliente_id);
      const gramosDeducir = parseFloat(paymentData.gramos_oro_compensados) || (monto / 1650);
      if (client && client.saldo_oro_fino_g) {
        client.saldo_oro_fino_g = Math.max(0, +(client.saldo_oro_fino_g - gramosDeducir).toFixed(2));
      }
    }

    const pagNum = 500 + (db.payments_cxc?.length || 0) + 1;
    const pagId = `PAG-2026-${String(pagNum).padStart(3, '0')}`;
    const uuid = this._generateUUID();
    const numParcialidad = (db.payments_cxc?.filter(p => p.factura_id === inv.id).length || 0) + 1;

    const newPayment = {
      id: pagId,
      serie: "P",
      folio: pagNum,
      uuid: uuid,
      factura_id: inv.id,
      factura_uuid: inv.uuid,
      cliente_id: inv.cliente_id,
      cliente: inv.cliente,
      rfc: inv.rfc,
      fecha: new Date().toISOString().slice(0, 19),
      monto: monto,
      forma_pago: paymentData.forma_pago || "03",
      forma_pago_desc: paymentData.forma_pago_desc || (paymentData.forma_pago === "17" ? "Compensación en oro fino" : "Transferencia electrónica (SPEI)"),
      numero_operacion: paymentData.numero_operacion || `SPEI-${Date.now().toString().slice(-7)}`,
      saldo_anterior: saldoAnterior,
      saldo_insoluto: saldoInsoluto,
      num_parcialidad: numParcialidad,
      estatus_sat: "VIGENTE",
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      notas: paymentData.notas || "Abono a cuenta comercial"
    };

    if (!db.payments_cxc) db.payments_cxc = [];
    db.payments_cxc.unshift(newPayment);

    this._saveDB(db);
    await this.audit('COMPLEMENTO_PAGO_REP', 'Cobranza', pagId, `Factura: ${inv.id} | Abono: $${monto} MXN | Saldo Insoluto: $${saldoInsoluto} MXN`);
    return newPayment;
  }

  async getCreditNotes(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...(db.credit_notes || [])];
    if (filters.factura_id) res = res.filter(n => n.factura_id === filters.factura_id);
    return res;
  }

  async createCreditNote(ncData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === ncData.factura_id);
    if (!inv) throw new Error("Factura origen no encontrada.");

    const subtotal = +parseFloat(ncData.subtotal).toFixed(2);
    if (isNaN(subtotal) || subtotal <= 0) throw new Error("Subtotal de la nota de crédito inválido.");

    const iva = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);

    // Ajustar saldo de la factura si tiene saldo pendiente
    if (inv.saldo_pendiente > 0) {
      inv.saldo_pendiente = Math.max(0, +(inv.saldo_pendiente - total).toFixed(2));
      if (inv.saldo_pendiente <= 0.01) inv.estatus_pago = "PAGADA";
    }

    // Si se canalizan piezas a fundición
    if (ncData.canalizar_a_fundicion && ncData.peso_g) {
      const fundLog = {
        id: `FUN-2026-${String(db.foundry_logs.length + 1).padStart(3, '0')}`,
        fecha: new Date().toISOString().slice(0, 10),
        tecnico: "Control de Calidad / Devoluciones",
        piezas_origen: [`DEV-${inv.id}`],
        peso_entrada_g: parseFloat(ncData.peso_g) || 5.0,
        peso_recuperado_g: 0,
        diferencia_g: 0,
        merma_confirmada_g: 0,
        bote_rebabas_analisis_g: 0,
        estatus: "EN_COLA_FUNDICION",
        ley_oro_obtenida: "Por fundir",
        acta_folio: `DEV-NC-${Date.now().toString().slice(-4)}`,
        notas: `Piezas devueltas amparadas por nota de crédito. Motivo: ${ncData.motivo}`
      };
      db.foundry_logs.unshift(fundLog);
    }

    const ncNum = 100 + (db.credit_notes?.length || 0) + 1;
    const ncId = `NC-2026-${String(ncNum).padStart(3, '0')}`;
    const uuid = this._generateUUID();

    const newNC = {
      id: ncId,
      serie: "NC",
      folio: ncNum,
      uuid: uuid,
      factura_id: inv.id,
      factura_uuid: inv.uuid,
      cliente_id: inv.cliente_id,
      cliente: inv.cliente,
      rfc: inv.rfc,
      fecha: new Date().toISOString().slice(0, 19),
      subtotal: subtotal,
      impuesto_iva: iva,
      total: total,
      motivo: ncData.motivo || "Devolución o bonificación comercial",
      tipo_relacion: "01",
      tipo_relacion_desc: "Nota de crédito de los documentos relacionados",
      estatus_sat: "VIGENTE",
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello()
    };

    if (!db.credit_notes) db.credit_notes = [];
    db.credit_notes.unshift(newNC);

    this._saveDB(db);
    await this.audit('NOTA_CREDITO_CFDI', 'Facturación', ncId, `Factura Origen: ${inv.id} | Total NC: $${total} MXN | Motivo: ${newNC.motivo}`);
    return newNC;
  }

  // ==========================================
  // GENERADORES FORMALES DE XML CFDI 4.0
  // ==========================================

  generateCFDI40XML(inv) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const conceptosXml = (inv.partidas || []).map(p => `
    <cfdi:Concepto ClaveProdServ="${p.clave_sat || '54111601'}" NoIdentificacion="${escXml(p.sku)}" Cantidad="${p.cantidad}" ClaveUnidad="${p.unidad_sat || 'H87'}" Unidad="Pieza" Descripcion="${escXml(p.descripcion)} (Peso neto: ${p.peso_neto_g}g)" ValorUnitario="${p.valor_unitario.toFixed(2)}" Importe="${p.importe.toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${p.importe.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${p.iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="4.0" Serie="${inv.serie || 'A'}" Folio="${inv.folio || '1001'}" Fecha="${inv.fecha}" Sello="${inv.sello_cfd || this._generateSello()}" FormaPago="${inv.forma_pago || '03'}" NoCertificado="${inv.no_certificado || '30001000000500003416'}" SubTotal="${inv.subtotal.toFixed(2)}" Moneda="MXN" Total="${inv.total.toFixed(2)}" TipoDeComprobante="${inv.tipo_comprobante || 'I'}" Exportacion="01" MetodoPago="${inv.metodo_pago || 'PUE'}" LugarExpedicion="44100">
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${inv.rfc || 'XAXX010101000'}" Nombre="${escXml(inv.razon_social || inv.cliente)}" DomicilioFiscalReceptor="${inv.cp_fiscal || '06000'}" RegimenFiscalReceptor="${inv.regimen_fiscal || '601'}" UsoCFDI="${inv.uso_cfdi || 'G01'}"/>
  <cfdi:Conceptos>${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${inv.impuesto_iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${inv.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${inv.impuesto_iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${inv.uuid}" FechaTimbrado="${inv.fecha_timbrado || inv.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${inv.sello_cfd || this._generateSello()}" NoCertificadoSAT="${inv.no_certificado_sat || '00001000000504465028'}" SelloSAT="${inv.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  generateREPDocumentXML(payment) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:pago20="http://www.sat.gob.mx/Pagos20" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="${payment.serie || 'P'}" Folio="${payment.folio || '501'}" Fecha="${payment.fecha}" Sello="${payment.sello_cfd || this._generateSello()}" NoCertificado="30001000000500003416" SubTotal="0" Moneda="XXX" Total="0" TipoDeComprobante="P" Exportacion="01" LugarExpedicion="44100">
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${payment.rfc}" Nombre="${escXml(payment.cliente)}" DomicilioFiscalReceptor="80000" RegimenFiscalReceptor="601" UsoCFDI="CP01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <pago20:Pagos Version="2.0">
      <pago20:Totales MontoTotalPagos="${payment.monto.toFixed(2)}"/>
      <pago20:Pago FechaPago="${payment.fecha}" FormaDePagoP="${payment.forma_pago}" MonedaP="MXN" Monto="${payment.monto.toFixed(2)}" NumOperacion="${escXml(payment.numero_operacion)}">
        <pago20:DoctoRelacionado IdDocumento="${payment.factura_uuid}" Serie="A" Folio="${payment.factura_id}" MonedaDR="MXN" NumParcialidad="${payment.num_parcialidad}" ImpSaldoAnt="${payment.saldo_anterior.toFixed(2)}" ImpPagado="${payment.monto.toFixed(2)}" ImpSaldoInsoluto="${payment.saldo_insoluto.toFixed(2)}" ObjetoImpDR="01"/>
      </pago20:Pago>
    </pago20:Pagos>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${payment.uuid}" FechaTimbrado="${payment.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${payment.sello_cfd || this._generateSello()}" NoCertificadoSAT="00001000000504465028" SelloSAT="${payment.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  generateNCXML(nc) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="${nc.serie || 'NC'}" Folio="${nc.folio || '101'}" Fecha="${nc.fecha}" Sello="${nc.sello_cfd || this._generateSello()}" FormaPago="03" NoCertificado="30001000000500003416" SubTotal="${nc.subtotal.toFixed(2)}" Moneda="MXN" Total="${nc.total.toFixed(2)}" TipoDeComprobante="E" Exportacion="01" MetodoPago="PUE" LugarExpedicion="44100">
  <cfdi:CfdiRelacionados TipoRelacion="01">
    <cfdi:CfdiRelacionado UUID="${nc.factura_uuid}"/>
  </cfdi:CfdiRelacionados>
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${nc.rfc}" Nombre="${escXml(nc.cliente)}" DomicilioFiscalReceptor="97000" RegimenFiscalReceptor="601" UsoCFDI="G02"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" NoIdentificacion="NC-DESCUENTO" Cantidad="1" ClaveUnidad="ACT" Unidad="Servicio" Descripcion="${escXml(nc.motivo)}" ValorUnitario="${nc.subtotal.toFixed(2)}" Importe="${nc.subtotal.toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${nc.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${nc.impuesto_iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${nc.impuesto_iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${nc.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${nc.impuesto_iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${nc.uuid}" FechaTimbrado="${nc.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${nc.sello_cfd || this._generateSello()}" NoCertificadoSAT="00001000000504465028" SelloSAT="${nc.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
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
