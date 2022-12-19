from pathlib import Path

class Config:
    __variables = {}
    
    file_path = Path(__file__).with_name('.config')
    with file_path.open('r') as file:
        lines = file.readlines()
    
    for line in lines:
        key_val = line.strip().split('=')
        if (len(key_val) == 1):
            key_val.append('')
        __variables[key_val[0]] = key_val[1]
    
    
    def get(var_name):
        if (var_name in Config.__variables):
            return Config.__variables[var_name]
        return ''