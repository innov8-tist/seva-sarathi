from dotenv import load_dotenv
import os
import psycopg2
import json
load_dotenv()
CONN_URL=os.getenv("CONN_DB_URL")
user_id="'212ae621-7cdd-4fe1-9216-6bebd6f9512c'"
def DBDATAS(user_id:str):
    try:
        conn = psycopg2.connect(CONN_URL)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * from users where id='{user_id}';")
        datas=cursor.fetchone()
        my_dict={}
        my_dict['name']=datas[1]
        my_dict['auth_credentails']=datas[8]
        cursor.close()
        conn.close()
        return my_dict
    except Exception as e:
        print("Error:", e)
        

def DBDATAS2(refereshtoken_json: dict, user_id: str):
    try:
        conn = psycopg2.connect(CONN_URL)
        cursor = conn.cursor()

        # Convert Python dict to JSON string
        json_data = json.dumps(refereshtoken_json)

        # Save JSON string to PostgreSQL JSON column
        cursor.execute(
            "UPDATE users SET refresh_token = %s WHERE id = %s;",
            (json_data, user_id)
        )

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ JSON token saved successfully.")
    except Exception as e:
        print("❌ DB Error:", e)
