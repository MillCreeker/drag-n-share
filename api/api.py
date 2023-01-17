from flask import *
import mariadb.connections
from config import Config
import json
import time
from datetime import datetime, timedelta
import uuid
import string
import random

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
    
    
    def __gen_access_key(real_key=None):
        key = random.randint(100000, 999999)
        
        if (real_key != None):
            is_same_key = True
            
            while (is_same_key):
                if (key == real_key):
                    key = random.randint(100000, 999999)
                else:
                    is_same_key = False
        
        return key
    
    def __gen_bearer_token():
        token = '%' + ''.join(
                random.choice(
                    string.ascii_uppercase +
                    string.ascii_lowercase +
                    string.digits
                )for _ in range(253)
            )
        token += '%'
        
        return token
    
    
    def run(self):
        app = Flask(__name__)

        @app.route('/ping', methods=['GET'])
        def ping():
            timestamp = time.time()
            return str(timestamp)
        
        
        @app.route('/upload_data', methods=['POST'])
        def upload_data():
            try:
                body = json.loads(request.get_data())
                
                # error handling #
                status = 400
                
                if ('name' not in body):
                    return 'name missing', status
                
                if (body['name'] == ''):
                    return 'name empty', status
                
                if (_does_name_already_exist(body['name']) == True):
                    return 'name already exists', 409
                
                if ('data' not in body):
                    return 'data missing', status
                
                if (body['data'] == ''):
                    return 'data empty', status
                
                if ('isTextOnly' not in body):
                    return 'isTextOnly not specified', status
                
                if (body['isTextOnly'] != True and
                    body['isTextOnly'] != False):
                    return 'isTextOnly must be true or false', status
                
                if (body['isTextOnly'] == False):
                    files = json.loads(body['data'])

                    if (len(files) > 4):
                        return 'Maximum number of files (4) exceeded', 413
                
                if (len(body['data']) > 1073741824):
                    return 'Maximum data size (1GB) exceeded', 413
                ##################
                
                # insert into database #
                id = str(uuid.uuid4())
                token = API.__gen_bearer_token()
                access_key = API.__gen_access_key()
                
                try:                
                    self.db_cursor.execute(
                            'INSERT INTO `data` (`id`, `name`, `data`, `isTextOnly`) VALUES (?,?,?,?)',
                        (id, body['name'], body['data'], body['isTextOnly']))
                    
                    self.db_cursor.execute(
                            'INSERT INTO `access` (`data-id`, `token`, `access-key`) VALUES (?,?,?)',
                        (id, token, access_key))
                except:
                    return 'There was an unexpected error', 500
                ########################
            
                return token
            except:
                return 'There was an unexpected error', 500
        
        @app.route('/get_access_key_and_name', methods=['GET'])
        def get_access_key_and_name():
            try:
                bearer_token = request.headers.get('Access')
                if (bearer_token == ''):
                    return 'No bearer token received', 400
                
                # checks #
                if (_is_authorized(bearer_token) == False):
                    return 'No data found for bearer token', 401
                if (_is_expired(bearer_token) == True):
                    _delete_data(bearer_token)
                    return 'Data has expired', 410
                if (_is_locked(bearer_token) == True):
                    return 'Data is currently locked, please refresh acceess key', 409
                ##########
                
                data = _get_data(bearer_token)
                
                body = {
                    'accessKey': data['key'],
                    'name': data['name']
                }
                return json.dumps(body)
            except:
                return 'There was an unexpected error', 500
        
        @app.route('/refresh', methods=['POST'])
        def refresh():
            try:
                bearer_token = request.headers.get('Access')
                if (bearer_token == ''):
                    return 'No bearer token received', 400
                
                # checks #
                if (_is_authorized(bearer_token) == False):
                    return 'No data found for bearer token', 401
                if (_is_expired(bearer_token) == True):
                    _delete_data(bearer_token)
                    return 'Data has expired', 410
                if (_is_locked(bearer_token) == True):
                    _remove_lock_entry(bearer_token)
                ##########
                
                data = _get_data(bearer_token)
                new_name = request.get_data().decode(encoding='utf8')
                
                if (new_name != '' and
                    new_name != None and
                    new_name != data["name"]):
                    
                    if (_does_name_already_exist(new_name)):
                        return 'Name already exists', 409
                    
                    self.db_cursor.execute(
                        'UPDATE `data` SET `name`=? WHERE id=?',
                        (new_name, data['id'])
                    )
                
                new_access_key = API.__gen_access_key(data['key'])
                self.db_cursor.execute(
                    'UPDATE `access` SET `access-key`=? WHERE `token`=?',
                    (new_access_key, bearer_token)
                )
                
                updated_data = _get_data(bearer_token)
                
                body = {
                    'name': updated_data['name'],
                    'accessKey': updated_data['key']
                }
                return json.dumps(body)
            except:
                return 'There was an unexpected error', 500
        
        @app.route('/delete', methods=['DELETE'])
        def delete():
            try:
                bearer_token = request.headers.get('Access')
                if (bearer_token == ''):
                    return 'No bearer token received', 400
                
                # checks #
                if (_is_authorized(bearer_token) == False):
                    return 'No data found for bearer token', 401
                if (_is_expired(bearer_token) == True):
                    _delete_data(bearer_token)
                    return 'Data has expired', 410
                ##########
                
                _delete_data(bearer_token)
                
                return 'Successfully deleted'
            except:
                return 'There was an unexpected error', 500
        
        @app.route('/search_name', methods=['POST'])
        def search_name():
            try:
                name = request.get_data()
                
                if (name == '' or
                    name == None):
                    return 'No name received', 400
                
                if (_is_name_expired(name) == True):
                    _delete_by_name(name)
                    return 'Name has expired', 410
                
                if (_is_name_locked(name) == True):
                    return 'Data is currently locked. Refresh on other device.', 403
                
                if (_does_name_already_exist(name) == False):
                    return 'Name not found', 404
                
                return 'Name found'
            except:
                return 'There was an unexpected error', 500
        
        @app.route('/validate_key', methods=['POST'])
        def validate_key():
            return "hmm"
        
        
        # H E L P E R S #
        def _is_authorized(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT * FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                data_tuple = self.db_cursor.fetchone()
                
                is_authorized = data_tuple != None
                return is_authorized
            except:
                return False
        
        def _is_expired(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `timestamp` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                data_tuple = self.db_cursor.fetchone()[0]
                
                expire_time = time.mktime(
                    datetime.strptime(
                        str(data_tuple + timedelta(minutes=5)),
                        "%Y-%m-%d %H:%M:%S"
                    ).timetuple()
                )
                
                now = time.time()
                
                is_expired = expire_time < now
                
                return is_expired
            except:
                return True
        
        def _is_locked(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `lock-entries`.`data-id` FROM `lock-entries` JOIN `access` ON `access`.`data-id`=`lock-entries`.`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                data_tuple = self.db_cursor.fetchone()
                
                isLocked = data_tuple != None
                return isLocked
            except:
                return False
        
        def _get_data(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `id`, `name`, `data`, `isTextOnly`, `access-key` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                data_tuple = self.db_cursor.fetchone()
                
                is_text_only = data_tuple[3] == b'\x01' or data_tuple[3] == True
                data = None
                if (is_text_only == True):
                    data = data_tuple[2]
                else:
                    data = json.loads(data_tuple[2])
                
                jsonData = json.loads(json.dumps({
                    'id': data_tuple[0],
                    'name': data_tuple[1],
                    'data': data,
                    'isTextOnly': is_text_only,
                    'key': data_tuple[4]
                }))
                return jsonData
            except:
                return None
        
        def _delete_data(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                id = self.db_cursor.fetchone()[0]
                
                self.db_cursor.execute(
                    'DELETE FROM `lock-entries` WHERE `data-id`=?',
                    (id,)
                )
                
                self.db_cursor.execute(
                    'DELETE FROM `access` WHERE `data-id`=?',
                    (id,)
                )
                
                self.db_cursor.execute(
                    'DELETE FROM `data` WHERE `id`=?',
                    (id,)
                )
            except:
                pass
        
        def _create_lock_entry(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                id = self.db_cursor.fetchone()[0]
                
                self.db_cursor.execute(
                    'INSERT `lock-entries` SET `data-id`=?',
                    (id,)
                )
            except:
                pass
        
        def _remove_lock_entry(bearer_token:str):
            try:
                self.db_cursor.execute(
                    'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=?',
                    (bearer_token,)
                )
                id = self.db_cursor.fetchone()[0]
                
                self.db_cursor.execute(
                    'DELETE FROM `lock-entries` WHERE `data-id`=?',
                    (id,)
                )
            except:
                pass
        
        def _does_name_already_exist(name:str):
            try:
                self.db_cursor.execute(
                    'SELECT `name` FROM `data` WHERE `name`=?',
                    (name,)
                )
                name = self.db_cursor.fetchone()[0]
                
                return True
            except:
                return False
        
        def _is_name_expired(name:str):
            try:           
                self.db_cursor.execute(
                    'SELECT `timestamp` FROM `data` WHERE `name`=?',
                    (name,)
                )
                data_tuple = self.db_cursor.fetchone()[0]
                
                expire_time = time.mktime(
                    datetime.strptime(
                        str(data_tuple + timedelta(minutes=5)),
                        "%Y-%m-%d %H:%M:%S"
                    ).timetuple()
                )
                
                now = time.time()
                
                is_expired = expire_time < now
                
                return is_expired
            except:
                return False
        
        def _delete_by_name(name:str):
            try:
                self.db_cursor.execute(
                    'SELECT `id` FROM `data` WHERE `name`=?',
                    (name,)
                )
                
                id = self.db_cursor.fetchone()[0]
                    
                self.db_cursor.execute(
                    'DELETE FROM `lock-entries` WHERE `data-id`=?',
                    (id,)
                )
                
                self.db_cursor.execute(
                    'DELETE FROM `access` WHERE `data-id`=?',
                    (id,)
                )
                
                self.db_cursor.execute(
                    'DELETE FROM `data` WHERE `id`=?',
                    (id,)
                )
            except:
                pass
        
        def _is_name_locked(name:str):
            try:
                self.db_cursor.execute(
                    'SELECT `lock-entries`.`data-id` FROM `lock-entries` JOIN `data` ON `data-id`=`id` WHERE `name`=?',
                    (name,)
                )
                
                data_tuple = self.db_cursor.fetchone()
                
                isLocked = data_tuple != None
                return isLocked
            except:
                return False

        
        app.run(
            debug=True,
            port=Config.get('API_PORT')
        )