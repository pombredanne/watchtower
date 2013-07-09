require "watchtower/mortar/local/controller"
require "mortar/command/base"

# run select pig commands on your local machine
#
class Mortar::Command::Local < Mortar::Command::Base


  # local:watch PIGSCRIPT
  #
  # Watch a local script for changes, and illustrate test 
  #
  # -p, --parameter NAME=VALUE  # Set a pig parameter value in your script.
  # -f, --param-file PARAMFILE  # Load pig parameter values from a file.
  #
  # Examples:
  #
  #    Check the pig syntax of the generate_regression_model_coefficients script locally.
  #        $ mortar local:watch generate_regression_model_coefficients
  def watch
    script_name = shift_argument
    unless script_name
      error("Usage: mortar local:watch PIGSCRIPT\nMust specify PIGSCRIPT.")
    end
    validate_arguments!
    script = validate_pigscript!(script_name)
    ctrl = Mortar::Local::Controller.new
    
    param_file = options[:param_file]
    # Make options nil to prevent pig_parameters from trying to add them to the hash
    options[:param_file] = nil

    ctrl.watch(project, script, pig_parameters, param_file)
  end
end