require 'sinatra/base'
require 'sinatra/async'
require 'thin'

class Server < Sinatra::Base
  register Sinatra::Async

  # Trap and close connections
  trap("INT") do
    puts "INT"
    display "Closing open connections"
    Server.settings.file_watchers.each do |conn|
      conn.call()
    end
    Server.settings.illustrate_connections.each do |conn|
      conn.call('{ "connection" : "closed" }')
    end

    Thin::Sever.stop()
    EM.stop
  end

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
    if settings.is_illustrating or settings.illustrate_data == nil
      settings.illustrate_connections << lambda { |data|
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

Server.set :is_illustrating, false
Server.set :illustrate_queued, false
Server.set :illustrate_data, nil

# asynchrnous connections, Array of procs and lambdas
Server.set :illustrate_connections, []
Server.set :file_watchers, []
