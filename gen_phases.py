import json
import re

def generate_phases_sql():
    filepath = '/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/524/output.txt'
    with open(filepath, 'r') as f:
        content = f.read()
    
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    json_str = content[start_idx:end_idx].replace('\\"', '"').replace('\\\\', '\\')
    data = json.loads(json_str)

    sql = "INSERT INTO projects.phases (id, project_id, phase_name, phase_status, progress, phase_order, created_at, updated_at) VALUES\n"
    rows = []
    for r in data:
        row = f"('{r['id']}', '{r['project_id']}', '{r['phase_name']}', '{r['phase_status']}', {r['progress']}, {r['phase_order']}, '{r['created_at']}', '{r['updated_at']}')"
        rows.append(row)
    
    sql += ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;"
    return sql

if __name__ == "__main__":
    sql = generate_phases_sql()
    with open('phases.sql', 'w') as f:
        f.write(sql)
