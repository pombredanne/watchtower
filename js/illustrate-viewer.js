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
    var highlightAlias = function(text, alias_index) {
      return text
          .replace(/(\s*)(\w+)(\s*=.*)/g, "$1<span data-statement=\"" + alias_index + "\" class=\"alias\">$2</span>$3")
          .replace(/<span (.*) class="alias">(\w+)<\/span>/,"<span $1 class=\"alias active\">$2</span>");
    };
    var getStatements = function(text) {
      return text.match(/\s*(\w+)\s*=[\s\w]*({[\s\S]*})?('[\s\S]*')?([^;]|[\r\n])*;/g);
    };
    var getNestedStatements = function(text) {
      try {
        var innerStatements = text
                .match(/\s*\w+\s*=[\s\S]*{([\s\S]*)}/)[1]
                .match(/\s*(\w+)\s*=.*/g);
        
        var innerAliases = [];
        for(var i in innerStatements) {
          innerAliases.push(innerStatements[i].replace(/\s*(\w+)\s*=.*/, "$1"));
        }
        return innerAliases;
      } catch(err) {
        return null;
      }
    };
    
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
      var statements = getStatements(script)
          , splits = []
          , tindex = 0;

      var cursorPosition = 0;
      for(var index in statements) {
        var newCursorPosition = script.indexOf(statements[index]) + statements[index].length;
        var text = script.substring(cursorPosition, newCursorPosition);
        var current_alias = getAlias(statements[index]);

        var data_tables = [];

        var innerAliases = getNestedStatements(text); 
        if(innerAliases) {
          for(var jindex in innerAliases) {
            // Make sure the aliases line up
            if(tables[tindex]['alias'] != current_alias + "." + innerAliases[jindex]) {
              throw "Uhoh! Illustrate data for nested alias and script don't seem to match";
            }
            data_tables.push(tables[tindex]);
            tindex++;
          }
        }

        // Make sure the aliases line up
        if(tables[tindex]['alias'] != current_alias) {
          throw "Uhoh! Illustrate data and script don't seem to match";
        }

        // Always make sure the dominant table is at the front
        // Pig returns tables in order of execution completion.
        // The dominant alias (not nested) will be last. We want
        // it to be first because that's the order the alias is shown
        // in the text of the script.
        data_tables.unshift(tables[tindex]);

        splits.push({
          alias : current_alias,
          text : highlightAlias(text, index),
          tables : data_tables,
        });

        cursorPosition = newCursorPosition;
        tindex++;
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
        var cell_clicked = function() {
          $(this).mortarTableExpandableCell('open');
        };
        $('table.illustrate-data td.mortar-table-expandable-cell').each(function() {
          $(this).click(cell_clicked);
        });
        $('table.illustrate-data thead').click(clickTableHeader);
        $('span.alias').click(clickAlias);
      },
    }
  })();
})(Mortar);
