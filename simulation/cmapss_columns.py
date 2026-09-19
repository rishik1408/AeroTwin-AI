"""
cmapss_columns.py

Column definitions for NASA C-MAPSS train/test files, derived from the
actual uploaded dataset (26 columns confirmed) and Saxena et al. 2008,
Table 2. Import this wherever you load C-MAPSS data so column names stay
consistent across engine_model comparison, benchmarking, and RUL training.
"""

# Full column list in file order
ALL_COLUMNS = [
    "unit", "cycle", "op1", "op2", "op3",
    "T2", "T24", "T30", "T50", "P2", "P15", "P30", "Nf", "Nc", "epr",
    "Ps30", "phi", "NRf", "NRc", "BPR", "farB", "htBleed",
    "Nf_dmd", "PCNfR_dmd", "W31", "W32",
]

# Maps the generic "sensor_N" alias (used by cmapss_benchmark.py) to the
# real named column, so both naming schemes can be used interchangeably.
SENSOR_ALIAS_TO_NAME = {
    "sensor_1": "T2", "sensor_2": "T24", "sensor_3": "T30", "sensor_4": "T50",
    "sensor_5": "P2", "sensor_6": "P15", "sensor_7": "P30", "sensor_8": "Nf",
    "sensor_9": "Nc", "sensor_10": "epr", "sensor_11": "Ps30", "sensor_12": "phi",
    "sensor_13": "NRf", "sensor_14": "NRc", "sensor_15": "BPR", "sensor_16": "farB",
    "sensor_17": "htBleed", "sensor_18": "Nf_dmd", "sensor_19": "PCNfR_dmd",
    "sensor_20": "W31", "sensor_21": "W32",
}
NAME_TO_SENSOR_ALIAS = {v: k for k, v in SENSOR_ALIAS_TO_NAME.items()}

# Columns confirmed CONSTANT (zero variance) in FD001/FD003 — single
# operating condition means these carry no degradation signal. Drop them
# before training or benchmarking on FD001/FD003.
CONSTANT_COLUMNS_SINGLE_CONDITION = [
    "op3", "T2", "P2", "epr", "farB", "Nf_dmd", "PCNfR_dmd",
]

# Recommended informative columns for FD001/FD003, ranked by variance
# (highest first) as computed from the actual training files.
INFORMATIVE_COLUMNS_FD001_FD003 = [
    "Nc", "NRc", "T50", "T30", "htBleed", "P30", "phi",
    "T24", "Ps30", "W31", "W32", "NRf", "Nf", "BPR",
]

# For FD002/FD004 (6 operating conditions): no column is literally constant,
# but raw values are dominated by flight condition, not degradation. Cluster
# rows by (op1, op2, op3) and z-score each sensor within its cluster before
# using ANY of the sensor columns for training or benchmarking.
MULTI_CONDITION_SETTING_COLUMNS = ["op1", "op2", "op3"]

# Standard piecewise-linear RUL cap used across published C-MAPSS work.
RUL_CAP = 125


def load_cmapss_file(path):
    """Load a raw C-MAPSS train/test .txt file with proper column names."""
    import pandas as pd
    df = pd.read_csv(path, sep=r"\s+", header=None)
    df = df.iloc[:, : len(ALL_COLUMNS)]
    df.columns = ALL_COLUMNS
    return df


def drop_constant_columns(df):
    """Drop the known-constant columns (FD001/FD003 use case)."""
    return df.drop(columns=[c for c in CONSTANT_COLUMNS_SINGLE_CONDITION if c in df.columns])
