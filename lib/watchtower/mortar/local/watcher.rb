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
require "watchtower/mortar/local/server"

require 'sinatra/base'
require 'thin'
require "json"
require "listen"
require "logger"

# This class manages the file watcher, pig server, and web server and how they
# all interact together
class Mortar::Local::Watcher
  include Mortar::Local::InstallUtil

  WATCHER_LOG_FILE = "watchtower-watcher.log"

  # Public: Initialize the watcher utility
  #
  # project_root_path
  #
  # Returns a Watcher object
	def initialize(project_root_path)
    @project_root_path = project_root_path

    @log ||= Logger.new("#{local_log_dir}/#{WATCHER_LOG_FILE}")
    @log.level = Logger::DEBUG
	end

  # Public: Starts up the file watcher calling the block everytime a
  # file is changed
  #
  # &block - block called on file change
  #
  # Returns Nothing
	def watch(&block)

    # Startup File Watcher
    script_changed = lambda { |modified, added, removed|

      @log.debug "File(s) changed! - #{modified.join(", ")}" unless (modified.nil? || modified.empty?)
      @log.debug "File(s) added! - #{added.join(", ")}" unless (added.nil? || added.empty?)
      @log.debug "File(s) removed! - #{removed.join(", ")}" unless (removed.nil? || removed.empty?)

      block.call(modified, added, removed)
    }

    pig_listener = Listen.to(@project_root_path,
       :filter => /(udfs|macros|pigscripts).*/,
       :ignore => /^\..*$/)

    pig_listener.change(&script_changed)
    pig_listener.start

	end
end

