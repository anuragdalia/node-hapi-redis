"use strict";

var Promise = require('bluebird');
var redis = require('redis');
var redisClientFactory = require('basic-redis-factory');

// add promises to all redis actions
Promise.promisifyAll(redis);

exports.register = function (server, options, next) {

  options = options || {};

  var redisOpts = options.connection;

  var redisLibrary = options.redisLibrary || redis;
  
  var name = options.name || "redis";

  var redisClient = redisClientFactory(redisLibrary, redisOpts);

  /**
   * error handler for errors after initial connection has been established
   * @param {Error} err is the error thrown
   * @return {null}
   */
  var defaultErrorHandler = function(err) {
    server.log([ 'hapi-redis', 'error' ], err.message);
  };

  var initialErrorHandler = function(err) {
    server.log([ 'hapi-redis', 'error' ], err.message);
    next(err);
    redisClient.end();
  };

  redisClient.on('error', initialErrorHandler);

  redisClient.on("ready", function(){
    server.log([ 'hapi-redis', 'info' ], 'redisClient connection created');

    // change the error handler to simply log errors
    redisClient.removeListener('error', initialErrorHandler);
    redisClient.on('error', defaultErrorHandler);
    next();
  });
  
  const pluginRegistrations = (server.plugins['hapi-redis'] || {}).plug || {};
  clients[name] = clients[name] || {};
  clients[name].client = redisClient;
  clients[name].library = redisLibrary;
  
  server.expose('plug', pluginRegistrations);
};

exports.register.attributes = {
  pkg: require('./package.json'),
  multiple: true
};
