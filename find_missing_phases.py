
import json
import re

def extract_ids_from_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        try:
            data = json.loads(content)
            result_str = data.get('result', '')
            match = re.search(r'\[\s*{.*?}\s*\]', result_str, re.DOTALL)
            if match:
                json_arr_str = match.group(0)
                items = json.loads(json_arr_str)
                return {row['id'] for row in items if 'id' in row}
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
    return set()

# Get IDs in destination
dest_phase_ids = extract_ids_from_file('/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/1076/output.txt')

# Extract phase_ids from the SQL file
phase_ids_in_sql = set()
with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/final_missing_activities.sql', 'r') as f:
    content = f.read()
    # Looking for the second value in each tuple (id, phase_id, ...)
    matches = re.findall(r"\('[^']+',\s*'([^']+)'", content)
    for m in matches:
        phase_ids_in_sql.add(m)

missing_phases = phase_ids_in_sql - dest_phase_ids
print(f"Missing Phase IDs: {len(missing_phases)}")
for pid in missing_phases:
    print(pid)

with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/missing_phases.txt', 'w') as f:
    for pid in missing_phases:
        f.write(pid + "\n")
