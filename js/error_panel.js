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
  Mortar.ErrorPanel = (function() {
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
})(Mortar);
