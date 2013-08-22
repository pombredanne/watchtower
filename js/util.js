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
  Mortar.Util = (function() {
    return {

      /* Public: Truncate the given text to the maximum number of characters
       *
       * text - The text to be truncated
       * max_num_chars - Maximum number of character
       * token - The token by which the truncation should be shown (default: ...)
       */
      truncate : function(text, max_num_chars, token) {
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
      },
      /* Public: Truncate the error message to point to the logs
       *
       * error_message - String error message
       */
      truncateErrorMessage : function(error_message) {
        var split = error_message.split("\n");
        if(split.length - 1 > 4) {
          return error_message.split("\n").slice(0, 4).join("\n") 
                  + "\n\nFull error logged in "
                  + Mortar.project_root + "/logs/local-pig.log";
        } else {
          return error_message;
        }
      },

      /* Public: A function to be called when the pages stops scrolling
       *
       * note: events are debounced by SCROLL_STOP_DELAY milliseconds
       *
       * cb - the function to be called
       */
       onScrollStop : (function() {
        var SCROLL_STOP_DELAY = 150;
        var callbacks = [];

        var debounced_stop = _.debounce(function(e) {
          $("body").addClass("not-scrolling");
          for(var i = 0, length = callbacks.length; i < length; i++) {
            callbacks[i](e);
          }
        }, SCROLL_STOP_DELAY);

        $(document).scroll(function(e) {
          if($("body").hasClass("not-scrolling")) {
            $("body").removeClass("not-scrolling");
          }
          debounced_stop(e);
        });

        return function(cb) {
          callbacks.push(cb);
        };
      })(),

      /* Public: Checks if body element is scrolling
      *
      * Returns boolean.
      */
      isScrolling : function() {
        return !$("body").hasClass("not-scrolling")
      },

      /* Public: Scroll to bottom of document
       */
      scrollToBottom : function() {
        $('body').delay(200).animate({
          scrollTop: $('body').height()
        }, {
          duration : 1500,
          easing: 'swing'
        });
      }
    };
  })();
})(Mortar);
