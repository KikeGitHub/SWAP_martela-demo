# 📖 Manual Ejecutivo y Guion de Presentación: Demo MARTELA Joyería Fina

Este manual está diseñado para que presentes la solución con **máxima seguridad, empatía y enfoque de negocio**. No necesitas explicar código ni tecnicismos; tu objetivo es demostrarle a la directiva de **MARTELA** que **escuchaste y entendiste cada uno de los dolores operativos de su primera entrevista** y que tienes la solución exacta para resolverlos.

---

## 🛠️ 1. Preparación Rápida Antes de la Reunión

1. **Cómo abrir la demo:**
   - **Opción A (En Vivo por Internet):** Abre el enlace de GitHub Pages:  
     👉 [https://kikegithub.github.io/SWAP_martela-demo/](https://kikegithub.github.io/SWAP_martela-demo/)
   - **Opción B (Local sin depender de Internet):** Abre el archivo `index.html` en Chrome, Edge o Safari.
2. **Credenciales maestras:**
   - Usuario: `admin`
   - Contraseña: `martela123`
3. **El Botón Salvavidas (Restablecer Demo):**
   - En la esquina superior derecha (o en el pie del menú lateral) hay un botón circular con icono **`↻`**. Si haces pruebas antes de la junta y quieres que todo vuelva a su estado inicial impecable, púlsalo y confirma.

---

## ⏱️ 2. Guion Paso a Paso Módulo por Módulo (15 a 20 Minutos)

```mermaid
graph LR
    A[Apertura: Dashboard] --> B[Inventario por Pieza]
    B --> C[Cotizador FIX Oro]
    C --> D[Miércoles de Coppel]
    D --> E[Facturación CFDI 4.0]
    E --> F[Chofer PWA & Firma]
    F --> G[Fundición & Mermas]
    G --> H[Auditoría & Cierre]
```

---

### Acto 1: La Apertura (Minuto 0 al 2) — *Causar el Primer Impacto*
* **Pantalla a mostrar:** Pantalla de Inicio de Sesión y luego el **Resumen Ejecutivo (Dashboard)**.
* **Lo que debes decir con tus palabras:**
  > *"Muy buenos días. Después de nuestra primera entrevista, nos dimos cuenta de que su operación es sumamente especializada y que los sistemas convencionales les quedan chicos. Por eso hoy no venimos a mostrarles diapositivas ni maquetas dibujadas; construimos para ustedes una **plataforma interactiva en vivo**, diseñada a la medida de los retos reales que nos compartieron sobre el oro, sus clientes mayoristas y la logística."*
* **Qué hacer en pantalla:**
  1. Inicia sesión con un solo clic seleccionando el rol **Administrador General**.
  2. Muestra las tarjetas del Dashboard:
     - Señala el valor total del inventario: *"Aquí el sistema no calcula con precios fijos inventados; está sumando el gramaje real que tenemos en bóveda multiplicado por el precio del oro de hoy"*.
     - Muestra la alerta de acción rápida: *"El sistema les avisa inmediatamente qué órdenes urgentes requieren atención, como el pedido semanal de Coppel"*.

---

### Acto 2: El Dolor Central de SAE — *Inventario por Pieza y Gramaje Real* (Minuto 2 al 5)
* **Pantalla a mostrar:** Módulo **Inventario por Pieza**.
* **El dolor que resuelves:** En un ERP convencional como SAE, el sistema solo sabe decir *"tienes 10 anillos del modelo X"*. Pero en joyería fina, **ningún anillo pesa lo mismo**: uno pesa 1.85g, otro 1.92g y otro 1.78g. En SAE, esa diferencia de decimales se pierde o se cuadra a mano en hojas de cálculo.
* **Qué hacer en pantalla:**
  1. En el menú izquierdo, haz clic en **Inventario por Pieza**.
  2. Localiza el primer producto: **`ANILLO-SOL-10K`** (Anillo Solitario 10K).
  3. Haz clic en el botón dorado **`Ver piezas (10)`**.
  4. Muestra cómo se despliega la lista individual:
     > *"Miren esto: bajo un solo modelo maestro, el sistema les muestra cada joya física con su propio código de serie único (`PZ-2026-0001`, `PZ-2026-0002`) y su peso exacto con dos decimales (`1.85g`, `1.92g`). Sabemos exactamente en qué bóveda está cada pieza física y cuál es su peso real"*.
  5. Muestra el botón **`+ Registrar Nueva Pieza en Báscula`**:
     > *"Cuando un joyero o taller entrega una pieza, el almacenista simplemente captura el gramaje que marca la báscula electrónica y el sistema genera su número de serie en automático, actualizando la valuación en vivo"*.

---

### Acto 3: Protección Financiera — *Cotizador FIX Dinámico* (Minuto 5 al 7)
* **Pantalla a mostrar:** Módulo **Cotizador Fix Oro**.
* **El dolor que resuelves:** El precio internacional del oro cambia todos los días. Si vendes joyería con un precio de lista congelado, corres el riesgo de perder dinero si el metal sube, o tener discrepancias si el cliente exige el precio del día.
* **Qué hacer en pantalla:**
  1. En el menú, haz clic en **Cotizador Fix Oro**.
  2. Muestra la comparativa de FIX:
     - FIX de Hoy: **$2,650 USD** vs. FIX de Ayer: **$2,680 USD**.
     - Destaca la etiqueta verde: **`REGLA DE PROTECCIÓN ACTIVA (Mayor Valor: $2,680 USD)`**.
     > *"Aquí aplicamos la regla de negocio que nos platicaron: para proteger el margen de Martela, el sistema compara automáticamente la cotización de hoy contra la de ayer y toma la más alta. Así la empresa nunca queda desprotegida ante la volatilidad de la bolsa"*.
  3. Muestra la calculadora interactiva abajo:
     - Cambia el quilataje (10K, 14K, 18K) o el peso en gramos y muestra cómo el precio final en pesos mexicanos (metal puro + hechura de taller) se recalcula al instante en pantalla.
  4. Menciona la pestaña **Maquila y Compensaciones**:
     > *"Además, para clientes como Montepío o mayoristas que entregan su propio oro fino de 24K, el sistema lleva el saldo en gramos a su favor y les cobra exclusivamente el costo de la hechura, sin mezclar el dinero con el metal"*.

---

### Acto 4: El Dolor de los Miércoles — *Módulo Coppel B2B* (Minuto 7 al 10)
* **Pantalla a mostrar:** Módulo **Módulo Coppel B2B**.
* **El dolor que resuelves:** Surtir el pedido semanal de Coppel (438 piezas repartidas en 26 cajas para 26 CEDIS/tiendas de todo el país: Puebla, San Luis Potosí, Tecámac, etc.) normalmente requiere horas de estrés, hojas impresas y riesgo de empaques equivocados.
* **Qué hacer en pantalla:**
  1. Haz clic en **Módulo Coppel B2B**.
  2. Muestra el encabezado del pedido: **`COP-2026-W42`** (`438 piezas solicitadas en 26 sucursales`).
  3. Muestra la matriz de empaque por sucursal:
     > *"Aquí tenemos la distribución exacta para las 26 tiendas de Coppel, desde Huehuetoca hasta Culiacán, agrupadas en sus cajas correspondientes"*.
  4. **El momento "WOW" (Haz clic en vivo):**  
     Presiona el botón dorado **`⚡ Asignar Piezas Automáticamente`**.
     - Verás que en menos de 1 segundo el sistema busca en la bóveda las 438 piezas físicas disponibles con sus números de serie y las concilia al 100%.
     - El indicador cambia a verde: **`438 Solicitadas | 438 Asignadas (100% Conciliado)`**.
     > *"Con un solo clic, el sistema asignó cada joya física con su número de serie individual a la caja correspondiente. Cero errores de empaque y conciliación perfecta"*.
  5. Presiona el botón **`Exportar Layout Excel (.xlsx)`**:
     - Muestra cómo se descarga el archivo Excel real en la computadora:
     > *"Este es el formato exacto que les pide el portal de Coppel para subir la remisión sin tener que recapturar nada a mano"*.

---

### Acto 5: Superando a ASPEL-SAE — *Facturación CFDI 4.0 & Cobranza* (Minuto 10 al 14)
* **Pantalla a mostrar:** Módulo **Facturación & CFDI 4.0**.
* **El dolor que resuelves:** En ASPEL-SAE la facturación es rígida: captura manual de partidas, precios estáticos y dificultad para vincular el gramaje real y los folios de auditoría PLD.
* **Qué hacer en pantalla:**
  1. Haz clic en **Facturación & CFDI 4.0**.
  2. Muestra las 4 tarjetas superiores: Facturación Vigente, Cuentas por Cobrar, Cartera Vencida y Pedidos Listos para Facturar.
  3. Muestra el aviso amarillo: *"El pedido de Coppel que acabamos de conciliar ya aparece aquí listo para facturarse"*.
  4. **Emisión de la Factura:**
     - Haz clic en **`Emitir Factura CFDI 4.0 Ahora →`** o en el botón de la pestaña Asistente.
     - El sistema genera el comprobante fiscal en segundos con su número de folio oficial.
  5. **La Representación Impresa Oficial (Haz clic en el icono del ojo `👁️`):**
     - Se abrirá el modal de la factura oficial con el membrete dorado de Martela.
     - Señala al cliente estos elementos clave:
       - **Logotipo y datos fiscales:** Emisor Martela (RFC MAR880915XYZ) y Receptor Coppel.
       - **Folio Fiscal Digital (UUID SAT):** Generado formalmente.
       - **Desglose de Joyería:** Muestra cómo las partidas indican la clave SAT `54111601` (Joyería de oro), el gramaje neto exacto y el IVA al 16%.
       - **Importe en letra:** Calculado automáticamente conforme a la ley mexicana.
       - **Código QR SAT interactivo y sellos digitales:** Sello del emisor, sello del SAT y cadena original.
       - **Expediente PLD:** Vinculado para auditorías de prevención de lavado de dinero.
  6. **La Descarga del XML Real:**
     - Presiona el botón **`Descargar Archivo XML (CFDI 4.0)`**.
     - Muestra cómo se descarga el archivo `.xml` real en la computadora:
     > *"No es una simulación visual: el sistema genera el archivo XML con la estructura legal exacta que exige el SAT bajo el Anexo 20"*.
  7. **Cuentas por Cobrar & Pagos (Pestaña `💳 Cuentas por Cobrar`):**
     - Muestra el semáforo de cartera al corriente vs. vencida.
     - Presiona **`Abonar / Liquidar`** en una factura pendiente:
       > *"Cuando el cliente paga, capturamos el abono y el sistema timbra automáticamente el **Complemento de Recepción de Pagos (REP CFDI 4.0 Tipo P)**. Incluso si nos pagan con **compensación de oro fino**, el sistema deduce los gramos de su cuenta corriente"*.

---

### Acto 6: Seguridad en Ruta — *Chofer PWA en Móvil & Firma Digital* (Minuto 14 al 17)
* **Pantalla a mostrar:** Módulo **Logística y Entregas PWA**.
* **El dolor que resuelves:** Los choferes que transportan joyas de alto valor no deben llevar información sensible visible (ruta ciega) y necesitan comprobar la entrega en el CEDIS con firma y sellos de seguridad.
* **Qué hacer en pantalla:**
  1. Haz clic en **Logística y Entregas PWA**.
  2. Muestra cómo la pantalla cambia automáticamente a una **vista de teléfono inteligente (Smartphone PWA)**:
     > *"Esto es lo que ve el chofer de la camioneta blindada en su celular"*.
  3. Señala el concepto de **Ruta Ciega**:
     > *"Por seguridad de los choferes y de la mercancía, el chofer no ve toda la ruta del día; el sistema solo le revela la siguiente parada cuando concluye la anterior"*.
  4. Presiona **`Registrar Llegada GPS`**:
     - El sistema simula la captura de coordenadas y hora de arribo.
  5. **La Firma en Vivo en Pantalla:**
     - Con el ratón (o con el dedo si tienes pantalla táctil), dibuja una firma en el recuadro blanco:
     > *"En la ventanilla de recepción de Coppel, el encargado firma directamente en la pantalla de su celular"*.
  6. Presiona **`Confirmar Recepción y Guardar Evidencia`**:
     - Muestra cómo la parada cambia a verde y queda sellada.
     > *"Esa firma y esa entrega quedan automáticamente amarradas a la factura y al expediente PLD que revisa Adriana en administración"*.

---

### Acto 7: Metalurgia y Taller — *Fundición y Control de Mermas* (Minuto 17 al 19)
* **Pantalla a mostrar:** Módulo **Fundición y Mermas**.
* **El dolor que resuelves:** Cuando piezas defectuosas o pedacería entran al crisol de fundición, un ERP genérico no distingue entre lo que realmente se perdió en humo y lo que quedó en el fondo del crisol o en rebabas.
* **Qué hacer en pantalla:**
  1. Haz clic en **Fundición y Mermas**.
  2. Muestra un lote de fundición (`FUN-2026-001`):
     - Peso de entrada: `12.00g` | Peso recuperado en lingote: `10.20g`.
     - Diferencia: `1.80g`.
  3. Señala la distinción técnica que construiste:
     > *"Aquí aplicamos el criterio que nos enseñaron en la entrevista: de los 1.80g de diferencia, el sistema no asume que todo es merma perdida. Registra que solo el 20% (0.35g) fue merma térmica real por fuego, y el 80% restante (1.45g) se envía al bote de rebabas para análisis de copelación química"*.
  4. Presiona **`Ver Acta Oficial`**:
     - Muestra el documento interno membretado con folio para el control de los técnicos de fundición.

---

### Acto 8: Auditoría y Cierre Comercial (Minuto 19 al 20) — *El Cierre Maestro*
* **Pantalla a mostrar:** Módulo **Reportes y Auditoría**.
* **Qué hacer en pantalla:**
  1. Haz clic en **Reportes y Auditoría**.
  2. Muestra la bitácora cronológica:
     > *"Cada acción que acabamos de hacer en esta reunión —iniciar sesión, calcular el FIX, asignar las piezas de Coppel, emitir la factura y registrar la firma del chofer— quedó registrada con fecha, hora exacta y usuario responsable. Esto les garantiza trazabilidad total ante cualquier auditoría fiscal o de PLD"*.
* **El Discurso de Cierre (Dilo con convicción):**
  > *"Como pueden ver, no les estamos ofreciendo un software genérico de caja que tengan que forzar a punta de parches y hojas de Excel. Diseñamos esta prueba de concepto para demostrarles que **entendemos su negocio de joyería fina desde la raíz**: el valor del gramo, el empaque de Coppel, el FIX dinámico y la seguridad en ruta.*  
  >  
  > *Todo lo que vieron hoy funcionando de forma local y en la web es la base sólida sobre la cual podemos construir su sistema empresarial definitivo, conectado a sus básculas, seguro en la nube y accesible desde cualquier sucursal.*  
  >  
  > *¿Qué les parece la solución? ¿Comenzamos con la fase de planeación de su implementación?"*

---

## 💡 3. Respuestas Rápidas ante Posibles Preguntas del Cliente

| Pregunta del Cliente | Tu Respuesta Sugerida (Directa y Profesional) |
| :--- | :--- |
| **"¿Esto sustituye a nuestro SAE o convive con él?"** | *"Está diseñado para sustituir las partes donde SAE falla (gramaje por pieza, Coppel y logística), pero en una primera etapa también puede convivir exportando e importando layouts automáticos para no interrumpir su contabilidad actual."* |
| **"¿Cómo se conectaría con nuestras básculas electrónicas?"** | *"En la versión productiva conectamos la báscula por puerto serie USB al navegador mediante WebSerial API, de modo que al colocar el anillo sobre el plato, el gramaje se captura en la pantalla en milisegundos sin teclear."* |
| **"¿Cómo funciona el timbrado del SAT en la vida real?"** | *"En esta demo el timbrado está simulado con los estándares oficiales del SAT (CFDI 4.0 Anexo 20). En producción, simplemente vinculamos sus sellos CSD y se conecta directamente con un PAC autorizado (como Finkok o Facturama) para que el timbrado sea 100% fiscal."* |
| **"¿Dónde se alojará la información?"** | *"En una nube segura y privada (como AWS o Google Cloud), con respaldos automáticos diarios, encriptación bancaria para la protección de sus inventarios de oro y acceso protegido por roles y contraseñas."* |

---

> [!TIP]
> **Consejo durante la reunión:** Deja que ellos hablen y se emocionen cuando vean resueltos sus problemas diarios (especialmente el despiece de Coppel y el gramaje individual). Si te hacen preguntas de negocio específicas, felicítalos por la observación y diles: *"Exactamente por eso construimos la arquitectura modular, para que cada regla de Martela se configure a su medida"*.
