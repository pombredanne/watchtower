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

require "watchtower/mortar/local/controller"
require "mortar/command/base"

# watch data flow through your script as you're writing
#
class Mortar::Command::Watch < Mortar::Command::Base


  # watch PIGSCRIPT
  #
  # Watch a local script for changes, and illustrate data flowing through
  # while you work.
  #
  # -p, --parameter NAME=VALUE  # Set a pig parameter value in your script.
  # -f, --param-file PARAMFILE  # Load pig parameter values from a file.
  # -t, --port PORT  # What port the pig server should run on.
  #
  # Examples:
  #
  #    Check the pig syntax of the generate_regression_model_coefficients script locally.
  #        $ mortar watch generate_regression_model_coefficients
  def index
    script_name = shift_argument
    unless script_name
      error("Usage: mortar local:watch PIGSCRIPT\nMust specify PIGSCRIPT.")
    end
    validate_arguments!
    script = validate_pigscript!(script_name)
    ctrl = Mortar::Local::Controller.new
    
    param_file = nil
    if options[:param_file]
      param_file = File.expand_path(options[:param_file], Dir.pwd)
    end
    # Make options nil to prevent pig_parameters from trying to add them to the hash
    options[:param_file] = nil

    ctrl.watch(project, script, pig_parameters, param_file, options[:port])
  end
end
