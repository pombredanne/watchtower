var Mortar = Mortar || {};
(function(Mortar) {
  Mortar.IllustrateWatcher = (function() {
    var stopSignaled = false
        , on_success = null 
        , on_failure = null 
        , work_started = null 
        , work_finished = null 
        , connection_lost = null;

    // Default error function
    var error_func = function() {
      connection_lost && connection_lost();
    };

    // Internal: Pinger to check if server is still alive
    var pinger = function(alive_cb) {
      $.ajax({ 
        url: "/ping",
        success: function() {
          alive_cb();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // Server Dead
        },
        timeout: 30000 
      });
    };

    // Internal: Wait poller continually polls the server for changes
    var wait_poller = function() {
      if(stopSignaled) {
        return
      }
      $.ajax({ 
        url: "/wait-for-change.json",
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
            error_func();
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
      // Start the file watcher
      start : function() {
        stopSignaled = false;
        get_illustrate();
        wait_poller();
      },
      // Stop the file watcher
      stop : function() {
        stopSignaled = true;
      }
    }
  })();
})(Mortar);
