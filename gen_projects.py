import json
import re

def generate_projects_sql():
    filepath = '/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/493/output.txt'
    with open(filepath, 'r') as f:
        content = f.read()
    
    start_idx = content.find('[')
    end_idx = content.rfind(']') + 1
    if start_idx == -1 or end_idx == 0:
        return f"Error: No JSON array found in {filepath}"
    
    json_str = content[start_idx:end_idx].replace('\\"', '"').replace('\\\\', '\\')
    data = json.loads(json_str)

    sql = "INSERT INTO projects.projects (id, project_number, name, client, implementation_manager, sites, status, global_progress, created_by, created_at, updated_at) VALUES\n"
    rows = []
    user_mapping = {
        'b3a89296-aa22-45ee-95cd-3371ee9e755a': '1addb285-e75a-4f51-acd4-13df2fb4e478' # Carlos Espinoza
    }

    for r in data:
        # Convert JSON list to Postgres Array literal format: {"val1", "val2"}
        sites_list = r.get('sites', [])
        sites_pg = "{" + ",".join(['"' + s.replace('"', '\\"') + '"' for s in sites_list]) + "}"
        
        name_esc = r['name'].replace("'", "''")
        client_esc = r['client'].replace("'", "''")
        manager_esc = r.get('implementation_manager', '').replace("'", "''")
        
        created_by = r['created_by']
        created_by = user_mapping.get(created_by, created_by)
        
        row = f"('{r['id']}', '{r['project_number']}', '{name_esc}', '{client_esc}', '{manager_esc}', '{sites_pg}', '{r['status']}', {r['global_progress']}, '{created_by}', '{r['created_at']}', '{r['updated_at']}')"
        rows.append(row)
    
    sql += ",\n".join(rows) + "\nON CONFLICT (id) DO NOTHING;"
    return sql

if __name__ == "__main__":
    sql = generate_projects_sql()
    with open('projects.sql', 'w') as f:
        f.write(sql)
