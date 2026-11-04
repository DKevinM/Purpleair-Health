// Health snapshot written every 30 min by publish_health.py on the KRM server (no tokens, IDs or admin in it).
const url = "https://status.krmenvironmental.com/health-data/health.json"
const TZ = "America/Edmonton"
let DATA = null, filter = "all"

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
const fmt = v => v != null && isFinite(v) ? Number(v).toFixed(1) : "-"
const local = iso => {
    if (!iso) return "-"
    const d = new Date(iso)
    return isNaN(d) ? "-" : d.toLocaleString("en-CA", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}
const ago = iso => {
    if (!iso) return ""
    const h = (Date.now() - new Date(iso)) / 3600e3
    return h < 1 ? `${Math.max(1, Math.round(h * 60))} min ago` : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} days ago`
}
const BADGE = { ok: ["OK", "ok"], check: ["Check", "warn"], offline: ["Not reporting", "bad"], dead: ["Dead", "dead"], not_on_map: ["Not on map", "muted"] }
const STN_BADGE = { ok: ["OK", "ok"], check: ["Check", "warn"], problem: ["Problem", "bad"], offline: ["Not reporting", "bad"], shut: ["Shut down", "dead"] }
const CH_ORDER = ["SO2", "H2S", "TRS", "NO", "NO2", "NOX", "O3", "CO", "PM25", "THC", "CH4", "NMHC", "NH3", "WS", "WD", "ET", "RH", "BP", "PR"]
const CH_LABEL = { SO2: "SO₂", H2S: "H₂S", NO2: "NO₂", NOX: "NOₓ", O3: "O₃", PM25: "PM2.5", CH4: "CH₄", NH3: "NH₃", ET: "Temp" }

function renderStations(S) {
    document.getElementById("mdsDown").innerHTML = DATA.mds_server_down
        ? `<p><span class="badge bad">The MDS station server is not answering - station data has stopped coming in</span></p>` : ""
    document.getElementById("stationTables").innerHTML = ["ACA", "WCAS"].map(net => {
        const rows = S.filter(s => s.airshed === net)
        const chans = CH_ORDER.filter(c => rows.some(r => c in r.channels))
        return `<h3>${net}</h3><div class="scroll"><table class="stn">
        <thead><tr><th>Station</th><th>Status</th><th>What we found</th><th>Data through</th>${chans.map(c => `<th>${CH_LABEL[c] || c}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => {
            const [label, cls] = STN_BADGE[r.status] || [r.status, "muted"]
            return `<tr class="${r.status === "problem" || r.status === "offline" ? "rowbad" : ""}">
            <td class="l"><b>${esc(r.station)}</b></td>
            <td><span class="badge ${cls}">${label}</span></td>
            <td class="l sub">${r.issues.length ? r.issues.map(i => `<b>${CH_LABEL[i.channel] || i.channel}</b>: ${esc(i.text)}`).join("<br>") : esc(r.detail)}</td>
            <td>${local(r.data_through_utc)}</td>
            ${chans.map(c => {
                const ch = r.channels[c]
                if (!ch) return "<td></td>"
                const v = ch.v != null && ch.s !== "off" ? `<div class="val">${fmt(ch.v)}</div>` : ""
                return `<td><span class="dot ${ch.s}" title="${esc((CH_LABEL[c] || c) + ": " + ch.t)}"></span>${v}</td>`
            }).join("")}</tr>`
        }).join("")}</tbody></table></div>`
    }).join("")
}

async function loadHealth() {
    try {
        const r = await fetch(`${url}?t=${Date.now()}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        DATA = await r.json()
        render()
    } catch (e) {
        document.getElementById("updated").textContent = `Could not load the health data (${e.message}). It refreshes every 30 minutes.`
    }
}

function render() {
    const d = DATA, P = d.purpleair, L = d.lights
    const age = (Date.now() - new Date(d.generated_utc)) / 3600e3
    document.getElementById("updated").innerHTML = `Updated ${local(d.generated_utc)} (${ago(d.generated_utc)})` +
        (age > 2 ? ` <span class="badge bad">data is old - the update may have stopped</span>` : "")

    const n = s => P.filter(p => p.status === s).length
    const lOk = L.filter(l => l.ok).length
    const S = d.stations || [], live = S.filter(s => s.status !== "shut")
    const sBad = live.filter(s => s.status === "problem" || s.status === "offline").length
    const sChk = live.filter(s => s.status === "check").length
    document.getElementById("tiles").innerHTML = [
        ["Stations OK", `${live.length - sBad - sChk} / ${live.length}`, sBad ? "bad" : sChk ? "warn" : "ok"],
        ["Stations with a problem", sBad, sBad ? "bad" : "ok"],
        ["Lights on", `${lOk} / ${L.length}`, lOk === L.length ? "ok" : "warn"],
        ["PurpleAir OK", `${n("ok")} / ${P.length}`, "ok"],
        ["PurpleAir to check", n("check"), n("check") ? "warn" : "ok"],
        ["PurpleAir not reporting", n("offline"), n("offline") ? "bad" : "ok"],
        ["PurpleAir dead", n("dead"), n("dead") ? "dead" : "ok"],
    ].map(([k, v, c]) => `<div class="tile ${c}"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")

    renderStations(S)

    document.querySelector("#lightTable tbody").innerHTML = L.map(l => `<tr class="${l.ok ? "" : "rowbad"}">
        <td><b>${esc(l.name)}</b>${l.brand !== "LIFX" ? ` <span class="sub">${esc(l.brand)}</span>` : ""}</td>
        <td>${l.showing_color ? `<span class="sw" style="background:${esc(l.showing_color)}"></span>` : ""}${esc(l.showing_label || "-")}</td>
        <td><span class="badge ${l.ok ? "ok" : "bad"}">${esc(l.status)}</span></td>
        <td>${esc(l.source)}</td>
        <td>${local(l.last_update_utc)}</td>
        <td class="sub">${l.issues.map(esc).join("<br>") || "-"}</td></tr>`).join("")

    const rows = P.filter(p => filter === "all" || p.status !== "ok")
    document.getElementById("paCount").textContent = `${rows.length} of ${P.length} sensors`
    document.querySelector("#sensorTable tbody").innerHTML = rows.map(s => {
        const [label, cls] = BADGE[s.status] || [s.status, "muted"]
        return `<tr>
        <td>${s.sensor_index}</td>
        <td>${esc(s.name)}${s.indoor ? ` <span class="sub">(indoor)</span>` : ""}</td>
        <td>${s.group}</td>
        <td><span class="badge ${cls}">${label}</span></td>
        <td class="sub">${esc(s.status_detail)}</td>
        <td>${local(s.last_seen_utc)}</td>
        <td>${fmt(s.a)}</td><td>${fmt(s.b)}</td>
        <td>${esc(s.method || "-")}</td>
        <td>${fmt(s.pm_corr)}</td></tr>`
    }).join("")

    document.getElementById("deadN").textContent = d.dead_list.length
    document.querySelector("#deadTable tbody").innerHTML = d.dead_list.map(s =>
        `<tr><td>${s.sensor_index}</td><td>${esc(s.name || "(unknown)")}</td><td>${s.airshed || "-"}</td></tr>`).join("")
}

document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => {
    filter = b.dataset.f
    document.querySelectorAll("[data-f]").forEach(x => x.classList.toggle("on", x === b))
    if (DATA) render()
})

loadHealth()
setInterval(loadHealth, 10 * 60 * 1000)
