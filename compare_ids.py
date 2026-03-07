
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

dest_ids = extract_ids_from_file('/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/1113/output.txt')
source_ids = extract_ids_from_file('/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/1012/output.txt')

missing_ids = source_ids - dest_ids
print(f"Total Source IDs: {len(source_ids)}")
print(f"Total Dest IDs: {len(dest_ids)}")
print(f"Missing IDs: {len(missing_ids)}")

# Write missing IDs to a file
with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/missing_ids.txt', 'w') as f:
    for mid in missing_ids:
        f.write(mid + "\n")
