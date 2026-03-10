function qcCheck(a, b) {

    if (a === null || b === null) {
        return {avg:null, diff:null, status:"OFFLINE"}
    }

    const avg = (a + b) / 2

    const diff = Math.abs(a - b)

    const pct = (diff / avg) * 100

    let status = "GOOD"

    if (pct > 50) status = "BAD"
    else if (pct > 20) status = "WARNING"

    return {
        avg: avg.toFixed(2),
        diff: pct.toFixed(1),
        status: status
    }
}
