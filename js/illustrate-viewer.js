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
  Mortar.IllustrateViewer = (function() {
    var isAlias = function(text) {
      return !! text.match(/\s*(\w+)\s*=.*/);
    };
    var getAlias = function(text) {
      return text.match(/\s*(\w+)\s*=.*/)[1];
    };
    var highlightAlias = function(text) {
      return text.replace(/(\s*)(\w+)(\s*=.*)/, "$1<span class=\"alias\">$2</span>$3");
    };
    
    /* Internal: Merge the illustrate data with the raw script into
     * a better data structure for dealing with in the controller and view.
     *
     * script - Raw text of the script
     * tables - The illustrate data tables given by pig
     *
     * Throws error if script doesn't match up with tables
     *
     * Returns Array [ { alias :, text:, table: }...]
     */
    var generateSplits = function(script, tables) {
      var statements = script.split(";")
          , splits = []
          , tindex = 0;

      // Added the ';' back to the statements
      for(var index = 0, length = statements.length; index < length - 1; index++) {
        statements[index] += ";";
      }

      var currentSplitText = "";
      for(var index in statements) {
        if(isAlias(statements[index])) {
          var current_alias = getAlias(statements[index]);
          var table = tables[tindex];

          // Sanity check to make sure the aliases match
          if(table['alias'] != current_alias) {
            throw "Uhoh! Illustrate data and script don't seem to match";
          }

          splits.push({
            alias : current_alias,
            text : highlightAlias(currentSplitText + statements[index]),
            table : table,
          });

          tindex++;
          currentSplitText = "";
        }
        else {
          currentSplitText += statements[index];
        }
      }

      if(currentSplitText != null && currentSplitText != "") {
        splits.push({
          alias : null,
          text : currentSplitText,
          table : null,
        });
      }

      return splits;
    };

    var clickAlias = function(e) {
      var container = $(this).closest('.inline-illustrate-data');
      var num_elements = $(container).find('tbody tr').length;

      // Number taken from illustrate.css
      if(num_elements <= 7) {
        if($(container).hasClass("preview")) {
          $(container).removeClass("preview");
        } else if($(container).hasClass("selected")) {
          $(container).removeClass("selected");
        } else {
          $(container).addClass("selected");
        }
      } else {
        if($(container).hasClass("preview")) {
          $(container).removeClass("preview").addClass("selected");
        } else if($(container).hasClass("selected")) {
          $(container).removeClass("selected");
        } else {
          $(container).addClass("preview");
        }
      }

    };

    // When the document has stopped scrolling 
    // updated the last hovered object just in case the
    // cursor is still hovering it.
    var _lastHoveredCell = null;
    Mortar.Util.onScrollStop(function(e) {
      $(_lastHoveredCell).css('height', $(_lastHoveredCell).height());
    });
    
    return {
      /* Public: Update the current illustrate viewer with 
       * new illustrate data.
       *
       * illustrate_data - Illustrate data given from the server
       */
      update : function(illustrate_data) {
        var splits = generateSplits(illustrate_data['script'], illustrate_data['tables']);
        // Perserve state by order
        $("tr.inline-illustrate-data").each(function(i, elem) {
          if($(elem).hasClass("preview")) {
            splits[i]['state'] = "preview";
          } else if($(elem).hasClass("selected")) {
            splits[i]['state'] = "selected";
          } else {
            splits[i]['state'] = "collapsed";
          }
        });
        var illustrate_html = _.template($("#template_illustrate").html())({
          splits: splits,
          udf_output : illustrate_data['udf_output'],
        });
        $("#illustrate_content").html(illustrate_html);

        $.mortarTableExpandableCell("delete_all");
        var cell_hover = function() {
          if(!Mortar.Util.isScrolling()) {
            $(this).css('height', $(this).height());
          } else {
            // Set the lastHoveredCell variable, so it's height will be set 
            // when scrolling stops
            _lastHoveredCell = this;
          }
        };
        var cell_clicked = function() {
          $(this).mortarTableExpandableCell('open');
        };
        $('table.illustrate-data td.mortar-table-expandable-cell').each(function() {
          $(this).click(cell_clicked);
          $(this).hover(cell_hover);
        });
        $('table.illustrate-data thead').click(clickAlias);
      },
    }
  })();
})(Mortar);
