"""
Quick test to check if everything works
"""

# First, let's test if we can import the module
try:
    from database_connection import D2DCureDatabase, example_basic_query
    print("✅ Successfully imported database connection module")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)

# Test creating the database object
try:
    db = D2DCureDatabase()
    print("✅ Successfully created database object")
    print(f"Available databases: {list(db.parsed_configs.keys())}")
except Exception as e:
    print(f"❌ Error creating database object: {e}")
    exit(1)

# Try to run the basic query
print("\n" + "="*50)
print("Running basic query example...")
print("="*50)

try:
    result = example_basic_query()
    if result is not None:
        print(f"\n✅ Query successful! Got {len(result)} rows")
    else:
        print("\n❌ Query returned None - check your database connection")
except Exception as e:
    print(f"\n❌ Error running query: {e}")
    print("\nThis might be because:")
    print("1. You haven't set up the .env file with database credentials")
    print("2. The database credentials are incorrect")
    print("3. The required Python packages aren't installed")
