var assert = require("assert");
var Mortar = Mortar || {};
Mortar.Parser = require("../js/parser.js").Parser;

describe('Mortar.Parser', function() {

  describe('isAlias', function() {
    it('should detect alias', function() {
      var result = Mortar.Parser.isAlias("uri_counts_by_date = GROUP uri_date_counts BY group.date;");
      assert.equal(true, result);
    });

    it('should detect alias with comments', function() {
      var script =  "-- This is a test comment\n"
                  + "/**\n" 
                  + " * This is a test comment\n"
                  + " */\n"
                  + "uri_counts_by_date = GROUP uri_date_counts BY group.date;\n"
      assert.equal(true, Mortar.Parser.isAlias(script));
    });
  });

  describe('getAlias', function() {
    it('should get the proper alias', function() {
      var result = Mortar.Parser.getAlias("uri_counts_by_date = GROUP uri_date_counts BY group.date;");
      assert.equal("uri_counts_by_date", result);
    });

    it('should get alias with comments', function() {
      var script =  "-- This is a test comment\n"
                  + "/**\n" 
                  + " * This is a test comment\n"
                  + " */\n"
                  + "uri_counts_by_date = GROUP uri_date_counts BY group.date;\n"
      assert.equal("uri_counts_by_date", Mortar.Parser.getAlias(script));
    });
  });

  describe('getStatements', function() {
    it('should get the flat statements', function() {
      var script =  "-- This is a test comment\n"
                  + "/**\n" 
                  + " * This is a test comment\n"
                  + " */\n"
                  + "uri_counts_by_date = GROUP uri_date_counts BY group.date;\n"
                  + "\n"
                  + "-- Comment at end of script\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "\n"
                  + "-- Comment at end of script\n"
                  + "\n"
                  + "\n"

      var first_statement = "uri_counts_by_date = GROUP uri_date_counts BY group.date;"

      var second_statement = "test = FOREACH derp GENERATE bar;"

      var statements = Mortar.Parser.getStatements(script);
      assert.equal(statements.length, 2);
      assert.equal(statements[0], first_statement);
      assert.equal(statements[1], second_statement);
    });

    it('should get the statements with nested foreach', function() {
      var script =  "-- This is a test comment\n"
                  + "/**\n" 
                  + " * This is a test comment\n"
                  + " */\n"
                  + "uri_counts_by_date = FOREACH {\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "GENERATE bar;\n"
                  + "}\n"
                  + "\n"
                  + "-- Comment at end of script\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "\n"
                  + "-- Comment at end of script\n"
                  + "\n"
                  + "\n"

      var first_statement = "uri_counts_by_date = FOREACH {\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "test = FOREACH derp GENERATE bar;\n"
                  + "GENERATE bar;\n"
                  + "}"

      var second_statement = "test = FOREACH derp GENERATE bar;"

      var statements = Mortar.Parser.getStatements(script);
      assert.equal(statements.length, 2);
      assert.equal(statements[0], first_statement);
      assert.equal(statements[1], second_statement);
    });
  });

  describe("getNestedAliases", function() {
    it('should get inner aliases with comments', function() {
      var nestedStatement = "-- This is a comment\n"
                  + "derp = FOREACH {\n"
                  + "alias_one = FILTER derp BY 10;\n"
                  + "-- This is another comment\n"
                  + "alias_two = FILTER derp BY 10;\n"
                  + "GENREATE alias_one;"
                  + "};"
      var innerAliases = Mortar.Parser.getNestedAliases(nestedStatement);
      assert.equal(innerAliases.length, 2);
      assert.equal('alias_one', innerAliases[0]);
      assert.equal('alias_two', innerAliases[1]);
    });
  });
});
