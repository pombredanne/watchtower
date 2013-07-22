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
      var script =  "-- Sessionize the web messages\n"
                  + " small_message = FOREACH (FILTER message by timestamp is not null) {\n"
                  + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
                  + "   };\n";
      
      var statement = "small_message = FOREACH (FILTER message by timestamp is not null) {\n"
                  + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
                  + "   };";
      var statements = Mortar.Parser.getStatements(script);
      assert.equal(statements.length, 1);
      assert.equal(statements[0], statement);
    });

    it('should not get messed up by multiple sets of comments', function() {
      var script = "/**\n"
                  + " * songs = LOCAL_SONGS_FILE();\n"
                  + " */\n"
                  + "-- This is test = Foobar; a comment\n"
                  + "/**\n"
                  + " * This is test = Foobar; a comment\n"
                  + " */\n"
                  + "small_message = FOREACH (FILTER message by timestamp is not null) {\n"
                  + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
                  + "   };";

      var statement = "small_message = FOREACH (FILTER message by timestamp is not null) {\n"
                  + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
                  + "   };";
      var statements = Mortar.Parser.getStatements(script);
      assert.equal(statements.length, 1);
      assert.equal(statements[0], statement);
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

  describe("hightlightAlias", function() {
    it('should not get messed up by comments', function() {
      var script = "-- This is test = Foobar; a comment\n"
                  + "derp = FOREACH test GENERATE derp;\n";
      var expected = "-- This is test = Foobar; a comment\n"
                  + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE derp;\n";
      var highlighted = Mortar.Parser.highlightAlias(script, 0);
      assert.equal(highlighted, expected);
    });

    it('should not get messed up by block comments', function() {
      var script = "/*\n"
                  + " * This is test = Foobar; a comment\n"
                  + " */\n"
                  + "derp = FOREACH test GENERATE derp;\n";
      var expected = "/*\n"
                  + " * This is test = Foobar; a comment\n"
                  + " */\n"
                  + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE derp;\n";

      var highlighted = Mortar.Parser.highlightAlias(script, 0);
      assert.equal(highlighted, expected);
    });

    it('should not get messed up by multiple sets of comments', function() {
      var script = "/**\n"
                  + " * songs = LOCAL_SONGS_FILE();\n"
                  + " */\n"
                  + "-- This is test = Foobar; a comment\n"
                  + "/**\n"
                  + " * This is test = Foobar; a comment\n"
                  + " */\n"
                  + "derp = FOREACH test GENERATE derp;\n";
      var expected = "/**\n"
                  + " * songs = LOCAL_SONGS_FILE();\n"
                  + " */\n"
                  + "-- This is test = Foobar; a comment\n"
                  + "/**\n"
                  + " * This is test = Foobar; a comment\n"
                  + " */\n"
                  + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE derp;\n";

      var highlighted = Mortar.Parser.highlightAlias(script, 0);
      assert.equal(highlighted, expected);
    });
  });
});
