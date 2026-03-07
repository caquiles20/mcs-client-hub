
import json
import re

def parse_val(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return str(val).lower()
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"

# Load the data from step 1046
with open('/Users/carlosespinoza/.gemini/antigravity/brain/a7d9c57b-1344-4f2e-a9ff-3ffa1d5fa0d1/.system_generated/steps/1046/output.txt', 'r') as f:
    content = f.read()
    try:
        data = json.loads(content)
        result_str = data.get('result', '')
        match = re.search(r'\[\s*{.*?}\s*\]', result_str, re.DOTALL)
        if match:
            json_arr_str = match.group(0)
            items = json.loads(json_arr_str)
            
            rows = []
            for item in items:
                # Order: id, phase_id, name, responsible, status, expected_date, is_delayed, activity_order, created_at, updated_at
                row = f"({parse_val(item.get('id'))}, {parse_val(item.get('phase_id'))}, {parse_val(item.get('name'))}, " \
                      f"{parse_val(item.get('responsible'))}, {parse_val(item.get('status'))}, {parse_val(item.get('expected_date'))}, " \
                      f"{parse_val(item.get('is_delayed'))}, {parse_val(item.get('activity_order'))}, {parse_val(item.get('created_at'))}, " \
                      f"{parse_val(item.get('updated_at'))})"
                rows.append(row)
            
            sql = "INSERT INTO projects.activities (id, phase_id, name, responsible, status, expected_date, is_delayed, activity_order, created_at, updated_at) VALUES\n"
            sql += ",\n".join(rows)
            sql += "\nON CONFLICT (id) DO NOTHING;"
            
            with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/final_missing_activities.sql', 'w') as out:
                out.write(sql)
            print(f"Generated final_missing_activities.sql with {len(rows)} records")
        else:
            print("No data found in log output.")
    except Exception as e:
        print(f"Error: {e}")
