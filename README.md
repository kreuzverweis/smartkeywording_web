About
=====

This is Kreuzverweis Smart Keywording for the web(browser). This is mainly meant as a demo how to access the Kreuzverweis Smart Keywording Service from a webapp. The demo consists of two parts, a backend proxy talking to the Smart Keywording Webservice, and a JavaScript client for the GUI.

Running the Demo
================

The backend is built using [Scala](http://scala-lang.org),
[SBT](https://github.com/harrah/xsbt),
[Unfiltered](http://unfiltered.databinder.net/Unfiltered.html),
[Dispatch](http://dispatch.databinder.net/Dispatch.html), and the [Typesafe
Config library](https://github.com/typesafehub/config).

In order to run the demo:

* Clone the git.
* Change to directory, run `sbt clean stage`.
* Copy `src/main/resources/application.conf` to, e.g., `config/demo.conf`.
* Create a client ID and secret for the Smart Keywording Service as described in our [documentation](https://redmine.kreuzverweis.com/projects/kaas/wiki/Wiki), and enter them in `config/demo.conf`.
* Run `target/start config/demo.conf`.
* The demo will, by default, run on port `8888`.
* Please, always use an external config file as in the example, and don't edit the default config in `src/main/resources/application.conf` directly.

This demo can be used as a basis for a an integration in a real application, as we did for the resourcespace DAM system. The plugin is always available on [github](https://github.com/kreuzverweis/smartkeywording_rs).

License
=======

This demo is released unter the Apache License 2.0, see `LICENSE`.
