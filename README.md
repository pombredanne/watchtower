## Mortar Watchtower

Mortar Watchtower is a plugin for the [Mortar Gem](https://github.com/mortardata/mortar). It provides instant feedback about what is happening in your pigscript. On save, Mortar Watchtower will illustrate your data and feed the results to a local webpage.

### Installation ###

```
$ mortar plugins:install https://github.com/mortardata/watchtower.git
```

You also need to make sure you have bundler installed:

```
$ gem install bundler
```

### Usage ###

To start watching a script:

```
$ mortar watch SCRIPT_NAME
```

### Development ###

To run the javascript unit tests, run:
```
$ rake test
```
Note this requires you have mocha installed:
```
npm install -g mocha
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
