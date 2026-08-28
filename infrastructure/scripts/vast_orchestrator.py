#!/usr/bin/env python3
"""Vast.ai batch orchestrator — search, rent, and destroy RTX 3090 instances."""

import argparse
import json
import os
import subprocess
import sys


def run_vast(args: list[str]) -> dict:
    cmd = ["vastai"] + args + ["--raw"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout) if result.stdout.strip() else {}


def search_offers(min_reliability: float, max_dph: float, gpu_name: str) -> list:
    query = (
        f"reliability>{min_reliability} dph<{max_dph} gpu_name={gpu_name} "
        "rentable=true external=false"
    )
    offers = run_vast(["search", "offers", query])
    return offers if isinstance(offers, list) else []


def rent(count: int, min_reliability: float, max_dph: float, gpu_name: str) -> None:
    offers = search_offers(min_reliability, max_dph, gpu_name)
    if not offers:
        print("No matching offers found.")
        return

    rented = 0
    for offer in offers[:count]:
        offer_id = offer.get("id")
        if not offer_id:
            continue
        run_vast(["create", "instance", str(offer_id)])
        print(f"Rented offer {offer_id} ({offer.get('gpu_name')} @ ${offer.get('dph_total')}/hr)")
        rented += 1
    print(f"Total rented: {rented}")


def destroy_all() -> None:
    instances = run_vast(["show", "instances"])
    if not isinstance(instances, list):
        print("No instances.")
        return
    for inst in instances:
        inst_id = inst.get("id")
        if inst_id:
            run_vast(["destroy", "instance", str(inst_id)])
            print(f"Destroyed instance {inst_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Vast.ai batch orchestrator")
    sub = parser.add_subparsers(dest="command", required=True)

    rent_p = sub.add_parser("rent", help="Rent GPU instances")
    rent_p.add_argument("--count", type=int, default=1)
    rent_p.add_argument("--reliability", type=float, default=0.98)
    rent_p.add_argument("--max-dph", type=float, default=0.16)
    rent_p.add_argument("--gpu", default="RTX 3090")

    sub.add_parser("destroy", help="Destroy all instances")
    sub.add_parser("list", help="List matching offers")

    args = parser.parse_args()

    if not os.getenv("VAST_API_KEY"):
        print("Set VAST_API_KEY environment variable", file=sys.stderr)
        sys.exit(1)

    if args.command == "rent":
        rent(args.count, args.reliability, args.max_dph, args.gpu)
    elif args.command == "destroy":
        destroy_all()
    elif args.command == "list":
        offers = search_offers(args.reliability if hasattr(args, "reliability") else 0.98,
                               args.max_dph if hasattr(args, "max_dph") else 0.16,
                               args.gpu if hasattr(args, "gpu") else "RTX 3090")
        for o in offers[:10]:
            print(f"ID={o.get('id')} GPU={o.get('gpu_name')} dph={o.get('dph_total')} rel={o.get('reliability')}")


if __name__ == "__main__":
    main()
