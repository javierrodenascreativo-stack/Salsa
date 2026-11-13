// Función de servidor de "Clase del Viernes".
// Guarda cada inscripción como un archivo privado en Vercel Blob. Todos los datos
// (rol, nombre, origen y hora) van en la ruta del archivo, así que basta con
// listar la carpeta de la fecha para saber quién viene, sin leer cada archivo.
//
// Ruta: rsvps/AAAA-MM-DD/<rol>/<origen>.<id>.<marcaDeTiempo>.<nombreBase64>
//   origen: "a" = se apuntó el alumno, "m" = lo añadió el profe a mano
//
// Variables de entorno del proyecto:
//   BLOB_READ_WRITE_TOKEN  la crea Vercel al conectar el almacén
//   PIN_PROFE              PIN del modo profe

import { put, list, del } from "@vercel/blob";
import crypto from "node:crypto";

const ROLES = ["leader", "follower"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const b64 = (s) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s) => Buffer.from(s, "base64url").toString("utf8");
const cleanName = (n) => String(n || "").trim().replace(/\s+/g, " ");
const studentId = (name) =>
  "a" + crypto.createHash("sha256").update(cleanName(name).toLowerCase()).digest("hex").slice(0, 20);

class UserError extends Error {}

function checkDate(d) {
  if (!DATE_RE.test(String(d || ""))) throw new UserError("Fecha no válida");
  return String(d);
}
function checkName(n) {
  const s = cleanName(n);
  if (!s || s.length > 60) throw new UserError("Escribe tu nombre y apellido (máximo 60 caracteres)");
  return s;
}
function checkRole(r) {
  if (!ROLES.includes(r)) throw new UserError("Rol no válido");
  return r;
}
function isPin(pin) {
  const real = process.env.PIN_PROFE || "";
  const given = String(pin || "");
  if (!real || given.length !== real.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(real));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function requirePin(pin) {
  if (!isPin(pin)) { await sleep(1000); throw new UserError("PIN de profe incorrecto"); }
}

async function entries(date) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: `rsvps/${date}/`, cursor, limit: 1000 });
    for (const b of page.blobs) {
      const parts = b.pathname.split("/");
      const role = parts[2];
      const [src, id, t, enc] = (parts[3] || "").split(".");
      if (!ROLES.includes(role) || !id || !enc) continue;
      let name;
      try { name = unb64(enc); } catch { continue; }
      out.push({ id, role, name, source: src === "m" ? "profe" : "alumno", t: Number(t) || 0, url: b.url });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.t - b.t);
}

const publicList = (all) => all.map(({ id, role, name, source }) => ({ id, role, name, source }));

async function save(date, role, src, id, name) {
  const path = `rsvps/${date}/${role}/${src}.${id}.${Date.now()}.${b64(name)}`;
  await put(path, "1", { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "text/plain" });
}
async function removeById(all, id) {
  const urls = all.filter((e) => e.id === id).map((e) => e.url);
  if (urls.length) await del(urls);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const date = checkDate(req.query.date);
      return res.status(200).json({ ok: true, attendees: publicList(await entries(date)) });
    }
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Método no permitido" });

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.action === "checkPin") {
      if (!isPin(body.pin)) await sleep(1000);
      return res.status(200).json({ ok: isPin(body.pin) });
    }

    const date = checkDate(body.date);
    switch (body.action) {
      case "rsvp": {
        const name = checkName(body.name), role = checkRole(body.role), id = studentId(name);
        await removeById(await entries(date), id);
        await save(date, role, "a", id, name);
        break;
      }
      case "cancel": {
        const id = studentId(checkName(body.name));
        await removeById(await entries(date), id);
        break;
      }
      case "add": {
        await requirePin(body.pin);
        const name = checkName(body.name), role = checkRole(body.role);
        await save(date, role, "m", "m" + crypto.randomBytes(8).toString("hex"), name);
        break;
      }
      case "remove": {
        await requirePin(body.pin);
        await removeById(await entries(date), String(body.id || ""));
        break;
      }
      default:
        return res.status(400).json({ ok: false, error: "Acción desconocida" });
    }
    return res.status(200).json({ ok: true, attendees: publicList(await entries(date)) });
  } catch (err) {
    if (err instanceof UserError || err instanceof SyntaxError) {
      return res.status(400).json({ ok: false, error: err instanceof UserError ? err.message : "Petición no válida" });
    }
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error del servidor. Inténtalo de nuevo en un momento." });
  }
}
