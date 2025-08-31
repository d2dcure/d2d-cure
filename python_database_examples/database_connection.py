"""
Database connection examples for D2D-CURE project
This shows how to connect to the MySQL databases from Python scripts
"""

import os
import mysql.connector
from mysql.connector import Error
import pandas as pd
from dotenv import load_dotenv

# Load environment variables (from .env file or system environment)
load_dotenv()

class D2DCureDatabase:
    """
    A class to handle connections to the D2D-CURE MySQL databases
    """
    
    def __init__(self):
        # Database connection strings from environment variables
        self.db_configs = {
            'users': os.getenv('DATABASE_URL_USERS'),
            'proteins': os.getenv('DATABASE_URL_PROTEINS'),
            'publications': os.getenv('DATABASE_URL_PUBLICATIONS'),
            'enzymes': os.getenv('DATABASE_URL_ENZYMES')
        }
        
        # Parse connection strings to individual components
        self.parsed_configs = {}
        for db_name, url in self.db_configs.items():
            if url:
                self.parsed_configs[db_name] = self._parse_database_url(url)
    
    def _parse_database_url(self, database_url):
        """
        Parse a MySQL URL like: mysql://user:password@host:port/database?params
        """
        # Remove mysql:// prefix
        url = database_url.replace('mysql://', '')
        
        # Split user:password@host:port/database?params
        auth_and_host, database_and_params = url.rsplit('/', 1)
        user_pass, host_port = auth_and_host.split('@')
        
        # Handle query parameters (e.g., ?connection_limit=5)
        if '?' in database_and_params:
            database, params = database_and_params.split('?', 1)
            print(f"🔍 Found URL parameters: {params} (ignoring for direct connection)")
        else:
            database = database_and_params
        
        if ':' in user_pass:
            user, password = user_pass.split(':', 1)
        else:
            user = user_pass
            password = ''
        
        if ':' in host_port:
            host, port = host_port.split(':')
            port = int(port)
        else:
            host = host_port
            port = 3306
        
        return {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'database': database
        }
    
    def get_connection(self, db_name='proteins'):
        """
        Get a direct MySQL connection
        """
        if db_name not in self.parsed_configs:
            raise ValueError(f"Database '{db_name}' not configured")
        
        config = self.parsed_configs[db_name]
        
        try:
            connection = mysql.connector.connect(
                host=config['host'],
                port=config['port'],
                user=config['user'],
                password=config['password'],
                database=config['database'],
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'  # Use compatible collation
            )
            
            if connection.is_connected():
                print(f"✅ Connected to {db_name} database")
                return connection
                
        except Error as e:
            print(f"❌ Error connecting to {db_name} database: {e}")
            return None
    

    def query_to_dataframe(self, query, db_name='proteins'):
        """
        Execute a SQL query and return results as a pandas DataFrame
        """
        connection = self.get_connection(db_name)
        if connection is None:
            return None
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Convert to DataFrame
            df = pd.DataFrame(results)
            print(f"✅ Query executed successfully, returned {len(df)} rows")
            return df
            
        except Exception as e:
            print(f"❌ Error executing query: {e}")
            return None
        finally:
            cursor.close()
            connection.close()

# Example usage functions
def example_basic_query():
    """
    Example: Basic query to get characterization data
    """
    db = D2DCureDatabase()
    
    query = """
    SELECT id, resid, resnum, resmut, yield_avg, KM_avg, kcat_avg, 
           institution, creator, curated
    FROM CharacterizationData 
    WHERE curated = 1 
    ORDER BY resnum 
    LIMIT 10
    """
    
    df = db.query_to_dataframe(query, 'proteins')
    if df is not None:
        print("Sample characterization data:")
        print(df)
    
    return df

def example_data_modification():
    """
    Example: How to safely modify data (with transaction)
    """
    db = D2DCureDatabase()
    connection = db.get_connection('proteins')
    
    if connection is None:
        return
    
    try:
        cursor = connection.cursor()
        
        # Start transaction
        connection.start_transaction()
        
        # Example: Update a comment for a specific entry
        update_query = """
        UPDATE CharacterizationData 
        SET comments = CONCAT(COALESCE(comments, ''), ' [Updated via Python script]')
        WHERE id = %s
        """
        
        # IMPORTANT: Only do this if you want to actually modify data!
        # test_id = 1  # WT entry
        # cursor.execute(update_query, (test_id,))
        
        print("🚨 WARNING: Data modification code is commented out for safety!")
        print("Uncomment and modify the code above to actually change data.")
        
        # Rollback instead of commit for this example
        connection.rollback()
        print("✅ Transaction rolled back (no changes made)")
        
    except Error as e:
        print(f"❌ Error during data modification: {e}")
        connection.rollback()
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    print("🧬 D2D-CURE Database Connection Examples")
    print("=" * 50)
    
    print("\n1. Basic Query Example:")
    example_basic_query()
    
    print("\n2. Data Modification Example:")
    example_data_modification()

