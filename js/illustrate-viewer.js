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
    /* Internal: Merge the illustrate data with the raw script into
     * a better data structure for dealing with in the controller and view.
     *
     * script - Raw text of the script
     * tables - The illustrate data tables given by pig
     *
     * Throws error if script doesn't match up with tables
     *
     * Returns Array [ { alias :, text:, tables: }...]
     */
    var generateSplits = function(script, tables) {
      var statements = Mortar.Parser.getStatements(script)
          , splits = [];
      
      var extractTable = function(alias) {
        for(var index in tables) {
          if(tables[index]['alias'] == alias) {
            return tables.splice(index, 1)[0];
          }
        }
        throw "Cannot find alias " + alias + "in the tables"
      };

      var cursorPosition = 0;
      for(var index in statements) {
        var newCursorPosition = script.indexOf(statements[index]) + statements[index].length;
        var text = script.substring(cursorPosition, newCursorPosition);
        var current_alias = Mortar.Parser.getAlias(statements[index]);

        var data_tables = [];

        var innerAliases = Mortar.Parser.getNestedAliases(text); 
        if(innerAliases && innerAliases.length > 0) {
          for(var jindex in innerAliases) {
            try {
              data_tables.push(extractTable(current_alias + "." + innerAliases[jindex]));
            } catch(err) {
              console.error("Could not find illustrate data for alias: " + current_alias + ". Skipping the alias");
            }
          }
        }

        try {
          // Always make sure the dominant table is at the front
          // Pig returns tables in order of execution completion.
          // The dominant alias (not nested) will be last. We want
          // it to be first because that's the order the alias is shown
          // in the text of the script.
          data_tables.unshift(extractTable(current_alias));
        } catch(err) {
          console.error("Could not find illustrate data for alias: " + current_alias + ". Skipping the alias");
        }

        splits.push({
          alias : current_alias,
          text : Mortar.Parser.highlightAlias(text, index),
          tables : data_tables,
        });

        cursorPosition = newCursorPosition + 1;
      }

      if(cursorPosition < script.length) {
        splits.push({
          alias : null,
          text : script.substring(cursorPosition),
          table : null,
        });
      }

      return splits;
    };

    var clickTableHeader = function(e) {
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
    
    var clickAlias = function() {
      if($(this).hasClass('active')) { return; }
      var statement_index = $(this).data('statement');
      var alias_index = $(".alias[data-statement=" + statement_index + "]").index(this);
      $(".alias[data-statement=" + statement_index + "].active").removeClass("active");
      $(this).addClass('active');
      $("tr[data-statement="+ statement_index +"] table.illustrate-data.selected").removeClass("selected");
      $("tr[data-statement="+ statement_index +"] table.illustrate-data").eq(alias_index).addClass("selected");
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
          if(splits[i]) {
            if($(elem).hasClass("preview")) {
              splits[i]['state'] = "preview";
            } else if($(elem).hasClass("selected")) {
              splits[i]['state'] = "selected";
            } else {
              splits[i]['state'] = "collapsed";
            }
          }
        });
        var illustrate_html = _.template($("#template_illustrate").html())({
          splits: splits,
          udf_output : illustrate_data['udf_output'],
        });
        $("#illustrate_content").html(illustrate_html);

        $.mortarTableExpandableCell("delete_all");
        var cell_hover = function() {
          if(!Mortar.Util.isScrolling() && !$(this).hasClass('active')) {
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
        $('table.illustrate-data thead').click(clickTableHeader);
        $('span.alias').click(clickAlias);
      },
    }
  })();
})(Mortar);
