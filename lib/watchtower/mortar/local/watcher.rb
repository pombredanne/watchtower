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
require "mortar/helpers"
require "watchtower/mortar/local/pig"
require "watchtower/mortar/local/server"

require 'sinatra/base'
require 'thin'
require "json"
require "listen"

require "eventmachine"
require "xmlrpc/client"

require "logger"

# This class manages the file watcher, pig server, and web server and how they
# all interact together
class Mortar::Local::Watcher
  include Mortar::Local::InstallUtil

  WATCHER_LOG_FILE = "watchtower-watcher.log"

  # The timeout for an pigjig (illustrate) call
  PIGJIG_TIMEOUT = 60 * 5

  # The number of times we should initally retry connection to pigjig
  PIGJIG_INITIAL_RETRY_COUNT = 10

  # Public: Initialize the watcher utility
  #
  # project           - The mortar project we're watching
  # pig_script        - The specific pig_script we're watching
  # pig_params_string - The string returns from the command
  # pig_params_file   - The pig params file that'll be passed to the Pig server
  #
  # Returns a Watcher object
	def initialize(project, pig_script, pig_params_string, pig_params_file)
    @project = project
		@pig_script = pig_script
    @pig_params_string = pig_params_string ? Array(pig_params_string) : []
    @pig_params_file = pig_params_file ? File.expand_path(pig_params_file, Dir.pwd) : ""

    @pig = Mortar::Local::Pig.new()
    @pig.reset_local_logs
    Server.set :title, @pig_script.name + ".pig"

    @log ||= Logger.new("#{local_log_dir}/#{WATCHER_LOG_FILE}")
    @log.level = Logger::DEBUG
	end


  # Public: Start up the file watcher, pig server, and webserver.
  #
  # Starts up an EventMachine loop that will asynchronously handle
  # file changes, and illustrate requests
  #
  # Returns Nothing
	def watch 

    # Setup default parameters for pigjig
    default_params = [] 
    @pig.automatic_pig_parameters.each { |p| default_params << "#{p['name']}=#{p['value']}" }
    @pig_params_string += default_params

    # Startup pigjig
    @pig.startup_grunt do 

      # Create connection to pig server
      @server ||= XMLRPC::Client.new('localhost', '/RPC2', 1967 )
      @server.timeout = PIGJIG_TIMEOUT

      EM.run do
        # Startup File Watcher
        script_changed = lambda { |modified, added, removed|

          @log.debug "File(s) changed! - #{modified.join(", ")}" unless (modified.nil? || modified.empty?)
          @log.debug "File(s) added! - #{added.join(", ")}" unless (added.nil? || added.empty?)
          @log.debug "File(s) removed! - #{removed.join(", ")}" unless (removed.nil? || removed.empty?)

          illustrate

          connections = Server.settings.file_watchers
          connections.each do |conn|
            conn.call()
          end
          Server.settings.file_watchers = []
        }

        pig_listener = Listen.to(@project.root_path,
           :filter => /(udfs|macros|pigscripts).*/,
           :ignore => /^\..*$/)

        pig_listener.change(&script_changed)
        pig_listener.start

        # Startup Web server
        Thin::Server.start Server, '0.0.0.0', 3000

        launch_browser
      end     
    end
	end

  private

  # Private: launch the web browser once we've heard back and
  # verified the pigjig server has started
  #
  # Returns nothing
  def launch_browser 
    for i in 0..PIGJIG_INITIAL_RETRY_COUNT
      begin
        pig_server_call do 
          @server.call("ping")
        end
        require "launchy"
        Launchy.open("http://localhost:3000")

        # Do the illustrate in one second, this should give enough time
        # for the webserver to respond to the request from above.
        EM.add_timer(1) do
          illustrate
        end
        break
      rescue Errno::ECONNREFUSED => e
        if i == PIGJIG_INITIAL_RETRY_COUNT
          puts "Unable to connect to Pig Server"
          puts 
          puts "Try opening your browser to http://localhost:3000"
        else
          puts "Attempt #{i+1}: Pig Server has not yet started. Waiting 3 seconds..."
        end
        sleep 3
      end
    end
  end

  # Private: A error handler wrapper for pigserver calls
  #
  # When a pigserver call fails, the error will be printed and
  # the EventMachine will be stopped.
  #
  # Returns nothing
  def pig_server_call(&block)
    begin
      block.call
    rescue XMLRPC::FaultException => e
      puts
      puts(<<-ERR)
! Pig Server Fault Exception:
! #{e.faultString}
ERR
      EM.stop
    rescue Timeout::Error => e
      puts
      puts(<<-ERR)
! Pig Server has reached timeout limit
ERR
      EM.stop
    end
  end

  # Private: Send the illustrate command to the pigjig server and
  # set the appropriate working state for the webserver
  #
  # Returns nothing
  def illustrate

    # Prevent illustrates from running on top of eachother
    if Server.settings.is_illustrating
      Server.settings.illustrate_queued = true
      return
    end

    worker = lambda {
      Server.settings.is_illustrating = true
      pig_server_call do 
        action "Running illustrate" do
          result = @server.call("illustrate", @pig_script.path, @pig_params_string, @pig_params_file)
        end
      end
    }

    callback = lambda { |illustrate_json|
        action "Notifying webclient" do
          Server.settings.illustrate_data = illustrate_json
          connections = Server.settings.illustrate_connections
          connections.each do |conn|
            conn.call(illustrate_json)
          end
          Server.settings.illustrate_connections = []
          Server.settings.is_illustrating = false
        end
        if Server.settings.illustrate_queued
          EM.next_tick do
            Server.settings.illustrate_queued = false
            illustrate
          end
        end
    }

    EM.next_tick do
      EM.defer(worker, callback)
    end
  end
end

