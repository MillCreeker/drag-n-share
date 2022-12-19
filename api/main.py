from api import API

if __name__ == '__main__':
    api = API()
    api.run()

# import mariadb.connections
# from config import Config
# import json
# import time
# import uuid


# db_connection = mariadb.connect(
#         host=Config.get('DB_HOST'),
#         database=Config.get('DB_DATABASE'),
#         user=Config.get('DB_USER'),
#         password=Config.get('DB_PW')
#     )
# db_cursor = db_connection.cursor()

# id = str(uuid.uuid4())
# print(id)
# timestamp = time.time()

# db_cursor.execute(
#     "INSERT INTO `data` (id, name) VALUES (?,?)",
#     (id, 'test'))

# db_cursor.execute(
#     "SELECT * FROM `data` WHERE id=?",
#     (id,))

# print(db_cursor.fetchall())

# db_connection.close()