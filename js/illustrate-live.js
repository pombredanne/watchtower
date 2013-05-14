//$('.illustrate_table td').mortarTableExpandableCell();
// TODO: get this working
/*
$('.illustrate_table td .clipboard').each(function() {
   $(this).data('clippy',  new ZeroClipboard( $(this), {
        moviePath: "resources/flash/zeroclipboard.swf"
    })); 
});
*/

var truncate_center = function(text, max_num_chars, token) {
  var token = typeof token !== 'undefined' ? token : " ... ";
  
  var text_length = text.length;
  if (text_length <= max_num_chars) {
      return text;
  }

  var num_chars_to_remove = text_length + token.length - max_num_chars;
  var mid_point = (text_length > 1) ? Math.floor(text_length / 2) : 1;
  var left_chars_to_remove = Math.floor(num_chars_to_remove / 2);
  var right_chars_to_remove = num_chars_to_remove - left_chars_to_remove;
  return text.slice(0, mid_point - left_chars_to_remove) +
      token +
      text.slice(mid_point + right_chars_to_remove);
};


var illustrate_watcher = (function() {
  var stopSignaled = false;
  var on_success = null;
  var on_failure = null;
  var work_started = null;
  var work_finished = null;
  var connection_lost = null;
  var error_func = function() {
    connection_lost && connection_lost();
  };


  var wait_poller = function() {
    if(stopSignaled) {
      return
    }
    $.ajax({ 
      url: "/wait-for-change.json",
      success: function() {
        get_illustrate();
        wait_poller();
      },
      dataType: "json",
      error: function(jqXHR, textStatus, errorThrown) {
        // If wait-for-change times out, retry
        if(textStatus == "timeout") {
          wait_poller();
        } else {
          error_func();
        }
      },
      timeout: 30000 
    });
  };

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

var error_panel = (function() {
  return {
    showError : function(error_level, error_message, cb) {
      var error_html = _.template($("#template_error").html())({
        error_level : error_level,
        error_message : error_message
      });
      $("#error-container").html(error_html);
      $("#error-container > div").css('margin-top', -$("#error-container > div").outerHeight());
      $("#error-container > div").animate({'margin-top': 0}, cb);
    },
    clearError : function(cb) {
      $("#error-container > div").animate({'margin-top' : -$("#error-container > div").outerHeight()}, cb);
    }
  }
})();

$(document).ready(function() {
  preload = new Image()
  preload.src = "/images/caution.png"
  illustrate_watcher.onSuccess(function(data) {
    error_panel.clearError();
    var illustrate_html = _.template($("#template_illustrate").html())({
      result: data
    });
    $("#illustrate_content").html(illustrate_html);
    // Scroll to bottom of page
    window.scrollTo(0, document.body.scrollHeight);
    $('.illustrate_table td').mortarTableExpandableCell();
  });

  illustrate_watcher.onFailure(function(data) {
    error_panel.showError('error', data['error_message'] );
  });

  illustrate_watcher.workStarted(function() {
    $("#activity-monitor").show();
  });

  illustrate_watcher.workFinished(function() {
    $("#activity-monitor").hide();
  });

  illustrate_watcher.onConnectionLost(function() {
    error_panel.showError('warn', "Lost Connection to Local Pig Server!");
    $("#activity-monitor").hide();
  });
  illustrate_watcher.start();
});

