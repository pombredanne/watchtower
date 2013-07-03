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
require "xmlrpc/client"
require "eventmachine"

# Delegate class to provide pig functionality
class Mortar::Local::Grunt <  Mortar::Local::Pig
  class HandledError < StandardError; end

  # Public: The name of the pigjig log file
  PIGJIG_LOG_FILE = "watchtower-pigjig-server.log"

  # The timeout for an pigjig (illustrate) call
  PIGJIG_TIMEOUT = 5 * 60 

  # The number of times we should initally retry connection to pigjig
  PIGJIG_INITIAL_RETRY_COUNT = 10

  def initialize
    reset_local_logs
    @illustrate_subscribers = EventMachine::Channel.new()
  end

  # Public: Starts up a Pig Server (Grunt). The block provided will execute once
  # pig server has started. When the block exits, the pig server will be stopped
  #
  # Returns nothing.
  def start
    unset_hadoop_env_vars
    # Generate the script for running the command, then
    # write it to a temp script which will be exectued
    script_text = script_for_watcher()

    script = Tempfile.new("mortar-")
    script.write(script_text)
    script.close(false)
    FileUtils.chmod(0755, script.path)

    @pid = fork do
      exec("#{script.path} > #{local_log_dir}/#{PIGJIG_LOG_FILE}")
    end 

    # Create connection to pig server
    begin
      @server ||= XMLRPC::Client.new('localhost', '/RPC2', 1967 )
      @server.timeout = PIGJIG_TIMEOUT
    rescue => e
      raise HandledError, <<-ERROR
Seems as though an instance of watchtower is already running
ERROR
    end

    wait_for_server_to_start

    return (0 == $?.to_i)
  end

  # Public: Stop the Grunt server
  #
  # Returns nothing.
  def stop
    kill_with_descendants(@pid)
  end

  # Public: Checks if the server is running?
  #
  # Returns Boolean.
  def server_running?
    !! @server
  end

  # Public: Subscribe to illustrate complete events
  #
  # Return SubscriberID.
  def subscribe_to_illustrate(&block)
    @illustrate_subscribers.subscribe(&block)
  end

  # Public: Unsubscribe subscriberid from illustrate complete events
  #
  # sid - the subscriber id
  #
  # Returns nothing.
  def unscubscribe_to_illustrate(sid)
    @illustrate_subscribers.unsubscribe(sid)
  end

  # Public: Run an illustrate command on the Grunt server
  #
  # pig_script_path - path to the pig script being illustrated
  # pig_params - dictionary of parameters and values
  # pig_params_file_path - path to param file to be executed
  #
  # Notifies Illustrate subscribers with JSON result.
  def illustrate(pig_script_path, pig_params, pig_params_file_path)
    # Only execute if the server is running
    unless server_running?
      return
    end

    # Prevent illustrates from running on top of eachother
    if illustrating? 
      @illustrate_queued = true
      return
    end

    worker = lambda {
      @illustrating = true
      pig_params_file_path ||= ""

      begin
        return @server.call("illustrate", pig_script_path, pig_params + automatic_pig_parameters, pig_params_file_path)
      rescue StandardError => e
        return e
      end
    }

    callback = lambda { |illustrate_json_or_error|
      @illustrating = false

      safe_pigjig_call do
        raise_async_if_error(illustrate_json_or_error)

        # Notify subscribers
        @illustrate_subscribers.push(illustrate_json_or_error)

        if illustrate_queued?
          EM.next_tick do
            @illustrate_queued = false 
            illustrate(pig_script_path, pig_params, pig_params_file_path)
          end
        end
      end
    }

    EM.next_tick do
      EM.defer(worker, callback)
    end
  end

  # Public: Is an illustrating in progress?
  #
  # Returns Boolean.
  def illustrating?
    !!@illustrating
  end

  # Public: Is an illustrate queued?
  #
  # Returns Boolean.
  def illustrate_queued?
     !!@illustrate_queued
  end

  private

  # Internal: Checks async returns for errors, and raises them
  # if they exist
  def raise_async_if_error(val)
    raise val if val.kind_of?(StandardError)
  end
    
  # Internal: Safe call to pigjig server
  #
  # &block - the block that'll make the server call
  #
  # Returns nothing.
  def safe_pigjig_call(&block)
    begin
      block.call
    rescue XMLRPC::FaultException => e
      raise e, "Pig Server Fault Exception"
    rescue Timeout::Error => e
      raise HandledError, "Pig Server has reached timeout limit"
    end
  end

  # Internal: Kill a process and all of its decendeants
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
      begin
        Process.kill 9, pid 
      rescue Errno::ESRCH
        # No such process, skip
      end
    end
  end

  # Internal: Gets the location of the runwatcher template
  #
  # Returns a String path to the runwatcher template
  def watcher_command_script_template_path
    File.expand_path("../../templates/script/runwatcher.sh", __FILE__)
  end
  
  # Internal: Gets the root of the pigjig code 
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

  # Internal: Waits until it can communicate with the server
  #
  # Returns when server started
  def wait_for_server_to_start
    puts "Waiting for Pig Server to start..."
    for i in 0..PIGJIG_INITIAL_RETRY_COUNT
      begin
        safe_pigjig_call do 
          @server.call("ping")
        end
        return
      rescue Errno::ECONNREFUSED => e
        break if i == PIGJIG_INITIAL_RETRY_COUNT
        sleep 3
        puts "Still waiting..."
      end
    end

    raise "Pig server took too long to start!"
  end

end

