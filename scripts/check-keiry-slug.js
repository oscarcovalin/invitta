const https = require("https");
const SUPABASE_URL = "https://zqnlvmafwcioizzxhnhz.supabase.co";
const SUPABASE_KEY = "sb_publishable_aGhY_wqkcuv0c2wLDMb-nw_wsjjfTcd";
const SLUG = "Keiry-XV";
const FALLBACK_URL = "https://invitta.vercel.app/data/legacy-invitations/keiry-xv.json";
const PROD_URL = "https://invitta.vercel.app/invitacion.html?slug=Keiry-XV";

function doFetch(url, opts) {
  if (!opts) opts = {};
  return new Promise(function(resolve, reject) {
    var r = https.request(url, opts, function(resp) {
      var b = "";
      resp.on("data", function(c) { b += c; });
      resp.on("end", function() { resolve({ status: resp.statusCode, headers: resp.headers, body: b }); });
    });
    r.on("error", reject);
    r.on("timeout", function() { r.destroy(); reject(new Error("Timeout")); });
    if (opts.timeout) r.setTimeout(opts.timeout);
    r.end();
  });
}

async function run() {
  console.log("=================================================");
  console.log("  Diagnostico Invitta Legacy -- Keiry-XV");
  console.log("=================================================");

  console.log("\n[1] Chequeo de Supabase...");
  let supabaseOk = false;
  try {
    var r = await doFetch(SUPABASE_URL + "/rest/v1/studio_invitations?select=slug,published,expires_at,template_id&slug=ilike." + SLUG + "&limit=1", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, Accept: "application/json" },
      timeout: 5000
    });
    console.log("  HTTP Status:", r.status);
    if (r.status === 200) {
      var d = JSON.parse(r.body);
      if (!d || d.length === 0) {
        console.warn("  WARN: slug NO existe en Supabase");
      } else {
        var rec = d[0];
        console.log("  slug:", rec.slug, "published:", rec.published, "expires_at:", rec.expires_at, "template_id:", rec.template_id);
        if (!rec.template_id) {
          console.error("  FAIL CRITICO: template_id es null. La invitacion no renderizara visualmente.");
          supabaseOk = false;
        }
        if (!rec.published) console.warn("  WARN: published=false");
        else if (rec.template_id) supabaseOk = true;
      }
    } else {
      console.warn("  WARN: Supabase fallo con status", r.status, r.body);
    }
  } catch(e) { 
    console.warn("  WARN: Supabase Timeout o caido:", e.message);
  }

  console.log("\n[2] Chequeo de Fallback Local...");
  let fallbackOk = false;
  try {
    var fb = await doFetch(FALLBACK_URL, { method: "GET" });
    if (fb.status === 200) {
      console.log("  OK: Fallback local disponible en /data/legacy-invitations/keiry-xv.json");
      var fbData = JSON.parse(fb.body);
      if (!fbData.template_id) {
        console.error("  FAIL CRITICO: El fallback local tiene template_id = null. La invitacion no renderizara.");
      } else {
        console.log("  OK: template_id en fallback es " + fbData.template_id);
        fallbackOk = true;
      }
    } else {
      console.error("  FAIL: Fallback local HTTP", fb.status);
    }
  } catch(e) {
    console.error("  ERROR Fallback:", e.message);
  }

  console.log("\n[3] Chequeo de URL de Produccion (/invitacion.html?slug=Keiry-XV)...");
  try {
    var r2 = await doFetch(PROD_URL, { method: "HEAD" });
    console.log("  Status:", r2.status, " Cache-Control:", r2.headers["cache-control"]);
    if (r2.status !== 200) console.error("  FAIL: URL principal no responde 200");
    else console.log("  OK: URL responde 200");
  } catch(e) { console.error("  ERROR HTTP:", e.message); }

  console.log("\n[4] Chequeo de Bundle JS y Flujo...");
  try {
    var r3 = await doFetch(PROD_URL);
    var hasBundleJs = /src="\/assets\/invitacion-[^"]+\.js"/.test(r3.body);
    if (hasBundleJs) {
      console.log("  OK: Bundle /assets/invitacion-*.js ENCONTRADO");
    } else {
      console.error("  FAIL: Bundle NO encontrado. Pantalla estara en loading infinito.");
    }
  } catch(e) { console.error("  ERROR HTML:", e.message); }

  console.log("\n=================================================");
  if (supabaseOk || fallbackOk) {
    console.log("  STATUS FINAL: La invitacion podra cargar (" + (supabaseOk ? "Via Supabase" : "Via Fallback de Emergencia") + ")");
  } else {
    console.log("  STATUS FINAL: FALLO CRITICO. Ni Supabase ni el Fallback estan respondiendo.");
  }
  console.log("=================================================\n");
}

run();