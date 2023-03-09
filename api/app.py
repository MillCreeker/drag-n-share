from flask import *
from flask_cors import CORS
import pymysql.cursors
from config import Config
import json
import time
from datetime import datetime, timedelta
import uuid
import string
import random

class API:
    def __init__(self):        
        self.db_connection = pymysql.connect(
            host=Config.get('DB_HOST'),
            database=Config.get('DB_DATABASE'),
            user=Config.get('DB_USER'),
            password=Config.get('DB_PW')
        )
        
        self.db_cursor = self.db_connection.cursor()
    
    def __del__(self):
        self.db_connection.close()
    
    
    def _gen_access_key(self, real_key=None):
        key = random.randint(100000, 999999)
        
        if (real_key != None):
            is_same_key = True
            
            while (is_same_key):
                if (key == real_key):
                    key = random.randint(100000, 999999)
                else:
                    is_same_key = False
        
        return key
    
    def _gen_bearer_token(self):
        token = '%' + ''.join(
                random.choice(
                    string.ascii_uppercase +
                    string.ascii_lowercase +
                    string.digits
                )for _ in range(253)
            )
        token += '%'
        
        return token
    
    # D B   H E L P E R S #
    def _is_authorized(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT * FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=%s',
                (bearer_token,)
            )
            data_tuple = self.db_cursor.fetchone()
            
            is_authorized = data_tuple != None
            return is_authorized
        except:
            return False
    
    def _is_expired(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT `timestamp` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=%s',
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
    
    def _is_locked(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT `lock-entries`.`data-id` FROM `lock-entries` JOIN `access` ON `access`.`data-id`=`lock-entries`.`data-id` WHERE `token`=%s',
                (bearer_token,)
            )
            data_tuple = self.db_cursor.fetchone()
            
            isLocked = data_tuple != None
            return isLocked
        except:
            return False
    
    def _get_data(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT `id`, `name`, `data`, `isTextOnly`, `access-key` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=%s',
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
    
    def _delete_data(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=%s',
                (bearer_token,)
            )
            id = self.db_cursor.fetchone()[0]
            
            self.db_cursor.execute(
                'DELETE FROM `lock-entries` WHERE `data-id`=%s',
                (id,)
            )
            
            self.db_cursor.execute(
                'DELETE FROM `access` WHERE `data-id`=%s',
                (id,)
            )
            
            self.db_cursor.execute(
                'DELETE FROM `data` WHERE `id`=%s',
                (id,)
            )
        except:
            pass
    
    def _remove_lock_entry(self, bearer_token:str):
        try:
            self.db_cursor.execute(
                'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `token`=%s',
                (bearer_token,)
            )
            id = self.db_cursor.fetchone()[0]
            
            self.db_cursor.execute(
                'DELETE FROM `lock-entries` WHERE `data-id`=%s',
                (id,)
            )
        except:
            pass
    
    def _does_name_exist(self, name:str):
        try:
            self.db_cursor.execute(
                'SELECT `name` FROM `data` WHERE `name`=%s',
                (name,)
            )
            name = self.db_cursor.fetchone()[0]
            
            return True
        except:
            return False
    
    def _is_name_expired(self, name:str):
        try:         
            self.db_cursor.execute(
                'SELECT `timestamp` FROM `data` WHERE `name`=%s',
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
    
    def _delete_by_name(self, name:str):
        try:
            self.db_cursor.execute(
                'SELECT `id` FROM `data` WHERE `name`=%s',
                (name,)
            )
            
            id = self.db_cursor.fetchone()[0]
                
            self.db_cursor.execute(
                'DELETE FROM `lock-entries` WHERE `data-id`=%s',
                (id,)
            )
            
            self.db_cursor.execute(
                'DELETE FROM `access` WHERE `data-id`=%s',
                (id,)
            )
            
            self.db_cursor.execute(
                'DELETE FROM `data` WHERE `id`=%s',
                (id,)
            )
        except:
            pass
    
    def _is_name_locked(self, name:str):
        try:
            self.db_cursor.execute(
                'SELECT `lock-entries`.`data-id` FROM `lock-entries` JOIN `data` ON `data-id`=`id` WHERE `name`=%s',
                (name,)
            )
            
            data_tuple = self.db_cursor.fetchone()
            
            isLocked = data_tuple != None
            return isLocked
        except:
            return False
    
    def _create_lock_entry(self, name:str):
        try:
            self.db_cursor.execute(
                'SELECT `id` FROM `data` WHERE `name`=%s',
                (name,)
            )
            id = self.db_cursor.fetchone()[0]
            
            self.db_cursor.execute(
                'INSERT `lock-entries` SET `data-id`=%s',
                (id,)
            )
        except:
            pass
    
api = API()
    
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secret'

@app.route(Config.get('API_PATH'), methods=['GET'])
def default():
    return 'You \'bout to witness API in its most purest Most rawest form, flow almost flawless'

@app.route(Config.get('API_PATH')+'/ping', methods=['GET'])
def ping():
    timestamp = time.time()
    return str(timestamp)


@app.route(Config.get('API_PATH')+'/upload_data', methods=['POST'])
def upload_data():
    try:
        body = json.loads(request.get_data())
        
        # error handling #                
        if ('name' not in body):
            return 'name missing', 400
        
        if (body['name'] == ''):
            return 'name empty', 400
        
        if (api._does_name_exist(body['name']) == True):
            if (api._is_name_expired(body['name']) == True):
                api._delete_by_name(body['name'])
            else:
                return 'name already exists', 409

        if ('data' not in body):
            return 'data missing', 400
        
        if (body['data'] == ''):
            return 'data empty', 400
        
        if ('isTextOnly' not in body):
            return 'isTextOnly not specified', 400
        
        if (body['isTextOnly'] != True and
            body['isTextOnly'] != False):
            return 'isTextOnly must be true or false', 400
        
        if (body['isTextOnly'] == False):
            files = json.loads(body['data'])

            if (len(files) > 4):
                return 'Maximum number of files (4) exceeded', 413
        
        if (len(body['data']) > 1073741824):
            return 'Maximum data size (1GB) exceeded', 413
        ##################
        
        # insert into database #
        id = str(uuid.uuid4())
        token = api._gen_bearer_token()
        access_key = api._gen_access_key()
        
        api.db_cursor.execute(
                'INSERT INTO `data` (`id`, `name`, `data`, `isTextOnly`) VALUES (%s,%s,%s,%s)',
            (id, body['name'], body['data'], body['isTextOnly']))
        
        api.db_cursor.execute(
                'INSERT INTO `access` (`data-id`, `token`, `access-key`) VALUES (%s,%s,%s)',
            (id, token, access_key))
            ########################
        
        return token
    except:
        return 'An unexpected error occured', 500

@app.route(Config.get('API_PATH')+'/get_access_key_and_name', methods=['GET'])
def get_access_key_and_name():
    try:
        bearer_token = request.headers.get('Access')
        if (bearer_token == ''):
            return 'No bearer token received', 400
        
        # checks #
        if (api._is_authorized(bearer_token) == False):
            return 'No data found for bearer token', 401
        if (api._is_expired(bearer_token) == True):
            api._delete_data(bearer_token)
            return 'Data has expired', 410
        if (api._is_locked(bearer_token) == True):
            return 'Data is currently locked, please refresh acceess key', 409
        ##########
        
        data = api._get_data(bearer_token)
        
        body = {
            'accessKey': data['key'],
            'name': data['name']
        }
        return json.dumps(body)
    except:
        return 'An unexpected error occured', 500

@app.route(Config.get('API_PATH')+'/refresh', methods=['POST'])
def refresh():
    try:
        bearer_token = request.headers.get('Access')
        if (bearer_token == ''):
            return 'No bearer token received', 400
        
        # checks #
        if (api._is_authorized(bearer_token) == False):
            return 'No data found for bearer token', 401
        if (api._is_expired(bearer_token) == True):
            api._delete_data(bearer_token)
            return 'Data has expired', 410
        if (api._is_locked(bearer_token) == True):
            api._remove_lock_entry(bearer_token)
        ##########
        
        data = api._get_data(bearer_token)
        new_name = request.get_data().decode(encoding='utf8')
        
        if (new_name != '' and
            new_name != None and
            new_name != data["name"]):
            
            if (api._does_name_exist(new_name)):
                return 'Name already exists', 409
            
            api.db_cursor.execute(
                'UPDATE `data` SET `name`=%s WHERE id=%s',
                (new_name, data['id'])
            )
        
        new_access_key = api._gen_access_key(data['key'])
        api.db_cursor.execute(
            'UPDATE `access` SET `access-key`=%s WHERE `token`=%s',
            (new_access_key, bearer_token)
        )
        
        updated_data = api._get_data(bearer_token)
        
        body = {
            'name': updated_data['name'],
            'accessKey': updated_data['key']
        }
        return json.dumps(body)
    except:
        return 'An unexpected error occured', 500

@app.route(Config.get('API_PATH')+'/delete', methods=['DELETE'])
def delete():
    try:
        bearer_token = request.headers.get('Access')
        if (bearer_token == ''):
            return 'No bearer token received', 400
        
        # checks #
        if (api._is_authorized(bearer_token) == False):
            return 'No data found for bearer token', 401
        if (api._is_expired(bearer_token) == True):
            api._delete_data(bearer_token)
            return 'Data has expired', 410
        ##########
        
        api._delete_data(bearer_token)
        
        return 'Successfully deleted'
    except:
        return 'An unexpected error occured', 500

@app.route(Config.get('API_PATH')+'/search_name', methods=['POST'])
def search_name():
    try:
        name = request.get_data()
        
        if (name == '' or
            name == None):
            return 'No name received', 400
        
        if (api._does_name_exist(name) == False):
            return 'Name not found', 404
        
        if (api._is_name_expired(name) == True):
            api._delete_by_name(name)
            return 'Name has expired', 410
        
        if (api._is_name_locked(name) == True):
            return 'Data is currently locked. Refresh on other device.', 403
        
        return 'Name found'
    except:
        return 'An unexpected error occured', 500

@app.route(Config.get('API_PATH')+'/access_data', methods=['POST'])
def access_data():
    try:
        body = json.loads(request.get_data())
        
        # checks #            
        if ('name' not in body):
            return 'name missing', 400
        
        if (body['name'] == ''):
                return 'name empty', 400
        
        if ('key' not in body):
            return 'key missing', 400
        
        if (body['key'] == ''):
            return 'key empty', 400
        
        name = body['name']
        key = body['key']
        
        if (api._does_name_exist(name) == False):
            return 'Name not found', 404
        
        if (api._is_name_expired(name) == True):
            api._delete_by_name(name)
            return 'Name has expired', 410
        
        if (api._is_name_locked(name) == True):
            return 'Data is currently locked. Refresh on other device.', 403
        ##########
        
        api.db_cursor.execute(
            'SELECT `id` FROM `data` JOIN `access` ON `id`=`data-id` WHERE `name`=%s AND `access-key`=%s',
            (name, key)
        )
        data_tuple = api.db_cursor.fetchone()
        
        if (data_tuple == None):
            api._create_lock_entry(name)
            return 'Wrong access key. Data is locked. Refresh on other device.', 401
        
        id = data_tuple[0]
        
        api.db_cursor.execute(
            'SELECT * FROM `data` WHERE `id`=%s',
            (id,)
        )
        data_tuple = api.db_cursor.fetchone()
        
        response = json.loads(json.dumps({
            'name': data_tuple[1],
            'data': data_tuple[2],
            'isTextOnly': data_tuple[3] == b'\x01' or data_tuple[3] == True
        }))
        
        return response
    except:
        return 'An unexpected error occured', 500

if __name__ == '__main__':
    app.run(
            debug=True,
            host='localhost',
            port=Config.get('API_PORT')
        )