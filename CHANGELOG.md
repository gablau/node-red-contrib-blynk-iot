# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2021-06-27

### Added
- Node - *Sync* - allow multiple pins send with "syncVirtual" mode. (separate multiple pins with comma)

### Fixed
- Recover accidentally deleted node Sync in package.json - See [Issue #3](https://github.com/gablau/node-red-contrib-blynk-iot/issues/3)
- Old email node not deleted in package.json - See [Issue #2](https://github.com/gablau/node-red-contrib-blynk-iot/issues/2)
- Right handle of socket close/end connection - See [Issue #1](https://github.com/gablau/node-red-contrib-blynk-iot/issues/1)

### Removed from old [Blynk legacy library](https://github.com/gablau/node-red-contrib-blynk-ws)
- Node - *Set Property* - removed "max/min" property

## 0.1.0 - 2021-06-26
### Added
- Implemented TLS connection.
- Add Template ID in configuration node
- Review Redirect command 

### Removed from old [Blynk legacy library](https://github.com/gablau/node-red-contrib-blynk-ws)
- Connection through WebSocket
- Removed unsupported node - * Notify *, * Email *, * Bridge *, * Table *
- Removed Proxy in configuration node  

[Unreleased]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/1.0.2...HEAD
[0.2.0]: https://github.com/gablau/node-red-contrib-blynk-ws/compare/0.1.0...0.2.0
