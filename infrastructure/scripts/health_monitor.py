#!/usr/bin/env python3
"""GPU health monitor with Telegram alerts and auto-restart."""

import os
import subprocess
import time
from datetime import datetime, timezone

try:
    import pynvml
except ImportError:
    raise SystemExit("Install: pip install pynvml")

try:
    import requests
except ImportError:
    raise SystemExit("Install: pip install requests")

INTERVAL_SEC = int(os.getenv("HEALTH_INTERVAL", "60"))
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
CONTAINER_NAME = os.getenv("CONTAINER_NAME", "agentflow-worker")
VRAM_THRESHOLD = float(os.getenv("VRAM_THRESHOLD", "95"))
TEMP_THRESHOLD = float(os.getenv("TEMP_THRESHOLD", "85"))


def send_telegram(message: str) -> None:
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message}, timeout=10)


def container_running(name: str) -> bool:
    result = subprocess.run(
        ["docker", "inspect", "-f", "{{.State.Running}}", name],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0 and result.stdout.strip() == "true"


def restart_container(name: str) -> None:
    subprocess.run(["docker", "restart", name], check=False)
    send_telegram(f"🔄 [{name}] container restarted at {datetime.now(timezone.utc).isoformat()}")


def check_gpu() -> dict:
    pynvml.nvmlInit()
    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
    mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
    temp = pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
    pynvml.nvmlShutdown()
    vram_pct = (mem.used / mem.total) * 100
    return {"vram_pct": vram_pct, "gpu_util": util.gpu, "temp": temp}


def main() -> None:
    send_telegram("✅ AgentFlow health monitor started")
    was_down = False

    while True:
        try:
            if not container_running(CONTAINER_NAME):
                if not was_down:
                    send_telegram(f"🚨 [{CONTAINER_NAME}] is down — restarting")
                    was_down = True
                restart_container(CONTAINER_NAME)
            else:
                if was_down:
                    send_telegram(f"✅ [{CONTAINER_NAME}] recovered")
                    was_down = False

            metrics = check_gpu()
            if metrics["vram_pct"] > VRAM_THRESHOLD:
                send_telegram(f"⚠️ VRAM {metrics['vram_pct']:.1f}%")
            if metrics["temp"] > TEMP_THRESHOLD:
                send_telegram(f"⚠️ GPU temp {metrics['temp']}°C")

        except Exception as exc:
            send_telegram(f"❌ Monitor error: {exc}")

        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
