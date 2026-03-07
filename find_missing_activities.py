
import json
import re

# Load existing IDs from the output file
with open('/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/901/output.txt', 'r') as f:
    content = f.read()
    
    # The file itself is a JSON object
    try:
        data = json.loads(content)
        result_str = data.get('result', '')
        
        # Now find the JSON array inside result_str
        # It's usually between <untrusted-data-...> and </untrusted-data-...>
        match = re.search(r'\[\s*{.*?}\s*\]', result_str, re.DOTALL)
        if match:
            json_arr_str = match.group(0)
            items = json.loads(json_arr_str)
            existing_ids = {row['id'] for row in items if 'id' in row}
        else:
            existing_ids = set()
    except Exception as e:
        print(f"Error parsing: {e}")
        existing_ids = set()

print(f"Loaded {len(existing_ids)} existing IDs")

# Read activities.sql and find missing ones
missing_sql = []
header = "INSERT INTO projects.activities (id, phase_id, name, responsible, status, expected_date, is_delayed, activity_order, created_at, updated_at) VALUES\n"

with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/activities.sql', 'r') as f:
    for line in f:
        if line.strip().startswith('('):
            # Extract ID from line like ('id', 'phase_id', ...)
            parts = line.strip().split(',')
            if len(parts) > 0:
                id_val = parts[0].strip().strip("'").strip('(')
                if id_val not in existing_ids:
                    missing_sql.append(line.strip())

# Split missing into batches of 50
if missing_sql:
    for i in range(0, len(missing_sql), 50):
        batch = missing_sql[i:i+50]
        # Clean up the trailing comma on the last item of the batch and add semicolon
        sql = header + ",\n".join(batch)
        # Ensure the last record ends with a semicolon and not a comma
        if sql.endswith(','):
            sql = sql[:-1] + ";"
        else:
            sql = sql.replace("),", ");").replace(")", ");") # Fallback
            
        # Write batch to a temp file
        batch_filename = f'/tmp/missing_activities_batch_{i//50}.sql'
        with open(batch_filename, 'w') as bf:
            # Re-format properly: join with commas, end with ON CONFLICT
            formatted_batch = ",\n".join([item.rstrip(',') for item in batch])
            bf.write(header + formatted_batch + "\nON CONFLICT (id) DO NOTHING;")
        print(f"Created {batch_filename} with {len(batch)} records")
else:
    print("No missing activities found.")
