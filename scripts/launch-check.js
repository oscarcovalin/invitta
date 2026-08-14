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
  "demos/evento-general-basic/index.html",
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
  "demos/evento-general-basic/app.js",
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
  const routes = vercel.routes || [];
  const invitationRewrite = routes.some(
    (entry) => entry.src === "/invitacion\\.html$" && entry.dest === "/api/invitation-meta"
  );
  if (!invitationRewrite) fail("Falta el rewrite de /invitacion.html");
  const securityRoute = routes.find((entry) => entry.src === "/(.*)" && entry.continue === true);
  if (!securityRoute?.headers?.["Content-Security-Policy"]) {
    fail("Faltan encabezados HTTP de seguridad");
  }
  const legacyRoutes = [
    "elegance",
    "paquete2",
    "paquete3",
    "boda-classic-basic",
    "boda-golden-romance",
    "boda1"
  ];
  for (const legacyRoute of legacyRoutes) {
    if (!routes.some((entry) => entry.src === `/plantillas/${legacyRoute}/?$` && entry.status === 308)) {
      fail(`Falta la redirección legada de ${legacyRoute}`);
    }
  }
} catch (error) {
  fail(`vercel.json no es válido: ${error.message}`);
}

const requestPage = read("solicitar-invitacion.html");
if (!requestPage.includes('id="paymentButton"') || !requestPage.includes("/api/payment-config")) {
  fail("La página de solicitud no controla la disponibilidad de pagos");
}

const studioInvitationForm = read("administracion/studio-invitacion-form.html");
if (!studioInvitationForm.includes('name="typography_scale"') || !studioInvitationForm.includes("typographyScaleNames")) {
  fail("Faltan los controles de tamaño tipográfico del Studio");
}

const publicPersonalization = read("demos/shared/public-personalization.js");
if (!publicPersonalization.includes("applyTypographyScales") || !publicPersonalization.includes("typographyScales")) {
  fail("La invitación pública no aplica las escalas tipográficas");
}
const typographyNamesSelector = publicPersonalization.match(/names:\s*"([^"]+)"/)?.[1] || "";
if (!publicPersonalization.includes("typographyTargetSelectors[target]") ||
    !typographyNamesSelector.includes(".hero__name,#celebrant-name") ||
    typographyNamesSelector.includes("guest-name") ||
    typographyNamesSelector.includes("inv-pass-name") ||
    typographyNamesSelector.includes("signature")) {
  fail("La fuente y el tamaño no comparten los mismos destinos tipográficos");
}

const generalEventApp = read("demos/evento-general-basic/app.js");
const generalEventStyles = read("demos/evento-general-basic/style.css");
if (!generalEventApp.includes('classList.toggle("has-music-player"')) {
  fail("La plantilla general no identifica cuando el reproductor de música está visible");
}
if (!generalEventStyles.includes("body.has-music-player .closing")) {
  fail("La plantilla general no reserva espacio final para el reproductor de música");
}
if (!generalEventStyles.includes(".theme-milestone-50 .hero__ornament { margin: 1.6rem 0 1.4rem; }")) {
  fail("La portada de cumpleaños no conserva espacio entre el nombre y la fecha en pantallas bajas");
}

const socialCoverPath = "demos/evento-general-basic/assets/cumpleanos-50-sorpresa-social.jpg";
const socialCoverAbsolutePath = path.join(root, socialCoverPath);
if (!fs.existsSync(socialCoverAbsolutePath)) {
  fail(`Falta la portada social de cumpleaños: ${socialCoverPath}`);
} else if (fs.statSync(socialCoverAbsolutePath).size > 300 * 1024) {
  fail("La portada social de cumpleaños supera 300 KB");
}

const invitationMeta = read("api/invitation-meta.js");
if (!invitationMeta.includes("cumpleanos-50-sorpresa-social.jpg")) {
  fail("La plantilla de cumpleaños 50 no usa su portada social optimizada");
}
if (!invitationMeta.includes('og:image:width') || !invitationMeta.includes('og:image:height')) {
  fail("Faltan las dimensiones Open Graph de la portada social");
}

if (failures.length) {
  console.error("\nRevisión de lanzamiento fallida:\n");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Revisión de lanzamiento correcta: ${activeDemos.length} demos y ${checkedJavaScript.length} scripts validados.`);
