const SUPABASE_URL = "https://zcunoncbyitfsilrhymv.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdW5vbmNieWl0ZnNpbHJoeW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3Mjk3NDYsImV4cCI6MjA2NzMwNTc0Nn0._z_tqm_5UIBkWfMa7HAJrUOA-0t9vOaBVV48-74esWQ"

async function loadSensors(){

    const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=sensor_index,name,recorded_at,pm25_atm_a,pm25_atm_b,pm_corrected,pm_method&order=recorded_at.desc&limit=1000`

    const response = await fetch(url, {
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
        }
    })

    if (!response.ok) {
        const err = await response.text()
        console.error("SUPABASE ERROR:", err)
        return
    }

    const data = await response.json()

    console.log("DATA:", data)

    buildTable(data)
}


function buildTable(data){

    const tbody = document.querySelector("#sensorTable tbody")
    tbody.innerHTML = ""

    const latest = {}

    data.forEach(s => {
        if (!latest[s.sensor_index]) {
            latest[s.sensor_index] = s
        }
    })

    Object.values(latest)
      .filter(s => s.name.includes("ACA") || s.name.includes("WCAS"))
      .forEach(s => {

        const qc = qcCheck(s.pm25_atm_a, s.pm25_atm_b)

        const hoursOld = (Date.now() - new Date(s.recorded_at)) / 3600000

        let status = qc.status
        if (hoursOld > 3) status = "OFFLINE"

        const tr = document.createElement("tr")

        tr.innerHTML = `
        <td>${s.name}</td>
        <td>${new Date(s.recorded_at).toLocaleString("en-CA", {
            timeZone: "America/Edmonton"
        })}</td>
        <td>${s.pm25_atm_a ?? "-"}</td>
        <td>${s.pm25_atm_b ?? "-"}</td>
        <td>${s.pm_corrected ?? qc.avg ?? "-"}</td>
        <td>${qc.diff ?? "-"}</td>
        <td class="${status}">${status}</td>
        `

        tbody.appendChild(tr)
    })
}

loadSensors()
setInterval(loadSensors, 60 * 60 * 1000)
