# Python Database Access Setup Guide

This guide shows how to set up Python to access the D2D-CURE MySQL databases.

## Quick Setup Steps

### 1. Install Required Packages
```bash
pip install mysql-connector-python python-dotenv SQLAlchemy pandas matplotlib
```

### 2. Create Environment File
Create a `.env` file in your project directory with the database connection strings:

```bash
# .env file (same credentials as MySQL Workbench)
DATABASE_URL_USERS=mysql://username:password@host:port/database_users
DATABASE_URL_PROTEINS=mysql://username:password@host:port/database_proteins  
DATABASE_URL_PUBLICATIONS=mysql://username:password@host:port/database_publications
DATABASE_URL_ENZYMES=mysql://username:password@host:port/database_enzymes
```

**Note:** Replace `username`, `password`, `host`, `port`, and database names with the actual values Hussain provided for MySQL Workbench.

### 3. Fix Collation Issue
The error you're seeing (`utf8mb4_0900_ai_ci`) happens because your local MySQL client is older than the server. The solution is to specify a compatible collation in the connection:

```python
# Use this collation instead of the default
collation='utf8mb4_unicode_ci'
```

This is already handled in the example code.




## Integration with Website

To call Python scripts from your Next.js application (like your existing `graph-gen.py`):

### Option 1: Flask API (Current Pattern)
You already have this working with `graph-gen.py`. For database scripts:

```python
# database_api.py
from flask import Flask, request, jsonify
from database_connection import D2DCureDatabase

app = Flask(__name__)

@app.route('/api/python/analyze_data', methods=['POST'])
def analyze_data():
    db = D2DCureDatabase()
    
    # Get parameters from request
    variant_id = request.json.get('variant_id')
    
    # Run analysis
    query = f"SELECT * FROM CharacterizationData WHERE id = {variant_id}"
    result = db.query_to_dataframe(query, 'proteins')
    
    # Return results
    return jsonify(result.to_dict('records'))
```

