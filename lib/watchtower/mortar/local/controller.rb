require "watchtower/mortar/local/watcher"
require "mortar/local/controller"

class Mortar::Local::Controller
  def watch(project, pig_script, pig_param_string, pig_param_file)
    require_aws_keys
    install_and_configure
    watcher = Mortar::Local::Watcher.new(project, pig_script, pig_param_string, pig_param_file)
    watcher.watch
  end
end
