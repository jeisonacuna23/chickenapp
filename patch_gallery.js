const fs = require('fs');
const file = './www/index.html';
let html = fs.readFileSync(file, 'utf8');

// 1. Agregar botón al menú principal
const menuTarget = '<button onclick="enviarRecordatorios()">\n        <i class="fas fa-bell"></i>\n        Recordatorios\n      </button>';
const newButton = '\n      <button onclick="mostrarGaleriaRecibos()">\n        <i class="fas fa-images"></i>\n        Galería de Recibos\n      </button>';

if (html.includes(menuTarget)) {
  html = html.replace(menuTarget, menuTarget + newButton);
  console.log("✅ 1. Botón Galería de Recibos agregado al menú.");
}

// 2. Agregar nueva sección antes de </body>
const bodyTarget = '</body>';
const newSection = `
  <section id="galeria-recibos" class="hidden">
    <h3><i class="fas fa-images"></i> Galería de Recibos</h3>
    <div style="margin: 15px 0;">
      <button onclick="renderGaleriaRecibos('Fiado')" style="background:#e74c3c; color:white; padding:8px 15px; border:none; border-radius:5px; margin:5px;">Fiados</button>
      <button onclick="renderGaleriaRecibos('Pagado')" style="background:#2ecc71; color:white; padding:8px 15px; border:none; border-radius:5px; margin:5px;">Pagados</button>
      <button onclick="renderGaleriaRecibos('Todos')" style="background:#3498db; color:white; padding:8px 15px; border:none; border-radius:5px; margin:5px;">Todos</button>
    </div>
    <div id="galeria-contenido" style="display:flex; flex-direction:column; gap:15px; padding:10px;"></div>
    <button onclick="ocultarTodasLasSecciones()" style="margin-top:20px; padding:10px 20px; background:#888; color:white; border:none; border-radius:5px;">Volver</button>
  </section>
</body>`;

if (html.includes(bodyTarget)) {
  html = html.replace(bodyTarget, newSection);
  console.log("✅ 2. Sección HTML de Galería agregada.");
}

// 3. Agregar funciones JS antes de </script>
const scriptTarget = '</script>';
const newJS = `
async function mostrarGaleriaRecibos() {
  ocultarTodasLasSecciones();
  document.getElementById('galeria-recibos').classList.remove('hidden');
  renderGaleriaRecibos('Todos');
}

async function renderGaleriaRecibos(filtro) {
  const contenedor = document.getElementById('galeria-contenido');
  contenedor.innerHTML = '<p>Generando vistas previas...</p>';
  
  const recibosFiltrados = recibos.filter(r => {
    if (filtro === 'Todos') return true;
    if (filtro === 'Fiado') return r.metodo === 'Fiado';
    if (filtro === 'Pagado') return r.metodo !== 'Fiado';
    return true;
  });
  
  contenedor.innerHTML = '';
  if (recibosFiltrados.length === 0) {
    contenedor.innerHTML = '<p>No hay recibos en esta categoría.</p>';
    return;
  }
  
  for (const r of recibosFiltrados) {
    const canvas = await dibujarRecordatorioCanvas(r);
    const dataUrl = canvas.toDataURL('image/png');
    const estado = r.metodo === 'Fiado' ? '<span style="color:red">Fiado</span>' : '<span style="color:green">Pagado</span>';
    
    const div = document.createElement('div');
    div.style.cssText = 'border:1px solid #ccc; border-radius:8px; padding:10px; background:#fff;';
    div.innerHTML = \`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <strong>\${r.ref}</strong>
        \${estado}
      </div>
      <img src="\${dataUrl}" style="width:100%; max-width:300px; border-radius:4px; border:1px solid #eee;" />
      <div style="margin-top:10px; text-align:center;">
        <button onclick="compartirImagenRecibo('\${r.ref}')" style="background:#25D366; color:white; padding:8px 15px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">
          <i class="fab fa-whatsapp"></i> Compartir Imagen
        </button>
      </div>
    \`;
    contenedor.appendChild(div);
  }
}

async function compartirImagenRecibo(ref) {
  try {
    const r = recibos.find(rec => rec.ref === ref);
    if (!r) return;
    
    const canvas = await dibujarRecordatorioCanvas(r);
    canvas.toBlob(async (blob) => {
      const Share = Capacitor.Plugins.Share;
      if (Share && blob) {
        const file = new File([blob], \`recibo_\${r.ref}.png\`, { type: 'image/png' });
        await Share.share({
          title: 'Recibo Chicken',
          text: \`Recibo \${r.ref} - \${r.cliente}\`,
          files: [file],
          dialogTitle: 'Compartir recibo'
        });
      } else {
        alert('No se pudo compartir. Asegúrate de usar la app instalada.');
      }
    }, 'image/png');
  } catch (e) {
    console.error("Error al compartir:", e);
    alert("Error: " + e.message);
  }
}
</script>`;

if (html.includes(scriptTarget)) {
  html = html.replace(scriptTarget, newJS);
  console.log("✅ 3. Funciones JS de Galería y Compartir Imagen agregadas.");
}

fs.writeFileSync(file, html, 'utf8');
console.log("\\n🎉 Parche de Galería aplicado con éxito.");
