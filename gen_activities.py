import json
import re

def generate_activities_sql():
    filepath = '/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/482/output.txt'
    with open(filepath, 'r') as f:
        content = f.read()
    
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    json_str = content[start_idx:end_idx].replace('\\"', '"').replace('\\\\', '\\')
    data = json.loads(json_str)

    sql_template = "INSERT INTO projects.activities (id, phase_id, name, responsible, status, expected_date, is_delayed, activity_order, created_at, updated_at) VALUES\n"
    
    # Large data, chunking into 100 rows per insert
    chunk_size = 100
    all_sqls = []
    
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i+chunk_size]
        rows = []
        for r in chunk:
            name_esc = r['name'].replace("'", "''")
            resp_esc = (r.get('responsible') or '').replace("'", "''")
            
            exp_date = f"'{r['expected_date']}'" if r.get('expected_date') else "NULL"
            order = r.get('activity_order') if r.get('activity_order') is not None else "NULL"
            delayed = str(r['is_delayed']).lower() if r.get('is_delayed') is not None else "false"
            
            row = f"('{r['id']}', '{r['phase_id']}', '{name_esc}', '{resp_esc}', '{r['status']}', {exp_date}, {delayed}, {order}, '{r['created_at']}', '{r['updated_at']}')"
            rows.append(row)
        
        all_sqls.append(sql_template + ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;")
    
    return "\n\n".join(all_sqls)

if __name__ == "__main__":
    sql = generate_activities_sql()
    with open('activities.sql', 'w') as f:
        f.write(sql)
