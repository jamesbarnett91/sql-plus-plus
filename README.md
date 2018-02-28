# SQL++
[![Build Status](https://travis-ci.org/jamesbarnett91/sql-plus-plus.svg?branch=master)](https://travis-ci.org/jamesbarnett91/sql-plus-plus)

A simple cross platform SQL editor and statement runner.
Currently for Postgres only, but MySQL and Oracle support planned.

<p align="center">
  <img alt="VS Code in action" src="https://james-barnett.net/files/spp/screenshots/app2.png">
</p>

# Features
- Rich editor features. Syntax highlighting, autocomplete, bracket matching etc.
- Cross platform. Linux (.deb), Windows and MacOS binaries available.
- Simple editor interface. Doesn't have a huge array of GUI features like pgAdmin or Toad. For people who prefer a clean way to edit and run SQL.
- Sortable and resizable query results table.

# Installation
Download one of the binary distributions from the releases page.
Or, to run locally:
```sh
$ git clone https://github.com/jamesbarnett91/sql-plus-plus && cd sql-plus-plus
$ npm install
$ npm start
```

# Roadmap
- [x] Store connection config
- [x] Handle multiple simultaneous connections
- [ ] Add schema tree view (listing tables>columns, packages, sequences etc.)
- [ ] Load/Save .sql files
- [ ] Improve autocomplete to be more schema aware
- [ ] Support MySQL
- [ ] Support Oracle
- [ ] Save and display query history
- [ ] CSV download of query results
- [ ] 'Interpreter' mode. Run single queries with a CLI type interface (like Postgres psql and Oracle SQL*Plus)
- [ ] Build .rpms

# Note
This is just a personal project, and a work in progress. There might be a few bugs in the result parsing, so don't rely on it for anything important unless you enjoy living on the edge.

Connection details (including passwords) are stored encrypted, but the key is in the source code so it's only a basic level of obfuscation. I wouldn't connect to any prod databases with this.