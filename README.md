# node-red-contrib-blynk-iot
![Information Panel](./docs/img/node-red-blynk.png)\
NEW Blynk IoT Platform library implementation for [Node-RED](https://nodered.org/)

[![npm version](https://img.shields.io/npm/v/node-red-contrib-blynk-iot.svg)](https://www.npmjs.com/package/node-red-contrib-blynk-iot)
[![Npm download](https://img.shields.io/npm/dm/node-red-contrib-blynk-iot.svg)](https://www.npmjs.com/package/node-red-contrib-blynk-iot)
[![GitHub stars](https://img.shields.io/github/stars/gablau/node-red-contrib-blynk-iot.svg)](https://github.com/gablau/node-red-contrib-blynk-iot/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/gablau/node-red-contrib-blynk-iot.svg)](https://github.com/gablau/node-red-contrib-blynk-iot/issues)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/gablau/node-red-contrib-blynk-iot/blob/master/LICENSE)

[![NPM](https://nodei.co/npm/node-red-contrib-blynk-iot.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/node-red-contrib-blynk-iot)

__________

## Warning: FOR TESTING ONLY
## This library is in beta, it is not stable yet!!
## Do not use for production
__________

## Node-RED <-> Blynk IoT Platform
This library supports both secure TLS connection to new Blynk IoT Platform cloud server.

For Blynk cloud server, you can use **blynk.cloud** as the server url.

**Local server is not yet supported.**

**Do not work on old Blynk 0.1 legacy platform**

If you installed Node Red globally use this command to install
```npm install --global node-red-contrib-blynk-iot```

### Supported events, commands and widgets

**Events:** read, write, app (connected/disconected)\
**Commands:** write, sync (virtual/all), set property\
**Widgets:** LCD, zeRGBa, styled button, image gallery

### Changelog

See the [changelog](CHANGELOG.md) for all the details of each releases

### Node-RED palette

![Available Nodes](./docs/img/blynk-palette.png)

### Blynk App Settings

Use Raspberry PI as hardware to access 256 virtual pins or Generic Board for 32.

### How to use

Set your blynk server url, Auth Token  and Template ID in configuration node

![Information Panel](./docs/img/readme-config-connection.png)

See **help** panel on every nodes

![Information Panel](./docs/img/readme-info-panel.png)

### Debug

Use the verbose `-v` flag when starting Node-RED to get more information
or use `node-red-log` and enable log on Configuration Node as needed

![Log settings](./docs/img/readme-config-advanced.png)


### Compatibility

This library is not retrocompatible and cannot replace **node-red-contrib-blynk-ws**.

The new Blynk IoT platform does not allow migration from the old Blynk 0.1 (legacy), so neither does this library.

__________


## What is Blynk?
Blynk provides **iOS** and **Android** apps to control any hardware **over the Internet** or **directly using Bluetooth**.
You can easily build graphic interfaces for all your projects by simply dragging and dropping widgets, **right on your smartphone**.
Blynk is **the most popular IoT platform** used by design studios, makers, educators, and equipment vendors all over the world.

## Download

**Blynk [Arduino Library](https://github.com/blynkkk/blynk-library/releases/latest)**

**Blynk App: 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/googleplay.svg" width="18" height="18" /> Google Play](https://play.google.com/store/apps/details?id=cc.blynk) | 
[<img src="https://cdn.rawgit.com/simple-icons/simple-icons/develop/icons/apple.svg" width="18" height="18" /> App Store](https://itunes.apple.com/us/app/blynk-control-arduino-raspberry/id808760481?ls=1&mt=8)**

Optionally you can install **Blynk [Local Server](https://github.com/blynkkk/blynk-server)** and run everything locally. However, **Blynk Cloud is free** for anyone who is using Blynk for personal (non-commercial) use.

## Documentation

[Full Blynk Documentation](http://docs.blynk.cc/#blynk-firmware) - a complete guide on Blynk features

[Community (Forum)](http://community.blynk.cc) - join a 500,000 Blynk community to ask questions and share ideas

[Help Center](http://help.blynk.cc) - helpful articles on various Blynk aspects

[Code Examples Browser](http://examples.blynk.cc) - browse examples to explore Blynk possibilities

[Official Website](https://blynk.io) 

Social: [Webpage](http://www.blynk.io) / [Facebook](http://www.fb.com/blynkapp) / [Twitter](https://twitter.com/blynk_app) / [Youtube](https://www.youtube.com/blynk) / [Instagram](https://www.instagram.com/blynk.iot/) / [LinkedIn](https://www.linkedin.com/company/b-l-y-n-k/)

## Quickstart: Arduino + Ethernet shield

* Download the Blynk app ([App Store](https://itunes.apple.com/us/app/blynk-control-arduino-raspberry/id808760481?ls=1&mt=8), [Google Play](https://play.google.com/store/apps/details?id=cc.blynk))
* Get the Auth Token from the app
* Import this library to Arduino IDE. Guide [here](http://arduino.cc/en/guide/libraries)
* In Arduino IDE, select File -> Examples -> Blynk -> Boards_Ethernet -> Arduino_Ethernet
* Update Auth Token in the sketch and upload it to Arduino
* Connect your Arduino with Ethernet shield to the internet

Please find examples on how to use different types of connections (transports) and how to do make something great with Blynk.
You can easily apply any type of board/connection to all examples.

__________

## Official implementations
* [C++, Arduino](https://github.com/blynkkk/blynk-library)
* [Python, MicroPython](https://github.com/blynkkk/lib-python)

## Libraries by community
* [Node.js, Espruino, Browsers](https://github.com/vshymanskyy/blynk-library-js)
* [Python, MicroPython](https://github.com/vshymanskyy/blynk-library-python)
* [Particle](https://github.com/vshymanskyy/blynk-library-spark)
* [Lua, OpenWrt, NodeMCU](https://github.com/vshymanskyy/blynk-library-lua)
* [OpenWrt packages](https://github.com/vshymanskyy/blynk-library-openwrt)
* [MBED](https://developer.mbed.org/users/vshymanskyy/code/Blynk/)
* [Node-RED](https://www.npmjs.com/package/node-red-contrib-blynk-iot) **This library!**
* [LabVIEW](https://github.com/juncaofish/NI-LabVIEWInterfaceforBlynk)
* [C#](https://github.com/sverrefroy/BlynkLibrary)

## Attributions

The **node-red-contrib-blynk-iot** was born as a fork of [**node-red-contrib-blynk-ws**](https://github.com/gablau/node-red-contrib-blynk-ws) to support new Blynk IoT Platform

## License
This project is released under The MIT License (MIT)
