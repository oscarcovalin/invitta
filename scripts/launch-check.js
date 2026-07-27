const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const failures = [];
const activeDemos = [
  "demos/xv-elegance/index.html",
  "demos/xv-premium-2/index.html",
  "demos/xv-vip-3/index.html",
  "demos/boda-classic-basic/index.html",
  "demos/boda-golden-romance-premium/index.html",
  "demos/boda-premium-1/index.html"
];
const checkedJavaScript = [
  "api/create-checkout-session.js",
  "api/invitation-meta.js",
  "api/payment-config.js",
  "api/payment-status.js",
  "api/stripe-webhook.js",
  "js/invitation-public.js",
  "js/studio-form.js",
  "assets/js/password-recovery.js"
];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Falta ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const demo of activeDemos) {
  const html = read(demo);
  if (!html) continue;
  if (/\/src\/main\.(?:t|j)sx?/.test(html)) {
    fail(`${demo} apunta a código fuente en lugar de una compilación`);
  }

  const references = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)];
  for (const match of references) {
    const reference = match[1].split("?")[0];
    if (/^(?:https?:)?\/\//.test(reference)) continue;
    const target = path.resolve(path.dirname(path.join(root, demo)), reference);
    if (!target.startsWith(root) || !fs.existsSync(target)) {
      fail(`${demo} referencia un recurso inexistente: ${reference}`);
    }
  }
}

for (const relativePath of checkedJavaScript) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Falta ${relativePath}`);
    continue;
  }
  const result = spawnSync(process.execPath, ["--check", absolutePath], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(`${relativePath} no supera node --check: ${result.stderr.trim()}`);
  }
}

try {
  const vercel = JSON.parse(read("vercel.json"));
  const invitationRewrite = (vercel.rewrites || []).some(
    (entry) => entry.source === "/invitacion.html" && entry.destination === "/api/invitation-meta"
  );
  if (!invitationRewrite) fail("Falta el rewrite de /invitacion.html");
  if (!(vercel.headers || []).length) fail("Faltan encabezados HTTP de seguridad");
} catch (error) {
  fail(`vercel.json no es válido: ${error.message}`);
}

const requestPage = read("solicitar-invitacion.html");
if (!requestPage.includes('id="paymentButton"') || !requestPage.includes("/api/payment-config")) {
  fail("La página de solicitud no controla la disponibilidad de pagos");
}

if (failures.length) {
  console.error("\nRevisión de lanzamiento fallida:\n");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Revisión de lanzamiento correcta: ${activeDemos.length} demos y ${checkedJavaScript.length} scripts validados.`);
