var Mortar = Mortar || {};

(function(Mortar) {
  Mortar.Parser = (function() {
    return {
      isAlias : function(text) {
        return !! text.match(/\s*(\w+)\s*=.*/);
      },
      getAlias : function(text) {
        return text.match(/\s*(\w+)\s*=.*/)[1];
      },
      highlightAlias : function(text, alias_index) {
        return text
            .replace(/(\s*)(\w+)(\s*=.*)/g, "$1<span data-statement=\"" + alias_index + "\" class=\"alias\">$2</span>$3")
            .replace(/<span (.*) class="alias">(\w+)<\/span>/,"<span $1 class=\"alias active\">$2</span>");
      },
      getStatements : function(text) {
        var statements = text.match(/\s*(\w+)\s*=([\w\s]*({[^}]*});?|[^;]*;)/g);
        for(var index in statements) {
          statements[index] = statements[index].trim();
        }
        return statements;
      },
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
