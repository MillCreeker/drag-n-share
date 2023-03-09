import pymysql.cursors
from config import Config
from datetime import datetime, timedelta

class Utils:
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

if __name__ == '__main__':
    utils = Utils()
    
    expire_time = datetime.now() - timedelta(minutes=5)
    
    utils.db_cursor.execute(
        'SELECT `id` FROM `data` WHERE `timestamp`<=%s',
        (expire_time,)
    )
    data_tuple = utils.db_cursor.fetchall()
    
    for tuple in data_tuple:
        id = tuple[0]
        
        utils.db_cursor.execute(
            'DELETE FROM `lock-entries` WHERE `data-id`=%s',
            (id,)
        )
        
        utils.db_cursor.execute(
            'DELETE FROM `access` WHERE `data-id`=%s',
            (id,)
        )
        
        utils.db_cursor.execute(
            'DELETE FROM `data` WHERE `id`=%s',
            (id,)
        )