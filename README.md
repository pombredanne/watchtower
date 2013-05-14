## Mortar Watchtower

Mortar Watchtower is a plugin for the [Mortar Gem](https://github.com/mortardata/mortar). It provides instant feedback about what is happening in your pigscript. On save, Mortar Watchtower will illustrate your data and feed the results to a local webpage.

### Installation ###

```
$ mortar plugins:install git@github.com:mortardata/watchtower.git
```

### Usage ###

To start watching a script:

```
$ mortar local:watch SCRIPT_NAME
```

### Development ###

To help develop Mortar Watchtower, make sure you have the latest version of the Mortar Gem. Then clone this repo and run:

```
$ rake watch
```

This will start a file watcher over the Mortar Watchtower repo, any changes will cause the rake script to reinstall the plugin. If for whatever reason your installation of Mortar Watchtower breaks, you can uninstall it by running:

```
$ rake clean
```
