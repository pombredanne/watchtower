from com.mortardata.hawk import HawkScriptError 
from org.apache.pig.tools.grunt import Grunt as PigGrunt
from org.apache.pig import Main as PigMain
from org.apache.pig.impl import PigContext
from org.apache.pig import ExecType
from org.apache.commons.lang.exception import ExceptionUtils
from java.util import Properties
from java.util import ArrayList
from java.lang import String
from java.lang import Exception as JavaException
from java.lang import Error as JavaError
from java.io import *
from jline import *
from java.lang import System as javasystem
from lib.io import PigBufferedReader
from lib.io import PigInputStream
from lib.io import NullOutputStream
import os

class Grunt():
    def __init__(self):
        # Redirect standard out to log file
        javasystem.setOut(PrintStream(NullOutputStream()))

        # Setup pig
        props = Properties()
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

        os = ByteArrayOutputStream()
        ps = PrintStream(os)
        params = ArrayList(script_params)
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

    def run_command(self, commands):
        """
        Runs a command through grunt.
        """
        self.pigBufferedReader.commands = commands
        self.grunt.run()
