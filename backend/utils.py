from datetime import datetime

def parse_time(t):
    return datetime.strptime(t, "%I:%M:%S %p")

def calculate_breaks(timestamps):
    breaks = []
    total_seconds = 0

    for i in range(1, len(timestamps) - 1, 2):
        out_time = timestamps[i]
        in_time = timestamps[i + 1]

        if out_time == "MISSING" or in_time == "MISSING":
            continue

        out_dt = parse_time(out_time)
        in_dt = parse_time(in_time)

        diff = (in_dt - out_dt).total_seconds()

        breaks.append({
            "from": out_time,
            "to": in_time,
            "duration_seconds": diff
        })

        total_seconds += diff

    return {
        "breaks": breaks,
        "total_break_seconds": total_seconds,
        "total_break_minutes": round(total_seconds / 60, 2)
    }