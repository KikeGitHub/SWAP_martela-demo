/**
 * MARTELA — Utilidades UI, Modales, Canvas de Firma, SheetJS Excel & Notificaciones
 */
window.MartelaUI = (function() {
  function money(val) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  }

  function grams(val, dec = 2) {
    return (Number(val) || 0).toFixed(dec) + ' g';
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function badge(status) {
    const s = String(status || '').toUpperCase();
    let bg = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

    if (s.includes('DISPONIBLE') || s.includes('COMPLETO') || s.includes('ENTREGADA') || s.includes('CORRECTO')) {
      bg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20';
    } else if (s.includes('ASIGNAD') || s.includes('PREPARACION') || s.includes('PROCESO') || s.includes('RUTA') || s.includes('TRANSITO')) {
      bg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-500/20';
    } else if (s.includes('PENDIENTE') || s.includes('STOCK BAJO') || s.includes('CONCILIACION') || s.includes('PREFACTURA')) {
      bg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/20';
    } else if (s.includes('EXHIBICION') || s.includes('FUNDICION')) {
      bg = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-500/20';
    } else if (s.includes('CANCEL') || s.includes('DEFECTO') || s.includes('ROT') || s.includes('BLOQUEAD')) {
      bg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20';
    }

    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bg}">${esc(status)}</span>`;
  }

  function toast(message, type = 'info') {
    const root = document.getElementById('toastRoot');
    if (!root) return;

    let borderCol = 'border-amber-500';
    let icon = '◈';
    if (type === 'success') { borderCol = 'border-emerald-500'; icon = '✓'; }
    if (type === 'error') { borderCol = 'border-rose-500'; icon = '⚠'; }

    const el = document.createElement('div');
    el.className = `transform transition-all duration-300 ease-out bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border-l-4 ${borderCol} flex items-center gap-3 text-sm min-w-[280px] max-w-md`;
    el.innerHTML = `
      <span class="text-base font-bold text-amber-400">${icon}</span>
      <div class="flex-1">${esc(message)}</div>
    `;

    root.appendChild(el);
    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function openModal(title, htmlContent, widthClass = 'max-w-2xl') {
    const root = document.getElementById('modalRoot');
    if (!root) return;

    root.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onclick="if(event.target===this) MartelaUI.closeModal()">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full ${widthClass} rounded-2xl shadow-2xl overflow-hidden my-8">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="text-amber-500">◈</span>
              <span>${esc(title)}</span>
            </h3>
            <button onclick="MartelaUI.closeModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition">✕</button>
          </div>
          <div class="p-6 max-h-[82vh] overflow-y-auto">
            ${htmlContent}
          </div>
        </div>
      </div>
    `;
  }

  function closeModal() {
    const root = document.getElementById('modalRoot');
    if (root) root.innerHTML = '';
  }

  // Canvas de firma digital
  let activeSignatureCanvas = null;
  let isSigning = false;
  let lastPos = null;

  function initSignatureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    activeSignatureCanvas = canvas;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    canvas.onpointerdown = (e) => {
      e.preventDefault();
      isSigning = true;
      lastPos = getCoords(e);
    };

    canvas.onpointermove = (e) => {
      if (!isSigning) return;
      e.preventDefault();
      const pos = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos = pos;
    };

    const stop = () => { isSigning = false; lastPos = null; };
    canvas.onpointerup = stop;
    canvas.onpointerleave = stop;
    canvas.onpointercancel = stop;
  }

  function clearSignature(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function isCanvasSigned(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imgData.data.some((val, idx) => idx % 4 === 3 && val > 0);
  }

  function getCanvasDataURL(canvasId) {
    const canvas = document.getElementById(canvasId);
    return canvas ? canvas.toDataURL('image/png') : '';
  }

  // Descarga de archivos
  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  // Exportar Excel mediante SheetJS
  function exportToExcel(rows, filename = 'martela-reporte.xlsx', sheetName = 'Datos') {
    if (!rows || rows.length === 0) {
      toast('No hay datos disponibles para exportar', 'error');
      return;
    }

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
      toast(`Excel generado: ${filename}`, 'success');
    } else {
      // Fallback CSV
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      downloadBlob('\ufeff' + csv, filename.replace(/\.xlsx$/, '.csv'), 'text/csv;charset=utf-8');
      toast(`Reporte CSV exportado (SheetJS no detectado)`, 'info');
    }
  }

  // Conversor de número a letras en formato oficial CFDI SAT
  function numeroALetras(monto) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const dieces = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const num = Math.floor(Number(monto) || 0);
    const centavos = Math.round((Number(monto) - num) * 100);
    const strCentavos = `${String(centavos).padStart(2, '0')}/100 M.N.`;

    if (num === 0) return `CERO PESOS ${strCentavos}`;

    function seccion(n) {
      if (n === 0) return '';
      if (n === 100) return 'CIEN ';
      let r = '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (c > 0) r += centenas[c] + ' ';
      if (d === 1) {
        r += dieces[u] + ' ';
      } else if (d === 2 && u > 0) {
        r += 'VEINTI' + unidades[u] + ' ';
      } else {
        if (d > 0) r += decenas[d] + (u > 0 ? ' Y ' : ' ');
        if (u > 0) r += unidades[u] + ' ';
      }
      return r;
    }

    let millones = Math.floor(num / 1000000);
    let miles = Math.floor((num % 1000000) / 1000);
    let pesos = num % 1000;

    let res = '';
    if (millones > 0) {
      res += (millones === 1 ? 'UN MILLÓN ' : seccion(millones) + 'MILLONES ');
    }
    if (miles > 0) {
      res += (miles === 1 ? 'MIL ' : seccion(miles) + 'MIL ');
    }
    if (pesos > 0) {
      res += seccion(pesos);
    }

    const palabraPesos = num === 1 ? 'PESO' : 'PESOS';
    return (res + palabraPesos + ' ' + strCentavos).replace(/\s+/g, ' ').trim();
  }

  // Generador vectorial de QR Fiscal SAT
  function generateQRCodeSVG(text, size = 110) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    const grid = 23;
    const cellSize = size / grid;
    let rects = '';

    // Patrones de esquina fijos de QR (Finders)
    function addFinder(x0, y0) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            rects += `<rect x="${(x0 + c) * cellSize}" y="${(y0 + r) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a"/>`;
          }
        }
      }
    }

    addFinder(0, 0);
    addFinder(grid - 7, 0);
    addFinder(0, grid - 7);

    // Módulos internos pseudoaleatorios consistentes
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const inFinder1 = r < 7 && c < 7;
        const inFinder2 = r < 7 && c >= grid - 7;
        const inFinder3 = r >= grid - 7 && c < 7;
        if (!inFinder1 && !inFinder2 && !inFinder3) {
          const bit = Math.abs((hash ^ (r * 31 + c * 17) ^ (r * c)) % 3) === 0;
          if (bit) {
            rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a"/>`;
          }
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="border border-slate-300 dark:border-slate-700 rounded bg-white p-1">
      <rect width="${size}" height="${size}" fill="#ffffff"/>
      ${rects}
    </svg>`;
  }

  return {
    money,
    grams,
    esc,
    badge,
    toast,
    openModal,
    closeModal,
    initSignatureCanvas,
    clearSignature,
    isCanvasSigned,
    getCanvasDataURL,
    downloadBlob,
    exportToExcel,
    numeroALetras,
    generateQRCodeSVG
  };
})();
