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
require "mortar/local/pig"

# Delegate class to provide pig functionality
class Mortar::Local::Pig

  # Public: The name of the pigjig log file
  PIGJIG_LOG_FILE = "watchtower-pigjig-server.log"

  # Public: Starts up a Pig Server (Grunt). The block provided will execute once
  # pig server has started. When the block exits, the pig server will be stopped
  #
  # &block  - A Block that will run after the Pig Grunt server has been started
  #
  # Returns nothing.
  def startup_grunt(&block)
    unset_hadoop_env_vars
    # Generate the script for running the command, then
    # write it to a temp script which will be exectued
    script_text = script_for_watcher()

    script = Tempfile.new("mortar-")
    script.write(script_text)
    script.close(false)
    FileUtils.chmod(0755, script.path)
    pid = fork do
      exec("#{script.path} > #{local_log_dir}/#{PIGJIG_LOG_FILE}")
    end

    block.call

    script.unlink
    kill_with_descendants(pid)

    return (0 == $?.to_i)
  end

  # Kill a process and all of its decendeants
  #
  # Note: Untested on windows, probably won't work seeing it relies on the
  # Unix ps command
  #
  # process_id - The parent process id that you want killed
  #
  # Returns nothing
  def kill_with_descendants(process_id)
    descendants = Hash.new{|ht,k| ht[k]=[k]}
    Hash[*`ps -eo pid,ppid`.scan(/\d+/).map{|x|x.to_i}].each{|pid,ppid|
      descendants[ppid] << descendants[pid]
    }
    descendants = descendants[process_id].flatten - [process_id]

    descendants.each do |pid|
      Process.kill 9, pid 
    end
  end

  # Public: Gets the location of the runwatcher template
  #
  # Returns a String path to the runwatcher template
  def watcher_command_script_template_path
    File.expand_path("../../templates/script/runwatcher.sh", __FILE__)
  end
  
  # Public: Gets the root of the pigjig code 
  #
  # Returns a String path to the pigjig codebase
  def pig_jig_directory
    File.expand_path("../../../../../pig-jig", __FILE__)
  end

  # Internal: Generates watcher script from template
  #
  # Returns a String of the compiled runwatcher script
  def script_for_watcher()
    template_params = watcher_command_script_template_parameters()
    erb = ERB.new(File.read(watcher_command_script_template_path), 0, "%<>")
    erb.result(BindingClazz.new(template_params).get_binding)
  end

  # Internal: Gets the watcher script parameters
  #
  # Returns a Hash of all the parameters needed in the runwatcher script
  def watcher_command_script_template_parameters()
    template_params = {}
    template_params['classpath'] = "#{pig_directory}/*:#{pig_directory}/lib/*:#{jython_directory}/jython.jar:#{pig_directory}/conf/jets3t.properties:#{pig_directory}/lib-pig/*:#{jython_directory}/jython.jar"
    template_params['project_home'] = File.expand_path("..", local_install_directory)
    template_params['local_install_dir'] = local_install_directory
    template_params['pig_jig_directory'] = pig_jig_directory 
    template_params['pig_opts'] = pig_options
    template_params
  end

end

