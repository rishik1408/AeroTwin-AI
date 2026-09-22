import pandas as pd
import requests
import time

# URL of your local FastAPI server
API_URL = "http://localhost:8000/api/telemetry"

def stream_dataset(csv_file_path: str, delay_seconds: float = 1.0):
    print(f"Loading dataset from {csv_file_path}...")
    df = pd.read_csv(csv_file_path)
    
    print(f"Starting Virtual Engine Stream. Sending {len(df)} records...")
    
    for index, row in df.iterrows():
        # Convert the row into a JSON dictionary
        payload = row.to_dict()
        
        try:
            # Send POST request to FastAPI
            response = requests.post(API_URL, json=payload)
            response.raise_for_status() # Raise exception for bad status codes
            
            print(f"[SUCCESS] Sent record {index + 1}: RPM={payload['rpm']} -> {response.json().get('message')}")
        
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Failed to send record {index + 1}: {e}")
            
        # Wait before sending the next record to simulate real-time data
        time.sleep(delay_seconds)
        
    print("Stream complete.")

if __name__ == "__main__":
    # Point this to your actual dataset file, adjust delay_seconds to change streaming speed
    stream_dataset("sample_dataset.csv", delay_seconds=1.0)
