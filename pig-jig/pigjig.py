from SimpleXMLRPCServer import SimpleXMLRPCServer
from lib.grunt import Grunt

if __name__ == "__main__":

    grunt = Grunt()
    
    def illustrate(script_path, script_params, script_params_file):
        print "Illustrating script: %s, with param file %s, and params %s" \
                % (script_path, script_params_file, script_params)
        return grunt.illustrate(script_path, script_params, script_params_file if script_params_file else None) 

    def ping():
        return "pong"

    server = SimpleXMLRPCServer(("localhost", 1967), logRequests=False)
    print "Listening on port 1967..."
    server.register_function(illustrate, "illustrate")
    server.register_function(ping, "ping")
    server.serve_forever()

