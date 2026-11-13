/**
 * Backend de "Clase del Viernes" en Google Apps Script.
 * Guarda las confirmaciones en la hoja "Asistencia" de la hoja de cálculo
 * a la que está vinculado este script.
 *
 * Antes de implementar: en Configuración del proyecto > Propiedades del script,
 * crea la propiedad PIN_PROFE con el PIN que usarás para el modo profe.
 */

const SHEET_NAME = 'Asistencia';
const HEADERS = ['id', 'fecha', 'nombre', 'rol', 'origen', 'actualizado'];
const ROLES = ['leader', 'follower'];

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.action === 'list') return json_({ ok: true, attendees: list_(checkDate_(p.date)) });
    return json_({ ok: false, error: 'Acción desconocida' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'checkPin') return json_({ ok: isPin_(body.pin) });

    lock.waitLock(10000);
    switch (body.action) {
      case 'rsvp':   rsvp_(checkDate_(body.date), checkName_(body.name), checkRole_(body.role)); break;
      case 'cancel': cancel_(checkDate_(body.date), checkName_(body.name)); break;
      case 'add':    requirePin_(body.pin); add_(checkDate_(body.date), checkName_(body.name), checkRole_(body.role)); break;
      case 'remove': requirePin_(body.pin); remove_(String(body.id || '')); break;
      default: return json_({ ok: false, error: 'Acción desconocida' });
    }
    return json_({ ok: true, attendees: body.date ? list_(checkDate_(body.date)) : [] });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ---------- datos ---------- */

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.getRange('B:B').setNumberFormat('@'); // la fecha se guarda como texto AAAA-MM-DD
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues().map(function (r, i) {
    return {
      row: i + 2,
      id: String(r[0]),
      date: r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1]),
      name: String(r[2]),
      role: String(r[3]),
      source: String(r[4]),
      updated: r[5] instanceof Date ? r[5].toISOString() : String(r[5])
    };
  });
}

function list_(date) {
  return rows_()
    .filter(function (r) { return r.date === date && ROLES.indexOf(r.role) >= 0; })
    .sort(function (a, b) { return a.updated < b.updated ? -1 : 1; })
    .map(function (r) { return { id: r.id, name: r.name, role: r.role, source: r.source }; });
}

function key_(name) { return name.trim().replace(/\s+/g, ' ').toLowerCase(); }

function findStudent_(date, name) {
  const k = key_(name);
  return rows_().filter(function (r) { return r.date === date && r.source === 'alumno' && key_(r.name) === k; })[0];
}

function rsvp_(date, name, role) {
  const sh = sheet_();
  const now = new Date().toISOString();
  const found = findStudent_(date, name);
  if (found) {
    sh.getRange(found.row, 3, 1, 4).setValues([[name, role, 'alumno', now]]);
  } else {
    sh.appendRow([Utilities.getUuid(), date, name, role, 'alumno', now]);
  }
}

function cancel_(date, name) {
  const found = findStudent_(date, name);
  if (found) sheet_().deleteRow(found.row);
}

function add_(date, name, role) {
  sheet_().appendRow([Utilities.getUuid(), date, name, role, 'profe', new Date().toISOString()]);
}

function remove_(id) {
  const found = rows_().filter(function (r) { return r.id === id; })[0];
  if (found) sheet_().deleteRow(found.row);
}

/* ---------- validación ---------- */

function checkDate_(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) throw new Error('Fecha no válida');
  return String(d);
}
function checkName_(n) {
  const s = String(n || '').trim().replace(/\s+/g, ' ');
  if (!s || s.length > 60) throw new Error('Escribe tu nombre y apellido (máximo 60 caracteres)');
  // Evita que una hoja de cálculo interprete el nombre como fórmula.
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function checkRole_(r) {
  if (ROLES.indexOf(r) < 0) throw new Error('Rol no válido');
  return r;
}
function isPin_(pin) {
  const real = PropertiesService.getScriptProperties().getProperty('PIN_PROFE');
  return !!real && String(pin || '') === real;
}
function requirePin_(pin) {
  if (!isPin_(pin)) throw new Error('PIN de profe incorrecto');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
