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

require "watchtower/mortar/local/watcher"
require "watchtower/mortar/local/grunt"
require "mortar/local/controller"

class Mortar::Local::Controller
  def watch(project, pig_script, pig_params, pig_param_file, port=3000)
    require_aws_keys
    install_and_configure
    grunt = Mortar::Local::Grunt.new()
    watcher = Mortar::Local::Watcher.new(project.root_path)

    # Startup Web server
    Server.set :title, pig_script.name + ".pig"
    Server.set :grunt, grunt
    begin
      server = Thin::Server.new(Server, '0.0.0.0', port, :signals => false)
    rescue => e
      raise Mortar::Local::Grunt::HandledError, <<-ERROR
Seems as though an instance of watchtower is already running.

Please make sure any instances of watchtower are completely shut down before
using a new instance of watchtower
ERROR
    end

    puts "Starting Pig Server..."
    grunt.start

    EM.error_handler do |e|
      EM.stop
      puts format_with_bang("Uhoh! Something went wrong!")
      puts format_with_bang("Stopping Pig Server")
      grunt.stop
      puts format_with_bang("Server Stopped!")
      if e.kind_of?(Mortar::Local::Grunt::HandledError)
        error(e.message)
      else
        styled_error e
        exit(1)
      end
    end

    # NOTE: this is a failed attempt to force close connections for Thin
    # on Ruby 1.8.7 to allow things to quit quickly. Although this didn't work
    # I've kept the code, because it is most likely the making custom signal traps
    # is the way to solve this problem.
    trap("INT") do
      EM.stop
      puts "Stopping Pig Server"
      grunt.stop
      puts "Server Stopped!"
      puts "Closing all open connections"
      Server.notify(:file_watchers)
      Server.notify(:illustrate_watchers, "{ \"connection\" : \"closed\"")
      server.stop!
    end

    EM.run do
      puts "Starting File Watcher..."
      watcher.watch { |modified, added, removed|
        puts "File Changed!"
        puts "Illustrating..."
        grunt.illustrate(pig_script.path, pig_params, pig_param_file)
        Server.notify(:file_watchers)
      }

      illustrate_subscriber_id = grunt.subscribe_to_illustrate { |illustrate_json|
        puts "Illustrate Complete"
        puts "Notifying Web Client"
        Server.settings.illustrate_data = illustrate_json
        Server.notify(:illustrate_watchers, illustrate_json)
      }

      server.start
      launch_browser(port)

      grunt.illustrate(pig_script.path, pig_params, pig_param_file)
    end

    grunt.stop
  end

  private

  # Private: launch the web browser once we've heard back and
  # verified the pigjig server has started
  #
  # Returns nothing
  def launch_browser(port) 
    require "launchy"
    Launchy.open("http://localhost:#{port}")
  end

  def styled_error(error, message='Watchtower internal error.')
    $stderr.puts(" !    #{message}.")
    $stderr.puts(" !    Report a bug at: https://github.com/mortardata/watchtower/issues/new")
    $stderr.puts
    $stderr.puts("    Error:       #{error.message} (#{error.class})")
    $stderr.puts("    Backtrace:   #{error.backtrace.first}")
    error.backtrace[1..-1].each do |line|
      $stderr.puts("                 #{line}")
    end
    if error.backtrace.length > 1
      $stderr.puts
    end
    command = ARGV.map do |arg|
      if arg.include?(' ')
        arg = %{"#{arg}"}
      else
        arg
      end
    end.join(' ')
    $stderr.puts
  end


end
