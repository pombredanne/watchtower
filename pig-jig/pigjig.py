#
# Copyright 2013 Mortar Data Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from SimpleXMLRPCServer import SimpleXMLRPCServer
from lib.grunt import Grunt

if __name__ == "__main__":

    grunt = Grunt()
    
    def illustrate(script_path, script_params, script_params_file):
        print "Illustrating script: %s, with param file %s, and params %s" \
                % (script_path, script_params_file, script_params)
        try:
            return grunt.illustrate(script_path, script_params, script_params_file if script_params_file else None) 
        except Exception, e:
            print "Jython Error"
            print e
            return

    def ping():
        return "pong"

    server = SimpleXMLRPCServer(("localhost", 1967), logRequests=False)
    print "Listening on port 1967..."
    server.register_function(illustrate, "illustrate")
    server.register_function(ping, "ping")
    server.serve_forever()

