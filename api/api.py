from flask import *
import mariadb.connections
from config import Config
import json
import time
import uuid

class API:
    def __init__(self):
        self.db_connection = mariadb.connect(
        host=Config.get('DB_HOST'),
        database=Config.get('DB_DATABASE'),
        user=Config.get('DB_USER'),
        password=Config.get('DB_PW')
        )
        self.db_cursor = self.db_connection.cursor()
    
    def __del__(self):
        self.db_connection.close()
    
    
    def run(self):
        app = Flask(__name__)

        @app.route('/', methods=['GET'])
        def home_page():
            data_set = {'Page': 'Home', 'Message': 'Success', 'Timestamp': time.time()}
            json_dump = json.dumps(data_set)
            
            return json_dump

        @app.route('/user/', methods=['GET'])
        def request_page():
            user_query = str(request.args.get('user')) # /user/?user=USER_NAME
            
            data_set = {'Page': 'Request', 'Message': f'Success: {user_query}', 'Timestamp': time.time()}
            json_dump = json.dumps(data_set)
            
            return json_dump

        # API-Calls #
        # upload file/text
        #   returns creation-token + access-key
        # change name
        #   deletes lock-entry
        # request access (ID + name)
        #   gets correct + 2 random access-keys
        #   ID + name don't exist -> error message
        #   locked data -> error message ('data locked')
        # refresh key
        #   correct creation-token -> gets correct access-key
        #   lock-entry -> gets new correct access-key; lock-entry is deleted
        # get data
        #   correct access-key -> file is transfered
        #   no/wrong access-key -> lock-entry is created
        # delete data
        #   correct creation-token -> all data with ID deleted
        #     (happens after 5min anyway)
        
        @app.route('/upload_file', methods=['POST'])
        def upload_file():
            body = (request.get_json())
            
            id = str(uuid.uuid4())
            print(id)
            timestamp = time.time()
            
            self.db_cursor.execute(
                    'INSERT INTO "tmp-data" (id, name) VALUES (?, ?)',
                (id, str(body['name'])))
            
            data_set = {'Page': 'Request', 'Message': f'Success: {body}', 'Timestamp': time.time()}
            json_dump = json.dumps(data_set)
            
            return json_dump

        # DB Tables #
        # data
        #   ID, name, data, isTextOnly, timestamp
        # access
        #   data-ID, creation-token, access-key
        # lock-entries
        #   data-ID
        
        app.run(
            debug=True,
            port=Config.get('API_PORT')
        )