const fs = require('fs');
const ruta = './www/index.html';
let html = fs.readFileSync(ruta, 'utf8');
let cambios = 0;

// 1. Reemplazar carga inicial de inventario
const oldInv = "let inventario =\n  JSON.parse(localStorage.getItem('inventario')) || [];";
if (html.includes(oldInv)) {
  html = html.replace(oldInv, "let inventario = [];");
  cambios++;
  console.log("OK 1. Inventario inicializado sin localStorage");
}

// 2. Reemplazar carga inicial de recibos
const oldRec = "let recibos =\n  JSON.parse(localStorage.getItem('recibos')) || [];";
if (html.includes(oldRec)) {
  html = html.replace(oldRec, "let recibos = [];");
  cambios++;
  console.log("OK 2. Recibos inicializados sin localStorage");
}

// 3. Reemplazar funcion guardarDatos completa
const oldGuardado = "function guardarDatos() {\n\n  localStorage.setItem(\n    'inventario',\n    JSON.stringify(inventario)\n  );\n\n  localStorage.setItem(\n    'recibos',\n    JSON.stringify(recibos)\n  );\n\n}";

const newGuardado = [
  "",
  "let dbInitialized = false;",
  "",
  "async function inicializarDB() {",
  "  try {",
  "    const sqlite = window.Capacitor?.Plugins?.Sqlite;",
  "    if (!sqlite) { console.warn('Modo navegador: usando localStorage'); cargarBackup(); return; }",
  "    await sqlite.createConnection({ database: 'chicken_db', encrypted: false, mode: 'no-encryption' });",
  "    await sqlite.open({ database: 'chicken_db', encrypted: false, mode: 'no-encryption' });",
  "    await sqlite.execute({ database: 'chicken_db', statements: \"CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT); CREATE TABLE IF NOT EXISTS recibos (ref TEXT PRIMARY KEY, cliente TEXT, pollos TEXT, precioPorKilo REAL, total REAL, metodo TEXT, fecha TEXT);\" });",
  "    const resInv = await sqlite.query({ database: 'chicken_db', statement: \"SELECT value FROM config WHERE key = 'inventario'\" });",
  "    if (resInv.values && resInv.values.length > 0) inventario = JSON.parse(resInv.values[0].value);",
  "    const resRec = await sqlite.query({ database: 'chicken_db', statement: \"SELECT * FROM recibos\" });",
  "    if (resRec.values) recibos = resRec.values.map(function(r){ return { ref:r.ref, cliente:r.cliente, pollos:JSON.parse(r.pollos), precioPorKilo:r.precioPorKilo, total:r.total, metodo:r.metodo, fecha:r.fecha }; });",
  "    if (recibos.length > 0) refCount = Math.max(...recibos.map(function(r){ return parseInt(r.ref.split('-')[2]); })) + 1;",
  "    dbInitialized = true;",
  "    console.log('SQLite listo');",
  "  } catch(e) { console.error('Error DB:', e); cargarBackup(); }",
  "}",
  "",
  "function cargarBackup() {",
  "  inventario = JSON.parse(localStorage.getItem('inventario')) || [];",
  "  recibos = JSON.parse(localStorage.getItem('recibos')) || [];",
  "  if(recibos.length>0) refCount = Math.max(...recibos.map(function(r){ return parseInt(r.ref.split('-')[2]); }))+1;",
  "}",
  "",
  "async function guardarDatos() {",
  "  try {",
  "    const sqlite = window.Capacitor?.Plugins?.Sqlite;",
  "    if (!sqlite || !dbInitialized) {",
  "      localStorage.setItem('inventario', JSON.stringify(inventario));",
  "      localStorage.setItem('recibos', JSON.stringify(recibos));",
  "      return;",
  "    }",
  "    const invStr = JSON.stringify(inventario).replace(/'/g,\"''\");",
  "    await sqlite.execute({ database:'chicken_db', statements:\"INSERT OR REPLACE INTO config (key,value) VALUES ('inventario','\" + invStr + \"');\" });",
  "    await sqlite.execute({ database:'chicken_db', statements:\"DELETE FROM recibos;\" });",
  "    const stmts = recibos.map(function(r){ return \"INSERT INTO recibos VALUES ('\" + r.ref + \"','\" + r.cliente.replace(/'/g,\"''\") + \"','\" + JSON.stringify(r.pollos).replace(/'/g,\"''\") + \"',\" + r.precioPorKilo + \",\" + r.total + \",'\" + r.metodo + \"','\" + r.fecha + \"');\"; }).join('\\n');",
  "    if(stmts) await sqlite.execute({ database:'chicken_db', statements:stmts });",
  "  } catch(e) { console.error('Error guardando:',e); }",
  "}",
  "",
  "async function compartirReciboNativo(recibo) {",
  "  try {",
  "    const Share = window.Capacitor?.Plugins?.Share;",
  "    if(Share) {",
  "      const txt = '🍗 RECIBO - CHICKEN\\n\\nRef: ' + recibo.ref + '\\nCliente: ' + recibo.cliente + '\\nCantidad: ' + recibo.pollos.length + ' pollo(s)\\nTotal: $' + formatearCOP(recibo.total) + '\\nMetodo: ' + recibo.metodo + '\\nFecha: ' + recibo.fecha + '\\n\\n¡Gracias por su compra!';",
  "      await Share.share({ title:'Recibo Chicken', text:txt, dialogTitle:'Compartir recibo' });",
  "    }",
  "  } catch(e) { console.error('Error compartiendo:',e); }",
  "}",
  "",
  "document.addEventListener('DOMContentLoaded', async function() {",
  "  await inicializarDB();",
  "});"
].join('\n');

if (html.includes(oldGuardado)) {
  html = html.replace(oldGuardado, newGuardado);
  cambios++;
  console.log("OK 3. guardarDatos reemplazado por SQLite + Share");
} else {
  console.log("WARN: No se encontro guardarDatos con formato exacto.");
}

// 4. Cambiar llamada a guardarDatos por version async + compartir
const oldLlamada = "guardarDatos();\n\n  mostrarRecibo(recibo);";
if(html.includes(oldLlamada)) {
  html = html.replace(oldLlamada, "await guardarDatos();\n\n  mostrarRecibo(recibo);\n\n  compartirReciboNativo(recibo);");
  cambios++;
  console.log("OK 4. Llamada a guardado actualizada con await + compartir");
}

if(cambios > 0) {
  fs.writeFileSync(ruta, html, 'utf8');
  console.log("\nParche completado: " + cambios + " cambios aplicados.");
} else {
  console.log("\nNo se aplicaron cambios. El archivo NO fue modificado.");
}
