var Mortar = Mortar || {};

(function(Mortar) {
  Mortar.Parser = (function() {

    var removeComments = function(text) {
      return text.replace(/\/\*([\s\S]*?)\*\//g, '').replace(/--.*/g, '');
    };
    var getStatements = function(text) {
      return removeComments(text).match(/(\w+)\s*=(.*({[^}]*});?|[^;]*;).*/g);
    };

    return {
      isAlias : function(text) {
        return !! text.match(/\s*(\w+)\s*=.*/);
      },
      getAlias : function(text) {
        return text.match(/\s*(\w+)\s*=.*/)[1];
      },
      highlightAlias : function(text, alias_index) {
        var statements = getStatements(text);
        for(var i in statements) {
          text = text.replace(
            statements[i],
            statements[i].replace(/(\s*)(\w+)(\s*=.*)/g, 
              "$1<span data-statement=\"" + alias_index + "\" class=\"alias\">$2</span>$3")
            );
        }
        return text.replace(/<span (.*) class="alias">(\w+)<\/span>/,"<span $1 class=\"alias active\">$2</span>");
      },
      getStatements : getStatements,
      getNestedAliases : function(text) {
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
      },
    };
  })();
})(Mortar);

if (typeof module !== 'undefined' && module.exports != null) {
    exports.Parser = Mortar.Parser;
}
