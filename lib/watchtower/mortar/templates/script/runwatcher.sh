#!/bin/bash

set -e

export CLASSPATH=<%= @classpath %>
export PIG_OPTS="<% @pig_opts.each do |k,v| %>-J-D<%= k %>=<%= v %> <% end %>"
export DEFAULT_PIG_OPTS_FILES="<%= @default_pig_opts_files %>"
export LOG4J_CONF=<%= @local_install_dir %>/pig/conf/log4j-cli-local-dev.properties

# UDF paths are relative to this direectory
cd <%= @project_home %>/pigscripts

# Setup python environment
source <%= @local_install_dir %>/pythonenv/bin/activate

# To debug add the following line to the Run Jython statement
#  -J-Xdebug -J-Xrunjdwp:transport=dt_socket,server=y,address=8000 \

# Run Jython
<%= @local_install_dir %>/jython/bin/jython \
  $PIG_OPTS \
  -Dpython.verbose=error \
  -Dpython.security.respectJavaAccessibility=false \
  <%= @pig_jig_directory %>/pigjig.py

