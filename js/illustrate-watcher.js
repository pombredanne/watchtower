// 
//  Copyright 2013 Mortar Data Inc.
// 
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// 

var Mortar = Mortar || {};
(function(Mortar) {
  Mortar.IllustrateWatcher = (function() {
    var watching = false
        , on_success = null 
        , on_failure = null 
        , work_started = null 
        , work_finished = null 
        , connection_lost = null;

    // Default error function
    var error_func = function() {
      watching = false;
      connection_lost && connection_lost();
    };

    // Internal: Pinger to check if server is still alive
    var pinger = function(alive_cb) {
      $.ajax({ 
        url: "/ping",
        cache : false,
        success: function() {
          alive_cb();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          error_func();
        },
        timeout: 30000 
      });
    };

    // Internal: Wait poller continually polls the server for changes
    var wait_poller = function() {
      if(!watching) {
        return
      }
      $.ajax({ 
        url: "/wait-for-change.json",
        cache : false,
        success: function() {
          // Prevent Callstack size exceeded error
          setTimeout(function() {
            get_illustrate();
            wait_poller();
          }, 0);
        },
        dataType: "json",
        error: function(jqXHR, textStatus, errorThrown) {
          // Ping the server to check if dead
          pinger(wait_poller);
        },
        timeout: 30000 
      });
    };

    // Internal: Gets illustrate results. Notifies the proper
    // messaging channels when results are returned
    var get_illustrate = function() {
      work_started && work_started();
      $.ajax({ 
        url: "/illustrate-results.json",
        cache : false,
        success: function(data){
          if(data && data['error_message']) {
            on_failure && on_failure(data);
          }
          if(data && data['tables']) {
            on_success && on_success(data);
          }
          work_finished && work_finished();
        },
        dataType: "json",
        error : function(jqXHR, textStatus, errorThrown) {
          // If the illustrate times out, retry
          if(textStatus == "timeout") {
            get_illustrate();
          } else {
            pinger(get_illustrate);
          }
        },
        timeout: 30000 
      });
    };

    return {
      // When illustrates successfully
      onSuccess : function(func) {
        on_success = func;
      },
      // When illustrate starts
      workStarted : function(func) {
        work_started = func;
      },
      // When illustrate finishes
      workFinished: function(func) {
        work_finished = func;
      },
      // When illustrate failes
      onFailure : function(func) {
        on_failure = func;
      },
      // When connection to local Pig Server is lost
      onConnectionLost : function(func) {
        connection_lost = func;
      },

      // Manual check illustrate
      check : function() {
        get_illustrate();
      },
      
      // Start the file watcher
      start : function() {
        watching = true;
        get_illustrate();
        wait_poller();
      },
      // Stop the file watcher
      stop : function() {
        watching = false;
      }
    }
  })();
})(Mortar);
