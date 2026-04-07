const url = "https://dkevinm.github.io/AB_datapull/data/AB_PM25_map.json"

async function loadSensors(){

    const response = await fetch(url)
    const data = await response.json()

    console.log("DATA:", data)

    buildTable(data)
}

function buildTable(data){

    const tbody = document.querySelector("#sensorTable tbody")
    tbody.innerHTML = ""

    data.forEach(s => {

        if (!s.name) return

        const hoursOld = (Date.now() - s.last_seen) / 3600000

        let status = "GOOD"
        if (hoursOld > 3) status = "OFFLINE"

        const tr = document.createElement("tr")

        tr.innerHTML = `
        <td>${s.name}</td>

        <td>${new Date(s.last_seen).toLocaleString("en-CA", {
            timeZone: "America/Edmonton"
        })}</td>

        <td>${s["pm2.5_atm_a"] ?? "-"}</td>
        <td>${s["pm2.5_atm_b"] ?? "-"}</td>

        <td>${s.pm_method ?? "-"}</td>
        <td>${s.pm_corr ?? "-"}</td>

        <td>${status}</td>
        `

        tbody.appendChild(tr)
    })
}

loadSensors()
setInterval(loadSensors, 60 * 60 * 1000)
