## Mortar Watchtower

Mortar Watchtower is a plugin for the [Mortar Gem](https://github.com/mortardata/mortar). It provides instant feedback about what is happening in your Pig script. On save, Mortar Watchtower will illustrate your data and feed the results to a local webpage.

### Installation ###

Before getting started make sure you already have [Mortar installed](http://help.mortardata.com/reference/mortar_project_reference/install_mortar_development_framework).

```
$ gem install bundler
$ mortar plugins:install https://github.com/mortardata/watchtower.git
```

### Usage ###

To start watching a script:

```
$ mortar watch SCRIPT_NAME
```

### Example Usage ###

Here's a quick walk through of how you can use Watchtower once you've installed Mortar and the Watchtower plugin.  

To get started you need a Mortar project.  For this example we're going to use the Mortar example project in Github. To create your project just clone the github repo and register the project with the Mortar service:

```
git clone git@github.com:mortardata/mortar-examples.git
cd mortar-examples
mortar projects:register mortar-examples
```

This repository contains a fully working Mortar project with almost a dozen different example Pig scripts.  For this example we're going to use a script that analyzes twitter data to find out which US states are the biggest coffee snobs.  To look at this script open *pigscripts/coffee_tweets.pig* in your favorite editor.  If you're having a hard time understanding what the script is doing, don't worry, Watchtower will help!  So let's try it out.  Open a second terminal and go to your Mortar project directory.  To start Watchtower do:

```
mortar watch pigscripts/coffee_tweets.pig -f params/coffee_tweets/local.small.params
```

Once Watchtower is up and running you will have a page opened in your browser showing the coffee_tweets script where each alias is accompanied by a table demonstrating the data that makes up that alias.  In this table you can click the table header to expand or collapse the table and you can click on individual cells to see the full data of a field.  Now reading through the script is much easier as you can see exactly how each Pig statement is transforming your data.

If you side-by-side your Mortar project code editor and Watchtower (either split screen or on separate monitors) you can easily make changes to your code while at the same time seeing the immediate effects of your changes in Watchtower.

If you scroll down the page to the **coffee_tweets** alias on line 34, you'll notice a common problem when working with a small subset of your data.  None of the tweets in the data we're using are about coffee!  The **is_coffee_tweet** field is 0 for all of our rows.  Let's change that.

Back in your first terminal use your favorite editor to open udfs/python/coffee.py.  This is the file where we keep our Python udf that determines if a tweet is about coffee or not.  Our logic here is pretty simple - if the tweet contains one of the phrases in **COFFEE_SNOB_PHRASES** we consider the tweet about coffee.  We're going to modify this method so that it considers one of our example tuples to be about coffee.  Looking at our data we see we have a tweet that has the word *poolside* in it.  So go ahead and add that phrase to **COFFEE_SNOB_PHRASES**.  So at the start of *udfs/python/coffee.py* you should have:

```
COFFEE_SNOB_PHRASES = set((\
    'espresso', 'cappucino', 'macchiato', 'latte', 'cortado', 'pour over', 'barista',
    'flat white', 'siphon pot', 'woodneck', 'french press', 'arabica', 'chemex',
    'frothed', 'la marzocco', 'mazzer', 'la pavoni', 'nespresso', 'rancilio silvia', 'hario',
    'intelligentsia', 'counter culture', 'barismo', 'sightglass', 'blue bottle', 'stumptown',
    'single origin', 'coffee beans', 'coffee grinder', 'lavazza', 'coffeegeek', 'poolside'\
))
```

Once you save that change, switch back to your browser.  Looking at the **coffee_tweets** alias notice that we now have a data tuple that has a 1 in it for **is_coffee_tweet**.  Watchtower is always watching your Mortar project and as changes are made to files its automatically updating the browser window with the latest code and data. Watchtower also watches your local data for changes, so we could have have edited our sample data to include a word from **COFFEE_SNOB_PHRASES** to achieve the same result.

Watchtower will also give you immediate feedback on many errors you make during development.  Go back to /udfs/python/coffee.py, delete line 3, save, and go back to your browser.  Watchtower catches the error and points you to the problem with a red error message at the top of the page.  Go back to the file and undelete line 3 and Watchtower will quickly pick up the change and display your script again.

When we ran Watchtower above we provided it a parameter file params/coffee_tweets_local.small.params.  This file told our Pig script to use a small local dataset of 3 tweets.  When using Watchtower it can often be helpful to have a small local dataset that you use during development.  However, Watchtower can also work against data that is stored in S3.  Go back to where you have Watchtower running and use CTRL+C to stop it.  Now we're going to restart it using the default parameters in our script:

```
mortar watch pigscripts/coffee_tweets.pig
```

Looking at the browser results you'll see it looks very similar to before except now we have more data and its coming from Mortar's example twitter data in S3.

And thats it!  As you can see Watchtower is a very powerful tool for understanding exactly what's happening with your data and your Pig script.


### Development ###

To run the javascript unit tests, open:
```
test/index.html
```

To help develop Mortar Watchtower, make sure you have the latest version of the Mortar Gem. Then clone this repo and run:

```
$ rake watch
```

This will start a file watcher over the Mortar Watchtower repo, any changes will cause the rake script to reinstall the plugin. If for whatever reason your installation of Mortar Watchtower breaks, you can uninstall it by running:

```
$ rake clean
```

### Known Issues ###

* Watchtower hangs for up to 30 seconds when exiting on Ruby 1.8.7. This has something to do with the Thin server not closing out the connections. We've tried using our own signal trapping, but it doesn't seem to work.
