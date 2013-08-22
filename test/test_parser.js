
test('isAlias - should detect alias', function() {
  var result = Mortar.Parser.isAlias("uri_counts_by_date = GROUP uri_date_counts BY group.date;");
  equal(true, result);
});

test('isAlias - should detect alias with comments', function() {
  var script =  "-- This is a test comment\n"
              + "/**\n" 
              + " * This is a test comment\n"
              + " */\n"
              + "uri_counts_by_date = GROUP uri_date_counts BY group.date;\n"
  equal(true, Mortar.Parser.isAlias(script));
});

test('getAlias - should get the proper alias', function() {
  var result = Mortar.Parser.getAlias("uri_counts_by_date = GROUP uri_date_counts BY group.date;");
  equal("uri_counts_by_date", result);
});

test('getAlias - should get alias with comments', function() {
  var script =  "-- This is a test comment\n"
              + "/**\n" 
              + " * This is a test comment\n"
              + " */\n"
              + "uri_counts_by_date = GROUP uri_date_counts BY group.date;\n"
  equal("uri_counts_by_date", Mortar.Parser.getAlias(script));
});

test('getStatements - should get the flat statements', function() {
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
  equal(statements.length, 2);
  equal(statements[0], first_statement);
  equal(statements[1], second_statement);
});

test('getStatements - should get the statements with nested foreach', function() {
  var script =  "-- Sessionize the web messages\n"
              + " small_message = FOREACH (FILTER message by timestamp is not null) {\n"
              + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
              + "   };\n";
  
  var statement = "small_message = FOREACH (FILTER message by timestamp is not null) {\n"
              + "   GENERATE timestamp, ISOToUnix(timestamp) as unix_time, user_id;\n"
              + "   };";
  var statements = Mortar.Parser.getStatements(script);
  equal(statements.length, 1);
  equal(statements[0], statement);
});

test('getStatements - should not get messed up by multiple sets of comments', function() {
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
  equal(statements.length, 1);
  equal(statements[0], statement);
});

test('getNestedAliases - should get inner aliases with comments', function() {
  var nestedStatement = "-- This is a comment\n"
              + "derp = FOREACH {\n"
              + "alias_one = FILTER derp BY 10;\n"
              + "-- This is another comment\n"
              + "alias_two = FILTER derp BY 10;\n"
              + "GENREATE alias_one;"
              + "};"
  var innerAliases = Mortar.Parser.getNestedAliases(nestedStatement);
  equal(innerAliases.length, 2);
  equal('alias_one', innerAliases[0]);
  equal('alias_two', innerAliases[1]);
});

test('hightlightAlias - should not get messed up by comments', function() {
  var script = "-- This is test = Foobar; a comment\n"
              + "derp = FOREACH test GENERATE derp;\n";
  var expected = "-- This is test = Foobar; a comment\n"
              + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE derp;\n";
  var highlighted = Mortar.Parser.highlightAlias(script, 0);
  equal(highlighted, expected);
});

test('hightlightAlias - should not get messed up by block comments', function() {
  var script = "/*\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"
              + "derp = FOREACH test GENERATE derp;\n";
  var expected = "/*\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"
              + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE derp;\n";

  var highlighted = Mortar.Parser.highlightAlias(script, 0);
  equal(highlighted, expected);
});

test('hightlightAlias - should not get messed up by multiple sets of comments', function() {
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
  equal(highlighted, expected);
});

test('hightlightAlias - should not get messed up by comment inside literal string', function() {
  var script = "/**\n"
              + " * songs = LOCAL_SONGS_FILE();\n"
              + " */\n"
              + "-- This is test = Foobar; a comment\n"
              + "/**\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"
              + "derp = FOREACH test GENERATE '-- derp';\n";
  var expected = "/**\n"
              + " * songs = LOCAL_SONGS_FILE();\n"
              + " */\n"
              + "-- This is test = Foobar; a comment\n"
              + "/**\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"
              + "<span data-statement=\"0\" class=\"alias active\">derp</span> = FOREACH test GENERATE '-- derp';\n";

  var highlighted = Mortar.Parser.highlightAlias(script, 0);
  equal(highlighted, expected);
});

test('hightlightAlias - should not get messed up by block comment inside literal string', function() {
  var script = "/**\n"
              + " * songs = LOCAL_SONGS_FILE();\n"
              + " */\n"
              + "-- This is test = Foobar; a comment\n"
              + "logs = FILTER raw_logs BY (cs_uri matches '/www-origin.warbyparker.com(/|/(eye|sun)glasses/(men|women)/*).*');\n"
              + "/**\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"
  var expected = "/**\n"
              + " * songs = LOCAL_SONGS_FILE();\n"
              + " */\n"
              + "-- This is test = Foobar; a comment\n"
              + "<span data-statement=\"0\" class=\"alias active\">logs</span> = FILTER raw_logs BY (cs_uri matches '/www-origin.warbyparker.com(/|/(eye|sun)glasses/(men|women)/*).*');\n"
              + "/**\n"
              + " * This is test = Foobar; a comment\n"
              + " */\n"

  var highlighted = Mortar.Parser.highlightAlias(script, 0);
  equal(highlighted, expected);
});
