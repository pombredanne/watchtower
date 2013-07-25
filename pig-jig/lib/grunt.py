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

import os
import sys

from com.mortardata.hawk import HawkScriptError 
from org.apache.pig.tools.grunt import Grunt as PigGrunt
from org.apache.pig import Main as PigMain
from org.apache.pig.impl import PigContext
from org.apache.pig.impl.util import PropertiesUtil
from org.apache.pig import ExecType
from org.apache.commons.lang.exception import ExceptionUtils
from org.apache.pig.scripting.jython import JythonFunction
from org.apache.pig.scripting.jython import JythonScriptEngine
from org.apache.pig.scripting import ScriptEngine
from java.util import Properties
from java.util import ArrayList
from java.util import HashMap
from java.util import LinkedHashMap
from java.lang import String
from java.lang import Exception as JavaException
from java.lang import Error as JavaError
from java.lang import Class
from java.io import *
from jline import *
from java.lang import System as javasystem
from lib.io import PigBufferedReader
from lib.io import PigInputStream
from lib.io import NullOutputStream

class Grunt():
    def __init__(self):
        # Redirect standard out to log file
        # javasystem.setOut(PrintStream(NullOutputStream()))
        self.originalOut = sys.stdout

        # Setup pig
        props = Properties()

        props.putAll(javasystem.getProperties())

        for f in os.environ.get("DEFAULT_PIG_OPTS_FILES").split(","):
            PropertiesUtil.loadPropertiesFromFile(props, f) 

        props.setProperty('log4jconf', os.environ.get('LOG4J_CONF'))
        pigOpts = os.environ.get('PIG_OPTS')
        if pigOpts:
            for opt in pigOpts.strip().split(' '):
                opt = opt.split('=')
                props.setProperty(opt[0], opt[1])

        pigContext = PigContext(ExecType.LOCAL, props)

        params = ArrayList()
        paramFiles = ArrayList()
        pigContext.setParams(params)
        pigContext.setParamFiles(paramFiles)

        PigMain.configureLog4J(props, pigContext)
        pigInputStream = PigInputStream()
        reader = ConsoleReader(pigInputStream, OutputStreamWriter(javasystem.out))
        inputStream = ConsoleReaderInputStream(reader)

        self.pigBufferedReader = PigBufferedReader(InputStreamReader(pigInputStream))

        self.grunt = PigGrunt(self.pigBufferedReader, pigContext)
        self.grunt.setConsoleReader(reader)
        self.pigServer = self.grunt.pig

    def illustrate(self, script_path, script_params, script_params_file):
        """
        Runs an Illustrate on the script.
        Simulates GruntParser.processIllustrate
        Returns JSON Illustrate results as a string
        """
        
        # Restore stdout
        sys.stdout = self.originalOut

        # Bust UDF Cache
        self.bust_udf_cache()

        os = ByteArrayOutputStream()
        ps = PrintStream(os)
        params = ArrayList()
        for param in script_params:
            params.add("%s=%s" % (param['name'],param['value']))
        files = ArrayList()
        if script_params_file:
            files.add(script_params_file)

        try:
            self.grunt.parser.loadScript(script_path, params, files)
            self.pigServer.getExamples(None, True, ps)
        except JavaException, e:
            print "java exception"
            print ExceptionUtils.getStackTrace(e)
            return HawkScriptError.getHawkScriptError(e).toJSON()
        except JavaError, e:
            print "java error"
            print ExceptionUtils.getStackTrace(e)
            return HawkScriptError.getHawkScriptError(e).toJSON()

        return os.toString("UTF8")

    def bust_udf_cache(self):
        """
        Clears the UDF caches in the pigContext variable, as well
        as deletes the function definitions for Jython
        """
        # Delete all functions in the Jython interpreter
        jython_script_engine = ScriptEngine.getInstance("jython")
        for func_key in self.pigServer.pigContext.definedFunctions:
            func = self.pigServer.pigContext.definedFunctions.get(func_key)
            print func.toString()
            if str(func).startswith(str(JythonFunction.canonicalName) + '('):
                command = "del(%s)" % func_key.split('.')[-1]
                command_stream = ByteArrayInputStream(String(command).getBytes("UTF-8"));
                jython_script_engine.load(command_stream, None, None)

        self.pigServer.pigContext.scriptingUDFs = HashMap() 
        self.pigServer.pigContext.scriptFiles = ArrayList() 
        self.pigServer.pigContext.aliasedScriptFiles = LinkedHashMap() 
        self.pigServer.pigContext.definedFunctions = HashMap() 
        self.pigServer.pigContext.definedCommands = HashMap() 


    def run_command(self, commands):
        """
        Runs a command through grunt.
        """
        self.pigBufferedReader.commands = commands
        self.grunt.run()
