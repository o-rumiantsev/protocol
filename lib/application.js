'use strict';

// Application object to be served by mhp.Server
//
function Application(name, api) {
  // Application name, used to identify it
  this.name = name;

  // api - an object which contains multiple interfaces
  // with its methods
  this.api = api;
}

module.exports = Application;
