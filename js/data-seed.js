/**
 * MARTELA — Semilla de Datos Iniciales (Demo PoC)
 * Modelado para la operación real de joyería de oro con trazabilidad por pieza individual.
 */
window.MartelaSeed = (function() {
  const products_sku = [
    {
      sku: "ANILLO-SOL-10K",
      descripcion: "Anillo Solitario de Oro Amarillo 10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      costo_hechura_base: 180.00,
      es_campeon: true,
      stock_minimo: 50,
      lead_time_dias: 90,
      categoria: "Anillos",
      activo: true
    },
    {
      sku: "ESCLAVA-ORO-14K",
      descripcion: "Esclava Clásica Tejido Cubano 14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      costo_hechura_base: 260.00,
      es_campeon: true,
      stock_minimo: 40,
      lead_time_dias: 75,
      categoria: "Esclavas",
      activo: true
    },
    {
      sku: "CADENA-ROLO-10K",
      descripcion: "Cadena Rolo Eslabón Italiano 10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      costo_hechura_base: 220.00,
      es_campeon: true,
      stock_minimo: 45,
      lead_time_dias: 60,
      categoria: "Cadenas",
      activo: true
    },
    {
      sku: "ARETE-ARO-14K",
      descripcion: "Arete Tipo Arrancada Mediana 14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      costo_hechura_base: 150.00,
      es_campeon: false,
      stock_minimo: 30,
      lead_time_dias: 60,
      categoria: "Aretes",
      activo: true
    },
    {
      sku: "DIJE-CORAZON-10K",
      descripcion: "Dije Corazón Troquelado 10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      costo_hechura_base: 130.00,
      es_campeon: false,
      stock_minimo: 35,
      lead_time_dias: 90,
      categoria: "Dijes",
      activo: true
    },
    {
      sku: "ANILLO-SELLO-14K",
      descripcion: "Anillo Sello Grabable Oro 14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      costo_hechura_base: 320.00,
      es_campeon: false,
      stock_minimo: 25,
      lead_time_dias: 90,
      categoria: "Anillos",
      activo: true
    },
    {
      sku: "PULSERA-ESLABON-18K",
      descripcion: "Pulsera de Eslabón Fino Oro 18K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "18K",
      costo_hechura_base: 380.00,
      es_campeon: true,
      stock_minimo: 20,
      lead_time_dias: 90,
      categoria: "Pulseras",
      activo: true
    },
    {
      sku: "CADENA-FIGARO-14K",
      descripcion: "Cadena Fígaro 3x1 Diamantada 14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      costo_hechura_base: 290.00,
      es_campeon: false,
      stock_minimo: 30,
      lead_time_dias: 60,
      categoria: "Cadenas",
      activo: true
    },
    {
      sku: "CRUZ-LISA-10K",
      descripcion: "Dije Cruz Lisa Tradicional 10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      costo_hechura_base: 115.00,
      es_campeon: false,
      stock_minimo: 40,
      lead_time_dias: 75,
      categoria: "Dijes",
      activo: true
    },
    {
      sku: "MEDALLA-OVAL-14K",
      descripcion: "Medalla Ovalada Bautizo 14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      costo_hechura_base: 175.00,
      es_campeon: false,
      stock_minimo: 25,
      lead_time_dias: 75,
      categoria: "Medallas",
      activo: true
    },
    {
      sku: "ANILLO-TRIO-18K",
      descripcion: "Anillo Trío Tres Oros (Amarillo, Blanco, Rosa) 18K",
      tipo_metal: "ORO_TRICOLOR",
      quilataje: "18K",
      costo_hechura_base: 410.00,
      es_campeon: true,
      stock_minimo: 15,
      lead_time_dias: 90,
      categoria: "Anillos",
      activo: true
    },
    {
      sku: "CADENA-ITALIANA-10K",
      descripcion: "Cadena Italiana Tejido Palma 10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      costo_hechura_base: 200.00,
      es_campeon: false,
      stock_minimo: 35,
      lead_time_dias: 60,
      categoria: "Cadenas",
      activo: true
    }
  ];

  const warehouses = [
    { id: "BOVEDA_GENERAL", nombre: "Bóveda General", tipo: "Seguridad Alta" },
    { id: "ALMACEN_COPPEL", nombre: "Almacén Coppel", tipo: "Picking B2B" },
    { id: "SUCURSAL_CDMX", nombre: "Sucursal CDMX", tipo: "Exhibición / Mostrador" },
    { id: "SUCURSAL_MERIDA", nombre: "Sucursal Mérida", tipo: "Exhibición / Mostrador" },
    { id: "TALLER_FUNDICION", nombre: "Taller de Fundición", tipo: "Procesamiento y Mermas" }
  ];

  const metal_rates = {
    fecha_hoy: "2026-10-17",
    fix_oro_hoy_usd: 2650.00,
    fix_oro_ayer_usd: 2680.00,
    tipo_cambio_usd_mxn: 19.50,
    regla_aplicada: "MAYOR_VALOR",
    coeficientes: {
      "10K": 10 / 24, // 0.4167
      "14K": 14 / 24, // 0.5833
      "18K": 18 / 24, // 0.7500
      "22K": 22 / 24  // 0.9167
    }
  };

  const clients = [
    {
      id: "CLI-001",
      nombre: "Coppel S.A. de C.V.",
      razon_social: "COPPEL S.A. DE C.V.",
      rfc: "COP920428Q20",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "80000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "facturacion.proveedores@coppel.com",
      condicion_pago: "30 días",
      dias_credito: 30,
      limite_credito: 5000000.00,
      metodo_pago_defecto: "PPD",
      forma_pago_defecto: "99",
      contacto: "Gerencia de Compras Joyería",
      cedis_principal: "CEDIS Iztapalapa",
      sucursales_activas: 26
    },
    {
      id: "CLI-002",
      nombre: "Joyas del Centro Mayoristas",
      razon_social: "JOYAS DEL CENTRO MAYORISTAS S.A. DE C.V.",
      rfc: "JCE850201BB2",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "06000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "pagos@joyasdelcentro.com.mx",
      condicion_pago: "Contado",
      dias_credito: 0,
      limite_credito: 500000.00,
      metodo_pago_defecto: "PUE",
      forma_pago_defecto: "03",
      contacto: "Lic. Fernando Robles",
      sucursales_activas: 1
    },
    {
      id: "CLI-003",
      nombre: "Distribuidora del Sureste",
      razon_social: "DISTRIBUIDORA DEL SURESTE JOYEROS S. DE R.L. DE C.V.",
      rfc: "DDS900303CC3",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "97000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "contabilidad@distsureste.com",
      condicion_pago: "15 días",
      dias_credito: 15,
      limite_credito: 800000.00,
      metodo_pago_defecto: "PPD",
      forma_pago_defecto: "03",
      contacto: "C.P. Mónica Aranda",
      sucursales_activas: 3
    },
    {
      id: "CLI-004",
      nombre: "Montepío y Clientes Maquila",
      razon_social: "NACIONAL MONTE DE PIEDAD I.A.P.",
      rfc: "NMP080512MN3",
      regimen_fiscal: "603",
      regimen_desc: "Personas Morales con Fines no Lucrativos",
      cp_fiscal: "06010",
      uso_cfdi: "G03",
      uso_cfdi_desc: "Gastos en general",
      correo_facturacion: "administracion.oro@montepiedad.com.mx",
      condicion_pago: "Compensación de Gramos Oro",
      dias_credito: 0,
      limite_credito: 2000000.00,
      metodo_pago_defecto: "PUE",
      forma_pago_defecto: "17",
      contacto: "Ing. Jorge Villaseñor",
      saldo_oro_fino_g: 145.80 // Gramos de oro fino a favor del cliente
    }
  ];

  // 26 Sucursales / CEDIS para Coppel
  const coppel_branches = [
    { tienda_id: "COP-001", nombre: "Coppel Huehuetoca", cedis: "IZTAPALAPA", zona: "Norte", caja_sugerida: 1 },
    { tienda_id: "COP-002", nombre: "Coppel Tultitlán Centro", cedis: "IZTAPALAPA", zona: "Norte", caja_sugerida: 1 },
    { tienda_id: "COP-003", nombre: "Coppel Ecatepec Plaza Aragón", cedis: "IZTAPALAPA", zona: "Oriente", caja_sugerida: 2 },
    { tienda_id: "COP-004", nombre: "Coppel Puebla Centro", cedis: "PUEBLA", zona: "Sur", caja_sugerida: 2 },
    { tienda_id: "COP-005", nombre: "Coppel Tehuacán", cedis: "PUEBLA", zona: "Sur", caja_sugerida: 3 },
    { tienda_id: "COP-006", nombre: "Coppel San Luis Potosí Tangamanga", cedis: "SLP", zona: "Bajío", caja_sugerida: 3 },
    { tienda_id: "COP-007", nombre: "Coppel Guadalajara Centro", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 4 },
    { tienda_id: "COP-008", nombre: "Coppel Zapopan Plaza del Sol", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 4 },
    { tienda_id: "COP-009", nombre: "Coppel Tlaquepaque", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 5 },
    { tienda_id: "COP-010", nombre: "Coppel Monterrey Sendero", cedis: "MONTERREY", zona: "Noreste", caja_sugerida: 5 },
    { tienda_id: "COP-011", nombre: "Coppel San Pedro Garza", cedis: "MONTERREY", zona: "Noreste", caja_sugerida: 6 },
    { tienda_id: "COP-012", nombre: "Coppel Querétaro Constituyentes", cedis: "QUERETARO", zona: "Bajío", caja_sugerida: 6 },
    { tienda_id: "COP-013", nombre: "Coppel León Campestre", cedis: "LEON", zona: "Bajío", caja_sugerida: 7 },
    { tienda_id: "COP-014", nombre: "Coppel Irapuato Centro", cedis: "LEON", zona: "Bajío", caja_sugerida: 7 },
    { tienda_id: "COP-015", nombre: "Coppel Toluca Metepec", cedis: "TOLUCA", zona: "Centro", caja_sugerida: 8 },
    { tienda_id: "COP-016", nombre: "Coppel Cuernavaca Morelos", cedis: "CUERNAVACA", zona: "Sur", caja_sugerida: 8 },
    { tienda_id: "COP-017", nombre: "Coppel Veracruz Puerto", cedis: "VERACRUZ", zona: "Golfo", caja_sugerida: 9 },
    { tienda_id: "COP-018", nombre: "Coppel Xalapa Enríquez", cedis: "VERACRUZ", zona: "Golfo", caja_sugerida: 9 },
    { tienda_id: "COP-019", nombre: "Coppel Mérida Altabrisa", cedis: "MERIDA", zona: "Sureste", caja_sugerida: 10 },
    { tienda_id: "COP-020", nombre: "Coppel Mérida Centro", cedis: "MERIDA", zona: "Sureste", caja_sugerida: 10 },
    { tienda_id: "COP-021", nombre: "Coppel Cancún Nichupté", cedis: "CANCUN", zona: "Sureste", caja_sugerida: 11 },
    { tienda_id: "COP-022", nombre: "Coppel Oaxaca Juárez", cedis: "OAXACA", zona: "Sur", caja_sugerida: 11 },
    { tienda_id: "COP-023", nombre: "Coppel Villahermosa Tabasco 2000", cedis: "VILLAHERMOSA", zona: "Sureste", caja_sugerida: 12 },
    { tienda_id: "COP-024", nombre: "Coppel Pachuca Galerías", cedis: "PACHUCA", zona: "Centro", caja_sugerida: 12 },
    { tienda_id: "COP-025", nombre: "Coppel Tijuana Río", cedis: "TIJUANA", zona: "Noroeste", caja_sugerida: 13 },
    { tienda_id: "COP-026", nombre: "Coppel Culiacán Rosales", cedis: "CULIACAN", zona: "Noroeste", caja_sugerida: 13 }
  ];

  // Generador de piezas individuales reales
  function generatePieces() {
    const pieces = [];
    const baseWeights = {
      "ANILLO-SOL-10K": [1.85, 1.92, 1.78, 1.88, 1.84, 1.90, 1.82, 1.95, 1.79, 1.87],
      "ESCLAVA-ORO-14K": [5.20, 5.34, 5.12, 5.40, 5.25, 5.18, 5.31, 5.28, 5.45, 5.22],
      "CADENA-ROLO-10K": [3.40, 3.52, 3.38, 3.45, 3.60, 3.35, 3.48, 3.55, 3.42, 3.50],
      "ARETE-ARO-14K": [1.45, 1.50, 1.42, 1.48, 1.52, 1.40, 1.46, 1.55, 1.44, 1.51],
      "DIJE-CORAZON-10K": [0.95, 0.98, 0.92, 1.02, 0.96, 0.94, 1.00, 0.97, 1.04, 0.93],
      "ANILLO-SELLO-14K": [4.10, 4.25, 4.05, 4.18, 4.30, 4.12, 4.22, 4.15, 4.28, 4.08],
      "PULSERA-ESLABON-18K": [6.15, 6.30, 6.08, 6.22, 6.40, 6.18, 6.25, 6.35, 6.12, 6.28],
      "CADENA-FIGARO-14K": [4.80, 4.95, 4.75, 4.88, 5.02, 4.82, 4.90, 4.98, 4.78, 4.85],
      "CRUZ-LISA-10K": [1.10, 1.15, 1.08, 1.12, 1.18, 1.09, 1.14, 1.20, 1.11, 1.16],
      "MEDALLA-OVAL-14K": [2.30, 2.42, 2.25, 2.35, 2.48, 2.28, 2.38, 2.45, 2.32, 2.40],
      "ANILLO-TRIO-18K": [3.80, 3.92, 3.75, 3.85, 3.98, 3.78, 3.88, 3.95, 3.82, 3.90],
      "CADENA-ITALIANA-10K": [2.90, 3.02, 2.85, 2.95, 3.08, 2.88, 2.98, 3.05, 2.92, 3.00]
    };

    let counter = 1;

    // 1. Crear piezas iniciales de catálogo variado (8 piezas por SKU = 96 piezas)
    products_sku.forEach((p, pIdx) => {
      const arr = baseWeights[p.sku] || [2.0, 2.1, 1.9, 2.05];
      for (let i = 0; i < 8; i++) {
        const id = `PZ-2026-${String(counter++).padStart(4, "0")}`;
        const wBase = arr[i % arr.length];
        const variance = ((i * 7 + pIdx * 3) % 9 - 4) * 0.01;
        const peso_neto_g = +(wBase + variance).toFixed(2);
        const peso_bruto_g = +(peso_neto_g + 0.02).toFixed(2);

        // Distribución en almacenes
        let almacen_id = "BOVEDA_GENERAL";
        let estatus = "DISPONIBLE";
        if (i === 6) {
          almacen_id = "SUCURSAL_CDMX";
          estatus = "EXHIBICION";
        } else if (i === 7) {
          almacen_id = "SUCURSAL_MERIDA";
          estatus = "EXHIBICION";
        }

        pieces.push({
          piece_id: id,
          sku_ref: p.sku,
          peso_bruto_g,
          peso_neto_g,
          almacen_id,
          estatus,
          fecha_ingreso: `2026-10-${String((counter % 15) + 1).padStart(2, "0")}`,
          order_id: null,
          box_id: null,
          store_id: null
        });
      }
    });

    // 2. Generar volumen grande (370 piezas más) para soportar el pedido masivo de Coppel (438 piezas)
    // Con esto totalizamos 466 piezas físicas únicas individuales
    for (let j = 0; j < 370; j++) {
      const p = products_sku[j % products_sku.length];
      const arr = baseWeights[p.sku] || [2.0, 2.1, 1.9];
      const id = `PZ-2026-${String(counter++).padStart(4, "0")}`;
      const wBase = arr[j % arr.length];
      const variance = ((j * 13) % 15 - 7) * 0.01;
      const peso_neto_g = +(wBase + variance).toFixed(2);
      const peso_bruto_g = +(peso_neto_g + 0.02).toFixed(2);

      pieces.push({
        piece_id: id,
        sku_ref: p.sku,
        peso_bruto_g,
        peso_neto_g,
        almacen_id: "BOVEDA_GENERAL",
        estatus: "DISPONIBLE",
        fecha_ingreso: "2026-10-01",
        order_id: null,
        box_id: null,
        store_id: null
      });
    }

    // 3. Crear 4 piezas con defecto en taller de fundición
    for (let k = 0; k < 4; k++) {
      const id = `PZ-2026-${String(counter++).padStart(4, "0")}`;
      pieces.push({
        piece_id: id,
        sku_ref: "ANILLO-SOL-10K",
        peso_bruto_g: 1.88,
        peso_neto_g: 1.85,
        almacen_id: "TALLER_FUNDICION",
        estatus: "EN_FUNDICION",
        fecha_ingreso: "2026-10-12",
        order_id: null,
        box_id: null,
        store_id: null,
        motivo_merma: "Pieza con defecto de fundición / rotura de engaste"
      });
    }

    return pieces;
  }

  const initial_pieces = generatePieces();

  // Pedido B2B Coppel listo para la demostración
  const coppel_orders = [
    {
      order_id: "COP-2026-W42",
      cliente: "Coppel S.A. de C.V.",
      fecha_descarga: "2026-10-14",
      fecha_entrega: "2026-10-21",
      total_piezas: 438,
      piezas_asignadas: 0,
      estatus: "EN_PREPARACION", // EN_PREPARACION, ASIGNADO, FACTURADO, EN_RUTA, ENTREGADO
      notas: "Pedido masivo semanal Miércoles Coppel · Despiece en 26 sucursales",
      sucursales: coppel_branches.map((b, idx) => ({
        ...b,
        piezas_solicitadas: idx < 2 ? 20 : 16, // Suma 438 piezas exactas (2*20 + 24*16 = 40 + 384 = 424 + 14 = 438)
        piezas_asignadas_ids: [],
        factura_folio: null,
        estatus_empaque: "PENDIENTE"
      }))
    },
    {
      order_id: "PED-2026-1041",
      cliente: "Joyas del Centro Mayoristas",
      fecha_descarga: "2026-10-13",
      fecha_entrega: "2026-10-18",
      total_piezas: 12,
      piezas_asignadas: 12,
      estatus: "FACTURADO",
      notas: "Pedido de mostrador surtido",
      sucursales: [
        {
          tienda_id: "JCE-MATRIZ",
          nombre: "Joyas del Centro - Matriz CDMX",
          cedis: "CDMX",
          caja_sugerida: 1,
          piezas_solicitadas: 12,
          piezas_asignadas_ids: ["PZ-2026-0001", "PZ-2026-0002", "PZ-2026-0003"],
          factura_folio: "PRE-2026-0001",
          estatus_empaque: "COMPLETO"
        }
      ]
    },
    {
      order_id: "PED-2026-1039",
      cliente: "Distribuidora del Sureste",
      fecha_descarga: "2026-10-10",
      fecha_entrega: "2026-10-16",
      total_piezas: 8,
      piezas_asignadas: 8,
      estatus: "ENTREGADO",
      notas: "Entrega completada con firma y evidencia",
      sucursales: [
        {
          tienda_id: "DDS-001",
          nombre: "Distribuidora Sureste - Mérida",
          cedis: "MERIDA",
          caja_sugerida: 1,
          piezas_solicitadas: 8,
          piezas_asignadas_ids: [],
          factura_folio: "PRE-2026-0002",
          estatus_empaque: "ENTREGADO"
        }
      ]
    }
  ];

  // Ajustar la suma exacta de piezas solicitadas en el pedido Coppel W42 a 438
  // 26 sucursales: 22 de 17 piezas (374) + 4 de 16 piezas (64) = 438
  coppel_orders[0].sucursales.forEach((s, idx) => {
    s.piezas_solicitadas = idx < 22 ? 17 : 16;
  });

  const invoices = [
    {
      id: "FAC-2026-1041",
      serie: "A",
      folio: 1041,
      uuid: "4E8B7F21-9C3D-4A5E-8B1C-2D3E4F5A6B7C",
      order_id: "PED-2026-1041",
      cliente_id: "CLI-002",
      cliente: "Joyas del Centro Mayoristas",
      razon_social: "JOYAS DEL CENTRO MAYORISTAS S.A. DE C.V.",
      rfc: "JCE850201BB2",
      regimen_fiscal: "601",
      cp_fiscal: "06000",
      uso_cfdi: "G01",
      fecha: "2026-10-15T11:20:00",
      fecha_vencimiento: "2026-10-15",
      tipo_comprobante: "I",
      metodo_pago: "PUE",
      forma_pago: "03",
      forma_pago_desc: "Transferencia electrónica (SPEI)",
      condiciones_pago: "Contado comercial",
      subtotal: 34850.00,
      impuesto_iva: 5576.00,
      total: 40426.00,
      saldo_pendiente: 0.00,
      estatus_pago: "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: 12,
      gramos_totales: 23.40,
      vinculo_pld: "PLD-AUD-2026-088",
      partidas: [
        { sku: "ANILLO-SOL-10K", descripcion: "Anillo Solitario de Oro Amarillo 10K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 6, peso_neto_g: 11.10, valor_unitario: 2850.00, importe: 17100.00, iva: 2736.00 },
        { sku: "CADENA-ROLO-10K", descripcion: "Cadena Rolo Eslabón Italiano 10K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 6, peso_neto_g: 12.30, valor_unitario: 2958.33, importe: 17750.00, iva: 2840.00 }
      ]
    },
    {
      id: "FAC-2026-1040",
      serie: "A",
      folio: 1040,
      uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      order_id: "PED-2026-1039",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      razon_social: "DISTRIBUIDORA DEL SURESTE JOYEROS S. DE R.L. DE C.V.",
      rfc: "DDS900303CC3",
      regimen_fiscal: "601",
      cp_fiscal: "97000",
      uso_cfdi: "G01",
      fecha: "2026-10-12T16:45:00",
      fecha_vencimiento: "2026-10-27",
      tipo_comprobante: "I",
      metodo_pago: "PPD",
      forma_pago: "99",
      forma_pago_desc: "Por definir (PPD)",
      condiciones_pago: "Crédito 15 días",
      subtotal: 85000.00,
      impuesto_iva: 13600.00,
      total: 98600.00,
      saldo_pendiente: 48600.00,
      estatus_pago: "PARCIAL",
      estatus_sat: "VIGENTE",
      piezas_count: 18,
      gramos_totales: 58.20,
      vinculo_pld: "PLD-AUD-2026-085",
      partidas: [
        { sku: "ESCLAVA-ORO-14K", descripcion: "Esclava Clásica Tejido Cubano 14K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 10, peso_neto_g: 52.80, valor_unitario: 5500.00, importe: 55000.00, iva: 8800.00 },
        { sku: "ARETE-ARO-14K", descripcion: "Arete Tipo Arrancada Mediana 14K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 8, peso_neto_g: 5.40, valor_unitario: 3750.00, importe: 30000.00, iva: 4800.00 }
      ]
    },
    {
      id: "FAC-2026-1039",
      serie: "A",
      folio: 1039,
      uuid: "3D2E1F4A-5B6C-7D8E-9F0A-1B2C3D4E5F6A",
      order_id: "PED-2026-1025",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      razon_social: "DISTRIBUIDORA DEL SURESTE JOYEROS S. DE R.L. DE C.V.",
      rfc: "DDS900303CC3",
      regimen_fiscal: "601",
      cp_fiscal: "97000",
      uso_cfdi: "G01",
      fecha: "2026-09-28T09:15:00",
      fecha_vencimiento: "2026-10-13",
      tipo_comprobante: "I",
      metodo_pago: "PPD",
      forma_pago: "99",
      forma_pago_desc: "Por definir (PPD)",
      condiciones_pago: "Crédito 15 días",
      subtotal: 28400.00,
      impuesto_iva: 4544.00,
      total: 32944.00,
      saldo_pendiente: 32944.00,
      estatus_pago: "VENCIDA",
      estatus_sat: "VIGENTE",
      piezas_count: 6,
      gramos_totales: 17.50,
      vinculo_pld: "PLD-AUD-2026-079",
      partidas: [
        { sku: "CADENA-FIGARO-14K", descripcion: "Cadena Fígaro 3x1 Diamantada 14K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 6, peso_neto_g: 17.50, valor_unitario: 4733.33, importe: 28400.00, iva: 4544.00 }
      ]
    }
  ];

  const payments_cxc = [
    {
      id: "PAG-2026-001",
      serie: "P",
      folio: 501,
      uuid: "9F8E7D6C-5B4A-3F2E-1D0C-9B8A7F6E5D4C",
      factura_id: "FAC-2026-1040",
      factura_uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      rfc: "DDS900303CC3",
      fecha: "2026-10-16T14:30:00",
      monto: 50000.00,
      forma_pago: "03",
      forma_pago_desc: "Transferencia electrónica (SPEI)",
      numero_operacion: "SPEI-BBVA-7829103",
      saldo_anterior: 98600.00,
      saldo_insoluto: 48600.00,
      num_parcialidad: 1,
      estatus_sat: "VIGENTE"
    }
  ];

  const credit_notes = [
    {
      id: "NC-2026-001",
      serie: "NC",
      folio: 101,
      uuid: "2C3D4E5F-6A7B-8C9D-0E1F-2A3B4C5D6E7F",
      factura_id: "FAC-2026-1040",
      factura_uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      rfc: "DDS900303CC3",
      fecha: "2026-10-17T17:00:00",
      subtotal: 4000.00,
      impuesto_iva: 640.00,
      total: 4640.00,
      motivo: "Devolución de 1 esclava 14K con cierre defectuoso (Canalizada al Taller de Fundición)",
      tipo_relacion: "01",
      tipo_relacion_desc: "Nota de crédito de los documentos relacionados",
      estatus_sat: "VIGENTE"
    }
  ];

  const routes = [
    {
      id: "RUT-2026-018",
      chofer: "Miguel Torres",
      vehiculo: "Van Blindada Nivel III - Placas 482-XYZ",
      fecha: "2026-10-17",
      estatus: "EN_CURSO",
      paradas: [
        {
          parada_id: "PAR-01",
          sucursal: "Coppel Huehuetoca",
          direccion: "Av. Benito Juárez 104, Centro, Huehuetoca, Edo. Méx.",
          hora_programada: "09:00 AM",
          order_id: "COP-2026-W42",
          caja_numero: 1,
          piezas_caja: 17,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "PRE-2026-0001",
          observaciones: "Entregar en bóveda secundaria con sello de seguridad"
        },
        {
          parada_id: "PAR-02",
          sucursal: "Coppel Tultitlán Centro",
          direccion: "Av. Hidalgo 45, San Antonio, Tultitlán, Edo. Méx.",
          hora_programada: "11:15 AM",
          order_id: "COP-2026-W42",
          caja_numero: 1,
          piezas_caja: 17,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "PRE-2026-0001",
          observaciones: "Acceso por rampa de valores"
        },
        {
          parada_id: "PAR-03",
          sucursal: "Coppel Ecatepec Plaza Aragón",
          direccion: "Av. Carlos Hank González 120, Ecatepec, Edo. Méx.",
          hora_programada: "02:00 PM",
          order_id: "COP-2026-W42",
          caja_numero: 2,
          piezas_caja: 17,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "PRE-2026-0001",
          observaciones: "Requiere doble verificación de sellos de plomo"
        }
      ]
    }
  ];

  const foundry_logs = [
    {
      id: "FUN-2026-001",
      fecha: "2026-10-15",
      tecnico: "Roberto Silva",
      piezas_origen: ["PZ-ROT-001", "PZ-ROT-002", "PZ-DEV-008"],
      peso_entrada_g: 12.00,
      peso_recuperado_g: 10.20,
      diferencia_g: 1.80,
      merma_confirmada_g: 0.35,
      bote_rebabas_analisis_g: 1.45,
      estatus: "PENDIENTE_CONCILIACION", // PENDIENTE_CONCILIACION, CONCILIADO
      ley_oro_obtenida: "10K (41.7%)",
      acta_folio: "ACTA-FUND-882",
      notas: "Fusión de prueba con retazos de taller; 1.45g enviados al bote de rebabas para copelación química."
    }
  ];

  const maquila_compensations = [
    {
      id: "MAQ-2026-001",
      cliente: "Montepío y Clientes Maquila",
      fecha: "2026-10-10",
      tipo_movimiento: "DEPOSITO_ORO_FINO",
      gramos_oro_fino: 150.00,
      ley: "24K (99.9%)",
      folio_acta: "ACTA-ORO-FINO-410",
      saldo_restante_g: 145.80,
      notas: "Oro fino depositado para cubrir hechura de anillos 10K y 14K."
    }
  ];

  const audit_logs = [
    {
      id: "AUD-2026-001",
      fecha: "2026-10-17 08:30:15",
      usuario: "Sistema",
      rol: "Sistema",
      accion: "INICIO_SISTEMA",
      entidad: "Base de Datos",
      registro_id: "MARTELA-DB",
      resultado: "Éxito - 470 piezas inicializadas"
    },
    {
      id: "AUD-2026-002",
      fecha: "2026-10-17 08:45:00",
      usuario: "Adriana López",
      rol: "Administración / Facturación",
      accion: "ACTUALIZACION_FIX",
      entidad: "Cotizador Oro",
      registro_id: "FIX-2026-10-17",
      resultado: "Aplicado FIX de ayer: $2,680.00 USD (Mayor valor)"
    },
    {
      id: "AUD-2026-003",
      fecha: "2026-10-17 09:10:22",
      usuario: "Elisa Ramírez",
      rol: "Almacén / Bóveda",
      accion: "TRANSFERENCIA_ALMACEN",
      entidad: "Pieza Física",
      registro_id: "PZ-2026-0007",
      resultado: "Transferida de Bóveda General a Sucursal Mérida"
    }
  ];

  return {
    getInitialData: function() {
      return {
        products_sku: JSON.parse(JSON.stringify(products_sku)),
        warehouses: JSON.parse(JSON.stringify(warehouses)),
        inventory_pieces: JSON.parse(JSON.stringify(initial_pieces)),
        metal_rates: JSON.parse(JSON.stringify(metal_rates)),
        clients: JSON.parse(JSON.stringify(clients)),
        coppel_branches: JSON.parse(JSON.stringify(coppel_branches)),
        coppel_orders: JSON.parse(JSON.stringify(coppel_orders)),
        invoices: JSON.parse(JSON.stringify(invoices)),
        payments_cxc: JSON.parse(JSON.stringify(payments_cxc)),
        credit_notes: JSON.parse(JSON.stringify(credit_notes)),
        routes: JSON.parse(JSON.stringify(routes)),
        foundry_logs: JSON.parse(JSON.stringify(foundry_logs)),
        maquila_compensations: JSON.parse(JSON.stringify(maquila_compensations)),
        audit_logs: JSON.parse(JSON.stringify(audit_logs)),
        counter: 500
      };
    }
  };
})();
