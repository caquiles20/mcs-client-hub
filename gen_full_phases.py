import json
import re

def generate_full_phases_sql():
    path = "/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/786/output.txt"
    with open(path, 'r') as f:
        outer_data = json.load(f)
    
    content = outer_data.get('result', '')
    
    # Extract the JSON array between <untrusted-data-xxx> boundaries
    match = re.search(r'\[.*\]', content, re.DOTALL)
    if not match:
        print("No JSON array found in result field")
        return
    
    data = json.loads(match.group(0))
    
    sql_template = "INSERT INTO projects.phases (id, project_id, phase_name, phase_status, progress, phase_order, created_at, updated_at) VALUES\n"
    rows = []
    
    for r in data:
        # Cast progress to numeric if string, remove any trailing zeros
        progress = r['progress']
        if isinstance(progress, str):
            progress = progress.strip()
        
        row = f"('{r['id']}', '{r['project_id']}', '{r['phase_name']}', '{r['phase_status']}', {progress}, {r['phase_order']}, '{r['created_at']}', '{r['updated_at']}')"
        rows.append(row)
    
    full_sql = sql_template + ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;"
    
    with open("/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/full_phases.sql", "w") as f:
        f.write(full_sql)

if __name__ == "__main__":
    generate_full_phases_sql()
