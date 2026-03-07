
import json
import re

# Load missing IDs
with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/missing_ids.txt', 'r') as f:
    missing_ids = [line.strip() for line in f if line.strip()]

print(f"Total missing IDs to process: {len(missing_ids)}")

# Prepare the final SQL
header = "INSERT INTO projects.activities (id, phase_id, name, responsible, status, expected_date, is_delayed, activity_order, created_at, updated_at) VALUES\n"

# I'll build a query to get these from a large list to avoid multiple calls
id_list_str = ", ".join([f"'{mid}'" for mid in missing_ids])
query = f"SELECT * FROM activities WHERE id IN ({id_list_str});"

with open('/Users/carlosespinoza/Developer/MCS Service Hub/mcs-client-hub/get_missing_records.sql', 'w') as f:
    f.write(query)
