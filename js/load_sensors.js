const SUPABASE_URL = "YOUR_URL"
const SUPABASE_KEY = "YOUR_KEY"

async function loadSensors(){

    const url = `${SUPABASE_URL}/rest/v1/sensor_readings?select=sensor_index,name,timestamp,pm2_5_atm_a,pm2_5_atm_b&order=timestamp.desc`

    const response = await fetch(url,{
        headers:{
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
        }
    })

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

        const qc = qcCheck(s.pm2_5_atm_a, s.pm2_5_atm_b)

        const tr = document.createElement("tr")

        tr.innerHTML = `
        <td>${s.name}</td>
        <td>${new Date(s.timestamp).toLocaleString()}</td>
        <td>${s.pm2_5_atm_a}</td>
        <td>${s.pm2_5_atm_b}</td>
        <td>${qc.avg}</td>
        <td>${qc.diff}%</td>
        <td class="${qc.status}">${qc.status}</td>
        `

        tr.onclick = () => loadHistory(s.sensor_index)

        tbody.appendChild(tr)

    })

}

loadSensors()
