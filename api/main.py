from api import API

if __name__ == '__main__':
    api = API()
    api.run()
    
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