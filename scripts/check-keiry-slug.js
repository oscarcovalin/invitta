const https = require("https");
const SUPABASE_URL = "https://zqnlvmafwcioizzxhnhz.supabase.co";
const SUPABASE_KEY = "sb_publishable_aGhY_wqkcuv0c2wLDMb-nw_wsjjfTcd";
const SLUG = "Keiry-XV";

function doFetch(url, opts) {
  if (!opts) opts = {};
  return new Promise(function(resolve, reject) {
    var r = https.request(url, opts, function(resp) {
      var b = "";
      resp.on("data", function(c) { b += c; });
      resp.on("end", function() { resolve({ status: resp.statusCode, headers: resp.headers, body: b }); });
    });
    r.on("error", reject);
    r.end();
  });
}

async function run() {
  console.log("[1] Supabase check...");
  try {
    var r = await doFetch(SUPABASE_URL + "/rest/v1/studio_invitations?select=slug,published,expires_at&slug=ilike." + SLUG + "&limit=1", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, Accept: "application/json" }
    });
    console.log("  HTTP Status:", r.status);
    var d = JSON.parse(r.body);
    console.log("  Resultado:", JSON.stringify(d));
    if (!d || d.length === 0) {
      console.error("  FAIL: slug NO existe en Supabase");
    } else {
      var rec = d[0];
      console.log("  slug:", rec.slug, "published:", rec.published, "expires_at:", rec.expires_at);
      if (!rec.published) console.error("  FAIL: published=false");
      else if (rec.expires_at && new Date(rec.expires_at) < new Date()) console.error("  FAIL: expirado el " + rec.expires_at);
      else console.log("  OK: slug activo y publicado");
    }
  } catch(e) { console.error("  ERROR Supabase:", e.message); }

  console.log("[2] HTTP check...");
  try {
    var r2 = await doFetch("https://invitta.vercel.app/invitacion.html?slug=Keiry-XV", { method: "HEAD" });
    console.log("  Status:", r2.status, " Cache-Control:", r2.headers["cache-control"]);
    if (r2.status !== 200) console.error("  FAIL: no es 200");
    else console.log("  OK: 200");
  } catch(e) { console.error("  ERROR HTTP:", e.message); }

  console.log("[3] Bundle JS check...");
  try {
    var r3 = await doFetch("https://invitta.vercel.app/invitacion.html?slug=Keiry-XV");
    var hasBundleJs = /src="\/assets\/invitacion-[^"]+\.js"/.test(r3.body);
    if (hasBundleJs) {
      console.log("  OK: Bundle /assets/invitacion-*.js ENCONTRADO");
    } else {
      console.error("  FAIL: Bundle NO encontrado. La funcion sirve el HTML fuente sin bundle.");
    }
  } catch(e) { console.error("  ERROR HTML:", e.message); }
}

run();