// Same-origin company logo proxy to avoid exposing third-party logo providers in the client.
// Browser calls /api/company-logo?company=...&size=...

const DOMAIN_OVERRIDES = {
  "Walmart": "walmart.com",
  "Amazon": "amazon.com",
  "Amazon.com": "amazon.com",
  "UnitedHealth Group": "unitedhealthgroup.com",
  "Apple": "apple.com",
  "CVS Health": "cvshealth.com",
  "Alphabet": "abc.xyz",
  "Exxon Mobil": "exxonmobil.com",
  "JPMorgan Chase": "jpmorganchase.com",
  "Costco": "costco.com",
  "Microsoft": "microsoft.com",
  "Bank of America": "bankofamerica.com",
  "Meta Platforms": "meta.com",
  "NVIDIA": "nvidia.com",
  "Goldman Sachs": "goldmansachs.com",
  "Wells Fargo": "wellsfargo.com",
  "Comcast": "comcast.com",
  "AT&T": "att.com",
  "Tesla": "tesla.com",
  "Walt Disney": "thewaltdisneycompany.com",
  "Disney": "disney.com",
  "Johnson & Johnson": "jnj.com",
  "Procter & Gamble": "pg.com",
  "Lowe's": "lowes.com",
  "Pfizer": "pfizer.com",
  "IBM": "ibm.com",
  "Oracle": "oracle.com",
  "Intel": "intel.com",
  "Nike": "nike.com",
  "Coca-Cola": "coca-colacompany.com",
  "Adobe": "adobe.com",
  "AMD": "amd.com"
};

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: { Allow: "GET, OPTIONS" }, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: { Allow: "GET, OPTIONS" }, body: "Method not allowed" };

  const q = event.queryStringParameters || {};
  const company = clean(q.company || "");
  const size = Math.max(16, Math.min(512, Number(q.size) || 80));
  const domain = resolveDomain(company);
  if (!domain) return svgResponse(initials(company || "?"), size, 200);

  const remote = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${Math.max(64, size * 2)}`;
  try {
    const res = await fetch(remote, {
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "EmploymentCafeLogoProxy/1.0"
      }
    });
    if (!res.ok) return svgResponse(initials(company || "?"), size, 200);
    const ab = await res.arrayBuffer();
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        Vary: "Accept"
      },
      body: Buffer.from(ab).toString("base64")
    };
  } catch {
    return svgResponse(initials(company || "?"), size, 200);
  }
};

function resolveDomain(company) {
  if (!company) return "";
  if (DOMAIN_OVERRIDES[company]) return DOMAIN_OVERRIDES[company];
  return clean(company)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(company|companies|corporation|corp|inc|llc|holdings|group|international|systems|technologies|technology|services|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "") + ".com";
}

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function initials(s) {
  return String(s || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "?";
}

function svgResponse(label, size, code) {
  const n = Math.max(16, Math.min(512, Number(size) || 80));
  const font = Math.max(10, Math.floor(n / 3));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 ${n} ${n}"><rect width="100%" height="100%" rx="12" fill="#fff7ed"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${font}" font-weight="800" fill="#7c2d12">${escapeXml(label)}</text></svg>`;
  return {
    statusCode: code || 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
    },
    body: svg
  };
}

function escapeXml(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
