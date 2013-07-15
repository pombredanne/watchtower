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

require 'sinatra/base'
require 'sinatra/async'
require 'thin'

module Sinatra
  module Pollers
    POLLER_TYPES = [:file_watchers, :illustrate_watchers]

    def self.registered(app)
      POLLER_TYPES.each do |poller|
        app.set poller, []
      end
    end

    # Public: Notify a given poller that something has happened
    #
    # poller_type - one of the POLLER_TYPES symbol
    # *args - the arguments to be passed to the poller
    # 
    # Returns nothing.
    def notify(poller_type, *args)
      self.settings.send(poller_type).each do |poller|
        poller.call(*args)
      end
      self.set poller_type, []
    end
  end

  register Pollers
end

class Server < Sinatra::Base
  register Sinatra::Async
  register Sinatra::Pollers

  # Load the basic page 
  get '/' do
    @illustrate_templates = File.read(settings.resource_locations["illustrate_template"]).to_s
    @error_templates = File.read(settings.resource_locations["error_template"]).to_s
    erb File.read(settings.resource_locations["index"]).to_s
  end

  # Ping pong
  get '/ping' do
    body { 'pong' } 
  end

  # Public: Returns the illustrate results if they're available
  # otherwise waits asynchronously waits until results are available.
  #
  # Returns illustrate json (eventually)
  aget '/illustrate-results.json' do
    if settings.grunt.illustrating? or settings.illustrate_data == nil
      settings.illustrate_watchers << lambda { |data|
        body { data }
      }
    else
      body { settings.illustrate_data }
    end
  end

  # Public: Asynchronously waits for the script to change
  #
  # Returns a JSON object
  aget '/wait-for-change.json' do
    settings.file_watchers << lambda { 
      body { '{ "changed" : "Yup" }'}
    }
  end
end

# Globally set certain server attributes
Server.set :public_folder, File.expand_path("../../../../../" ,__FILE__)
Server.set(:resource_locations, {
  "index" => File.expand_path("../../../../../templates/illustrate-live.html", __FILE__),
  "illustrate_template" => File.expand_path("../../../../../templates/underscore/illustrate.html", __FILE__),
  "error_template" => File.expand_path("../../../../../templates/underscore/error.html", __FILE__)
})

Server.set :illustrate_data, nil
