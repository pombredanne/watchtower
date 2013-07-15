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

from java.io import *
from java.lang import *
from time import sleep

class PigBufferedReader(BufferedReader):
    def __init__(self, reader):
        super(PigBufferedReader, self).__init__(reader)
        self.reader = reader
        self.commands = ""

    def read(self, *args):
        """
        Overload the BufferedReader's read method.
        Currently only handles the (char[], int, int) signature.
        Returns the number of characters read from the instance command.
        """
        # If there is no command to send, return
        if(self.commands == ""):
            return -1

        # If overload method with 3 arguments
        if len(args) == 3:
            charAry = args[0]
            offset = args[1]
            maxRead = args[2]
            commandLength = len(self.commands)
            
            # You have to add a newline to the beginning and end of the stream,
            # Otherwise bad stuff happens

            charAry[offset] = '\n'
            for index in range(0, maxRead):
                if index < commandLength:
                    charAry[offset + index + 1] = self.commands[index]
                else:
                    charAry[offset + index + 1] = '\n' 
                    self.commands = ""
                    break

                if index == (maxRead - 1):
                    self.commands = self.commands[maxRead:]
                    break
               
            return commandLength + 2 
        else:
            return 0

    def readLine(self):
        return ""

    def skip(self, n):
        return 0

    def reset(self):
        return

    def mark(self, readLimit):
        return

    def markSupported(self):
        return False

    def ready(self):
        return True 

    def close(self):
        self.reader.close()
        return

class PigInputStream(InputStream):
    def __init__(self):
        pass

    def read(self, *args):
        sleep(5)
        return 0

    def skip(self, n):
        return 0

    def reset(self):
        return

    def mark(self, readLimit):
        return

    def markSupported(self):
        return False

    def available(self):
        return 1

    def close(self):
        return

class NullOutputStream(OutputStream):
    def __init__(self):
        pass

    def write(self, *args):
        return

    def flush(self):
        return

    def close(self):
        return
