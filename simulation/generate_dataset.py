"""
Generate datasets for AeroTwin AI.
Simulates N healthy missions and N missions per fault type, exporting to CSV.
"""
import argparse
import csv
import os
import random
from dataclasses import asdict

from engine_model import EngineState
from faults import FaultInjector

def simulate_mission(mission_id: str, output_dir: str, fault_type: str = None, fault_onset: int = 1500, fault_duration: int = 1800, severity: float = 0.8):
    """
    Simulates a standard 1-hour UAV mission profile.
    If fault_type is provided, triggers it at `fault_onset` tick.
    """
    engine = EngineState(initial_altitude_m=0.0, initial_ambient_temp_celsius=25.0)
    injector = FaultInjector(engine)
    
    # 1 hour mission = 3600 seconds/ticks
    total_ticks = 3600
    
    # Simple mission profile lookup
    def get_mission_inputs(t):
        if t < 60:
            return {"throttle": 0.0, "alt_rate": 0.0, "is_running": False} # pre-flight
        elif t < 300:
            return {"throttle": 10.0, "alt_rate": 0.0, "is_running": True} # idle/taxi
        elif t < 600:
            return {"throttle": 100.0, "alt_rate": 5.0, "is_running": True} # takeoff & climb
        elif t < 2400:
            return {"throttle": 75.0, "alt_rate": 0.0, "is_running": True} # cruise
        elif t < 3000:
            return {"throttle": 30.0, "alt_rate": -4.16, "is_running": True} # descent
        elif t < 3300:
            return {"throttle": 10.0, "alt_rate": 0.0, "is_running": True} # taxi back
        else:
            return {"throttle": 0.0, "alt_rate": 0.0, "is_running": False} # shutdown
            
    filepath = os.path.join(output_dir, f"mission_{mission_id}.csv")
    
    alt = 0.0
    oat = 25.0
    
    with open(filepath, 'w', newline='') as f:
        writer = None
        
        for t in range(total_ticks):
            # Trigger fault at the correct tick
            if fault_type and t == fault_onset:
                injector.trigger_fault(fault_type, severity, fault_duration)
                
            inputs = get_mission_inputs(t)
            alt = max(0.0, alt + inputs["alt_rate"])
            oat = 25.0 - (alt / 1000.0) * 6.5
            
            telemetry, labels = injector.step(
                throttle_position=inputs["throttle"],
                altitude_m=alt,
                ambient_temp_celsius=oat,
                is_running=inputs["is_running"]
            )
            
            # Format row
            row_dict = asdict(telemetry)
            # Add label info for AI/ML teammate
            row_dict["label_fault_type"] = labels[0].fault_type if labels else "healthy"
            row_dict["label_severity"] = labels[0].severity if labels else 0.0

            # Benchmark-compatibility columns: mission_id groups all rows from
            # the same run; tick is the integer time-step index within that run.
            # These must be prepended so cmapss_benchmark.py can find them via
            # --synthetic-id-col and --synthetic-time-col flags.
            row_dict = {"mission_id": mission_id, "tick": t, **row_dict}

            if writer is None:
                writer = csv.DictWriter(f, fieldnames=row_dict.keys())
                writer.writeheader()

            writer.writerow(row_dict)
            
    return filepath

def _write_combined_csv(filepaths: list[str], outdir: str) -> str:
    """
    Concatenate all per-mission CSVs into a single all_missions.csv.
    The header is taken from the first file; every subsequent file's header
    row is skipped so there are no duplicates in the combined output.
    Per-mission files are left untouched — the ML training pipeline uses them.
    """
    combined_path = os.path.join(outdir, "all_missions.csv")
    with open(combined_path, "w", newline="") as out_f:
        for idx, filepath in enumerate(filepaths):
            with open(filepath, "r", newline="") as in_f:
                for line_no, line in enumerate(in_f):
                    if line_no == 0 and idx > 0:
                        # Skip the header for every file after the first
                        continue
                    out_f.write(line)
    return combined_path


def main():
    parser = argparse.ArgumentParser(description="Generate AeroTwin AI engine telemetry datasets.")
    parser.add_argument("--healthy", type=int, default=5, help="Number of healthy missions to generate.")
    parser.add_argument("--faulty", type=int, default=3, help="Number of missions to generate PER fault type.")
    parser.add_argument("--outdir", type=str, default="dataset", help="Output directory for CSV files.")

    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    # Collect every per-mission filepath so we can build the combined CSV at the end.
    all_filepaths: list[str] = []

    print(f"Generating {args.healthy} healthy missions...")
    for i in range(args.healthy):
        fp = simulate_mission(f"healthy_{i}", args.outdir, fault_type=None)
        all_filepaths.append(fp)

    fault_types = [
        "oil_pressure_drop",
        "cooling_degradation",
        "vibration_growth",
        "misfire",
        "sensor_drift",
        "injector_abnormality",
        "combustion_instability",
        "battery_alternator_fail"
    ]

    for f_type in fault_types:
        print(f"Generating {args.faulty} missions with fault: {f_type}...")
        for i in range(args.faulty):
            # Add randomness to onset and severity so the dataset is varied
            onset = random.randint(1000, 2000)    # Trigger sometime during climb/cruise
            duration = random.randint(600, 1500)  # Develops over 10-25 mins
            severity = round(random.uniform(0.5, 1.0), 2)

            fp = simulate_mission(
                f"fault_{f_type}_{i}", args.outdir,
                fault_type=f_type, fault_onset=onset,
                fault_duration=duration, severity=severity
            )
            all_filepaths.append(fp)

    # Write the combined file expected by cmapss_benchmark.py.
    combined = _write_combined_csv(all_filepaths, args.outdir)
    print(f"Dataset generation complete! Files saved to ./{args.outdir}")
    print(f"Combined benchmark CSV written to: {combined}")


if __name__ == "__main__":
    main()
