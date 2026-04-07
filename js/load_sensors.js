const url = "https://dkevinm.github.io/AB_datapull/data/AB_PM25_map.json"

async function loadSensors(){
    const response = await fetch(url)
    const data = await response.json()
    console.log("DATA:", data)
    buildTable(data)
}

function fmt(v){
    return v != null ? Number(v).toFixed(1) : "-"
}


function formatNoTZ(ms){
    const d = new Date(ms)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')} ` +
           `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')}`
}


function buildTable(data){
    const tbody = document.querySelector("#sensorTable tbody")
    tbody.innerHTML = ""
    data
      .filter(s => {
          if (!s.name) return false
          const name = s.name.toUpperCase()
    
          if (name.includes("PAS_ACADIAVALLEY")) return false
    
          return name.includes("ACA") || name.includes("WCAS")
      })
      .sort((a, b) => {
    
          const nameA = a.name.toUpperCase()
          const nameB = b.name.toUpperCase()
    
          if (nameA.includes("ACA") && !nameB.includes("ACA")) return -1
          if (!nameA.includes("ACA") && nameB.includes("ACA")) return 1

          if (nameA.includes("WCAS") && !nameB.includes("WCAS")) return -1
          if (!nameA.includes("WCAS") && nameB.includes("WCAS")) return 1
    
      })
      .forEach(s => {
        
        const tr = document.createElement("tr")
        tr.innerHTML = `
        <td>${s.sensor_index ?? "-"}</td>
        <td>${s.name}</td>
        <td>${formatNoTZ(s.last_seen)}</td>
        <td>${fmt(s["pm2.5_atm_a"])}</td>
        <td>${fmt(s["pm2.5_atm_b"])}</td>
        <td>${s.pm_method ?? "-"}</td>
        <td>${fmt(s.pm_corr)}</td>

        `
        tbody.appendChild(tr)
    })
}

loadSensors()
setInterval(loadSensors, 60 * 60 * 1000)
