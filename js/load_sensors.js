const SUPABASE_URL = "https://zcunoncbyitfsilrhymv.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjdW5vbmNieWl0ZnNpbHJoeW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3Mjk3NDYsImV4cCI6MjA2NzMwNTc0Nn0._z_tqm_5UIBkWfMa7HAJrUOA-0t9vOaBVV48-74esWQ"

async function loadSensors(){
    const url = `${SUPABASE_URL}/rest/v1/latest_sensor_readings`
    const response = await fetch(url, {
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    })
    if (!response.ok) {
        const err = await response.text()
        console.error("SUPABASE ERROR:", err)
        return
    }
    const data = await response.json()
    buildTable(data)
}


function buildTable(data){
    const latest = {}
    data.forEach(r => {
        if(!latest[r.sensor_index]){
            latest[r.sensor_index] = r
        }
    })
    const tbody = document.querySelector("#sensorTable tbody")
    Object.values(latest).forEach(s => {
        const qc = qcCheck(s.pm25_atm_a, s.pm25_atm_b)
        const tr = document.createElement("tr")

        tr.innerHTML = `
        <td>${s.name}</td>
        <td>${new Date(s.recorded_at).toLocaleString()}</td>
        <td>${s.pm25_atm_a}</td>
        <td>${s.pm25_atm_b}</td>
        <td>${qc.avg}</td>
        <td>${qc.diff}%</td>
        <td class="${qc.status}">${qc.status}</td>
        `
        tr.onclick = () => loadHistory(s.sensor_index)
        tbody.appendChild(tr)
    })
}

loadSensors()
