# SWAP · MARTELA — Plataforma Integral de Gestión y Control Operativo (PoC)

Bienvenido a la **Prueba de Concepto Funcional Local (PoC)** diseñada por **SWAP** a la medida para **MARTELA Joyería Fina**. 

Esta solución interactiva y ejecutable opera directamente en el navegador web demostrando cómo un sistema empresarial moderno resuelve las limitaciones críticas de ERPs genéricos (como SAE) mediante el **control por pieza física con gramaje decimal exacto**, **automatización de pedidos departamentales B2B (Coppel)**, **cotización algorítmica del metal con reglas de protección**, **rutas logísticas blindadas con firma táctil en PWA móvil**, **control metalúrgico de fundición/mermas** e **inteligencia de reorden con tiempos de importación de 60 a 90 días**.

---

## 📂 Estructura Limpia del Proyecto

El proyecto está organizado bajo los más altos estándares de desarrollo frontend desacoplado, optimizado para repositorios de **GitHub** y despliegue automático en **GitHub Pages**:

```text
SWAP_martela-demo/
├── index.html                   # Aplicación principal SPA (Punto de entrada)
├── preview_logos.html           # Showroom interactivo de identidad de marca y favicons
├── README.md                    # Documentación ejecutiva, guion de demo y especificaciones
├── .gitignore                   # Exclusión de archivos temporales y del sistema
├── assets/
│   ├── brand/                   # Logotipos oficiales, isotipos y variantes vectoriales (SVG)
│   │   ├── Martela_logo.jpeg    # Archivo JPEG original de referencia
│   │   ├── martela-logo.svg     # Logotipo vertical master
│   │   ├── martela-logo-gold.svg
│   │   ├── martela-logo-white.svg
│   │   ├── martela-horizontal.svg # Logotipo horizontal para encabezados y documentos
│   │   ├── martela-horizontal-gold.svg
│   │   ├── martela-horizontal-white.svg
│   │   ├── martela-symbol.svg   # Emblema / isotipo 1:1 (4 lazos de Martela)
│   │   ├── martela-symbol-gold.svg
│   │   ├── martela-symbol-white.svg
│   │   └── martela-wordmark.svg # Tipografía vectorial aislada
│   └── icons/                   # Favicons e iconos para aplicaciones web y móviles
│       ├── favicon.svg          # Favicon vectorial con degradado áureo de alto contraste
│       ├── favicon.ico          # Favicon multisize (16, 32, 48px) para compatibilidad universal
│       ├── favicon.png          # Favicon rasterizado
│       ├── favicon-32.png       # Icono 32x32 para navegadores de escritorio
│       ├── favicon-192.png      # Icono para pantallas de inicio en dispositivos móviles
│       ├── favicon-512.png      # Icono en alta resolución / Splash screen PWA
│       └── apple-touch-icon.png # Icono touch optimizado para iOS Safari (180x180)
└── js/
    ├── app.js                   # Enrutador reactivo, temas y orquestación general
    ├── auth.js                  # Manejo de sesiones, autenticación simulada y roles
    ├── api-facade.js            # Capa de servicios / Patrón Facade con persistencia LocalStorage
    ├── data-seed.js             # Base de datos inicial (12 SKUs, 470 piezas físicas, 26 tiendas)
    ├── ui-utils.js              # Notificaciones Toast, modales, formato de moneda/gramaje y SheetJS
    └── modules/                 # Controladores de lógica de negocio modular
        ├── dashboard.js         # KPIs ejecutivos, valuación viva y desglose de inventario
        ├── inventory.js         # Trazabilidad individual por serial y gramaje en báscula
        ├── pricing.js           # Cotizador algorítmico FIX con regla de protección de margen
        ├── coppel.js            # Matriz de empaque para 26 tiendas Coppel y descarga Excel
        ├── billing.js           # Emisión de prefacturas membretadas y expediente PLD
        ├── logistics.js         # Ruta ciega y modo PWA para chofer con firma en Canvas
        ├── foundry.js           # Control de fundición, balances de merma y rebabas
        ├── champions.js         # Alertas de stock crítico y reposición con lead time
        └── reports.js           # Bitácora de auditoría cronológica y exportación JSON
```

---

## 🏛️ Arquitectura Técnica y Tecnologías

La plataforma está diseñada con una arquitectura desacoplada y modular, lista para una transición natural hacia **Angular, Spring Boot y PostgreSQL**:

```
[ Navegador Web del Usuario / Dispositivo Móvil ]
 ├── UI/HTML5 Semántico + Tailwind CSS (Estilo Dashboard PWA y Tema Oscuro/Claro)
 ├── App Router / State Controller (Navegación reactiva sin recarga de página)
 ├── Service Layer / ApiFacade.js (Simula latencia de red, promesas y auditoría)
 ├── LocalStorage Engine (Colecciones JSON: 12 SKUs, 470 piezas físicas, 26 tiendas)
 ├── SheetJS Engine (xlsx.full.min.js para importación y exportación de layouts reales)
 ├── HTML5 Canvas Engine (Digitalización táctil de firma de recepción para choferes)
 └── Vector Assets Engine (Logotipos SVG en curvas Bézier y favicons dorados)
```

- **Sin dependencias de backend activo:** Ejecutable localmente haciendo doble clic en `index.html` o vía servidor local (`Live Server` / `python -m http.server`).
- **Persistencia garantizada:** Todos los registros, altas en báscula, transferencias, firmas y facturas se almacenan en `localStorage` (`martela_enterprise_db`) y sobreviven al recargar el navegador.
- **Botón de Restablecimiento Inmediato:** Permite regresar la base de datos a sus valores iniciales limpios con un solo clic para repetir la presentación tantas veces como sea necesario.

---

## 🔑 Accesos de Demostración y Control por Roles

Cada rol cuenta con una interfaz y permisos adaptados a su función operativa.

| Perfil / Rol Simulado | Usuario | Contraseña | Módulos y Atribuciones Clave |
| :--- | :--- | :--- | :--- |
| **Administrador General** | `admin` | `martela123` | Acceso irrestricto a todos los módulos, KPIs globales, auditoría y respaldo. |
| **Administración / Facturación** | `facturacion` | `martela123` | Gestión de pedidos Coppel, emisión de prefacturas y expediente PLD (Adriana/Elisa). |
| **Bóveda / Almacén General** | `almacen` | `martela123` | Alta de piezas con báscula decimal, consulta de SKUs y transferencias entre almacenes. |
| **Chofer / Repartidor (PWA)** | `chofer` | `martela123` | Vista smartphone para registro de llegada GPS, firma en Canvas y foto de sellos. |
| **Taller de Fundición** | `fundicion` | `martela123` | Entrada de piezas dañadas, pesaje de lingote recuperado y control de rebabas. |

*Selector rápido de roles integrado en la barra superior para alternar de perspectiva en vivo durante la reunión.*

---

## 💎 Soluciones a los Dolores Operativos de MARTELA

### 1. Mismo SKU Base con Distinto Gramaje Individual (Frente a Limitaciones de SAE)
- Un ERP convencional solo permite inventarios de cantidad fija por SKU.
- **En MARTELA:** Bajo el SKU `ANILLO-SOL-10K`, el sistema desglosa cada pieza física con su propio serial (`PZ-2026-0001`, `PZ-2026-0002`, `PZ-2026-0003`) y su peso exacto con decimales (`1.85g`, `1.92g`, `1.78g`).
- La valuación financiera suma el gramaje neto real multiplicado por el valor del metal del día.

### 2. Pedidos Coppel de los Miércoles (438 Piezas en 26 Sucursales/CEDIS)
- Automatiza la matriz de empaque semanal por sucursal (Puebla, San Luis Potosí, Tecámac, etc.) y caja (`Caja #1` a `#26`).
- Conciliación en tiempo real: `Solicitadas: 438 | Asignadas: 438 (Coincidencia 100%)`.
- Exportación del layout oficial a Excel (`.xlsx`) mediante SheetJS para subir a los portales departamentales o cargar a facturación.

### 3. Motor de Cotización FIX Dinámico & Regla de Protección
- **Regla de negocio:** Compara el FIX de Hoy vs. FIX de Ayer y aplica automáticamente el valor más alto para proteger el margen ante la volatilidad bursátil.
- Fórmula transparente: `(FIX USD × T.C. ÷ 31.1035) × Pureza Karat + Hechura`.
- Módulo de compensación de maquila (Montepío / clientes mayoristas) para abonar oro fino 24K físico y cobrar únicamente la hechura.

### 4. Logística Blindada, PWA para Choferes y PLD
- Vista adaptable con marco de teléfono inteligente para el repartidor en ruta.
- Registro de llegada GPS simulada con hora exacta.
- **Canvas táctil:** Captura de firma manuscrita del receptor en pantalla y simulación de adjuntos fotográficos de recibos sellados.
- Vinculación automática con el folio de prefactura y generación del expediente digital para auditorías de Prevención de Lavado de Dinero (PLD).

### 5. Facturación Electrónica CFDI 4.0 & Cuentas por Cobrar (Superando a ASPEL-SAE)
- **El límite de ASPEL-SAE:** Asume precios fijos y cantidades enteras, siendo incapaz de facturar sumando el gramaje neto real de joyas individuales y aplicando la fluctuación diaria del FIX de oro.
- **La solución MARTELA:**
  - **Doble Modo:** Facturación instantánea de pedidos B2B (ej. 438 piezas de Coppel amparadas con seriales) o Facturación Libre Directa para mostrador/mayoristas.
  - **CFDI 4.0 Completo:** Timbrado simulado con UUID v4, Serie, Folio, Sellos Digitales SAT, Cadena Original y Código QR interactivo.
  - **Descargas Reales:** Generación y descarga directa del archivo **XML fiscal (Anexo 20)** y la **Representación Impresa en PDF/HTML** con membrete oficial y cantidad en letra.
  - **Cuentas por Cobrar (CxC) & REP:** Semáforo de cartera vencida vs. al corriente, registro de abonos y emisión automática del **Complemento de Recepción de Pagos (REP CFDI 4.0 Tipo P)** con soporte para **compensación en oro fino de maquila**.
  - **Notas de Crédito (Tipo E) & Cancelación SAT:** Devoluciones de piezas con canalización directa al taller de fundición y acuse de cancelación fiscal.

### 6. Fundición, Mermas y Protocolo de Rebabas
- Registro de lotes de fusión de piezas rotas o devueltas.
- Aplica el criterio metalúrgico: separa la merma térmica volatilizada (~20%) del material recuperable en crisol/rebabas (~80%) que se envía a análisis por copelación.
- Emisión e impresión de actas internas de control de fundición.

### 7. Inteligencia de Inventarios y Alertas de Campeones
- Detección automática de modelos con rotación alta (Campeones) vs. productos sin movimiento.
- Punto de reorden configurado considerando el tiempo de importación desde China (**60 a 90 días**).

---

## 🎯 Guion de Presentación Comercial (10 a 15 Minutos)

Sigue esta secuencia paso a paso ante los directivos de MARTELA para causar el máximo impacto:

### Minuto 0 – 2: Apertura y Filosofía de la Solución
1. Abre `index.html`. Inicia sesión seleccionando **Administrador** (`admin` / `martela123`).
2. Muestra el **Resumen Ejecutivo (Dashboard)**:
   - Señala la valuación del inventario calculada dinámicamente según el gramaje total real.
   - Destaca el aviso de acción rápida: *"Miércoles de Coppel: Pedido de 438 piezas listo para empaque"*.
   - Explica: *"Diseñamos esta herramienta no como una maqueta estética, sino como una solución operativa viva que aborda exactamente los desafíos discutidos en la entrevista"*.

### Minuto 2 – 5: El Dolor Central: Inventario por Gramaje Individual
1. En el menú lateral, haz clic en **Inventario por Pieza**.
2. Localiza el primer modelo: **`ANILLO-SOL-10K`** (Anillo Solitario Oro Amarillo 10K).
3. Haz clic en el botón dorado **`Ver piezas (X)`**:
   - Observa cómo se despliega la sub-tabla con las piezas físicas individuales.
   - Señala a los directivos: *"Aquí está la solución que SAE no permitía: `PZ-2026-0001` pesa 1.85g, mientras que `PZ-2026-0002` pesa 1.92g. El inventario suma el oro real, no piezas abstractas"*.
4. Haz clic en **`＋ Ingresar Pieza Física`**:
   - Captura una nueva pieza con peso en báscula de `2.15g` en Bóveda General.
   - Guarda y muestra el mensaje de confirmación y cómo se actualizan los contadores en tiempo real.

### Minuto 5 – 7: Motor de Cotización Dinámica (FIX)
1. Navega a **Cotizador Fix Oro**.
2. Muestra las 4 tarjetas de mercado: FIX Hoy ($2,650), FIX Ayer ($2,680), Tipo de Cambio ($19.50) y Gramo Fino ($1,679.56 MXN).
3. Resalta la etiqueta verde: *"Regla de Negocio MARTELA: Se aplica el FIX de Ayer ($2,680 USD) por ser el valor más alto, blindando la rentabilidad"*.
4. En el simulador, selecciona cualquier pieza física del inventario para demostrar cómo calcula en milisegundos el costo del metal, la hechura y el precio final de facturación.
5. Muestra el apartado de **Compensación de Maquila (Montepío)** con el saldo en gramos de oro 24K a favor.

### Minuto 7 – 10: Flujo del Miércoles de Coppel & Facturación
1. Navega al **Módulo Coppel B2B**.
2. Muestra el pedido semanal `COP-2026-W42` para 26 tiendas y 438 piezas.
3. Haz clic en el botón dorado **`⚡ Asignar Piezas Automáticamente`**:
   - El sistema vincula al instante 438 números de serie físicos con pesos específicos a cada una de las 26 cajas.
   - El indicador de conciliación salta al **100% de coincidencia**.
4. Haz clic en **`Exportar Layout (.xlsx)`**:
   - Se descargará un archivo Excel real generado por SheetJS con el detalle de empaque listo para el portal departamental.
5. Haz clic en **`Generar Prefactura de este Pedido`** (te llevará a Facturación):
   - Haz clic en **`⚡ Generar Prefactura Ahora`**.
   - Haz clic en **`Ver Documento →`** para desplegar la prefactura formal con membrete oficial, logotipo vectorial de MARTELA, desglose de importes y expediente PLD asociado.

### Minuto 10 – 13: Logística, PWA Móvil del Chofer y Cumplimiento PLD
1. Cambia de rol en la barra superior a **Chofer PWA Móvil** o navega a **Logística y Entregas PWA**.
2. Haz clic en **`📱 Simular Vista Smartphone PWA`**:
   - La pantalla se transformará en una interfaz de teléfono inteligente.
3. Localiza la parada activa (ej. *Coppel Huehuetoca*):
   - Haz clic en **`📍 Simular Llegada GPS`** (se registra la hora de llegada).
   - Haz clic en **`✍ Capturar Firma y Sello`**:
     - Escribe el nombre del gerente que recibe.
     - Dibuja una firma táctil en el recuadro interactivo (Canvas).
     - Confirma la entrega.
4. Muestra cómo la firma queda guardada y cómo se vincula el folio de entrega con la factura emitida para las auditorías de Adriana/PLD.

### Minuto 13 – 15: Fundición, Auditoría y Cierre
1. Abre **Fundición y Mermas**:
   - Muestra cómo se registra un lote de fusión y la distinción entre merma térmica (20%) y bote de rebabas (80%).
2. Abre **Reportes y Auditoría**:
   - Muestra la bitácora cronológica que registró cada acción realizada durante la demostración (quién, cuándo y qué modificó).
   - Muestra el botón para exportar respaldo JSON y el botón de restablecimiento.
3. **Cierre comercial sugerido:** *"Esta prueba de concepto demuestra que comprendemos su operación a fondo y que una solución desarrollada a la medida resuelve sus dolores cotidianos con elegancia, trazabilidad y control total."*

---

## 🎨 Identidad Visual y Activos Vectoriales (SVG)

A partir del archivo original [`assets/brand/Martela_logo.jpeg`](assets/brand/Martela_logo.jpeg), se vectorizó la marca completa con curvas Bézier de alta precisión matemática:

- `assets/icons/favicon.svg` — Favicon vectorial con emblema dorado de alto contraste para pestañas del navegador.
- `assets/brand/martela-logo.svg` / `martela-logo-gold.svg` / `martela-logo-white.svg` — Logotipo corporativo vertical master.
- `assets/brand/martela-horizontal.svg` — Versión horizontal para cabeceras y documentos oficiales.
- `assets/brand/martela-symbol.svg` — Isotipo cuadrado (4 lazos entrelazados) para insignias y firmas.
- `preview_logos.html` — Galería de validación visual interactiva.

---

## ⚠️ Aclaraciones sobre la Demostración Local
- Esta aplicación es una **Prueba de Concepto (PoC) Frontend**. Los roles, permisos y bitácoras son simulados con fines de presentación interactiva.
- Los documentos de facturación son prefacturas de control administrativo; la integración con un Proveedor Autorizado de Certificación (PAC) y el SAT se implementará en la fase productiva mediante servicios backend seguros.
- Las cotizaciones de metales y geolocalizaciones son datos de demostración configurables en vivo.
