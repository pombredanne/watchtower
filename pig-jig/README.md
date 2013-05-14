## Pig Jig ##

Pig Jig is the Jython wrapper around native pig that serves as the local Pig server. Pig Jig is run with the `python.security.respectJavaAccessibility` Java property set to false. This allows Jython to have access to private and protect Java variables. This allows Pig Jig to setup a Pig environment exactly as required instead of interfacing through Grunt. The intent is to be able to make Pig do exactly what we need with out extending the actual Pig codebase. This requires a lot of manual testing to make sure everything continues to work.

### End Points ###

All endpoints are accesible via the XMLRPC protocol.

**Illustrate:**

Function Name: illustrate

Parameters: 
* script_path - an absolute path to the script to illustrate
* script_params - an array of params in the following format `field=value`
* script_params_file - an absolute path to a pig params file

Returns: A JSON String with either the illustrate results, or a JSONified HawkScriptError object.

**Ping**

Function Name: ping

Returns: "pong"
