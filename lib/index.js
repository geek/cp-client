'use strict';

// Load modules

const Assert = require('assert');
const Consulite = require('consulite');
const Items = require('items');
const Wreck = require('wreck');


exports.config = function (config) {
  Consulite.config(config);
};


exports.getStatus = function (host, callback) {
  Assert(host && host.address && host.port, 'host is required with .port and .address');

  const wreck = Wreck.defaults({ json: 'force' });
  wreck.get(`http://${host.address}:${host.port}/status`, (err, res, payload) => {
    if (err) {
      return callback(err);
    }

    callback(null, payload);
  });
};


exports.getStatuses = function (callback) {
  Consulite.getServiceHosts('containerpilot', (err, hosts) => {
    if (err) {
      return callback(err);
    }

    if (!hosts || !hosts.length) {
      return callback(new Error('no containerpilot hosts found'));
    }

    Consulite.getServiceNames((err, serviceNames) => {
      if (err) {
        return callback(err);
      }

      const foundServices = [];
      Items.parallel(serviceNames, (serviceName, next) => {
        if (serviceName === 'containerpilot') {
          return next();
        }

        Consulite.getServiceHosts(serviceName, (err, serviceHosts) => {
          if (err) {
            return next(err);
          }

          serviceHosts.forEach((serviceHost) => {
            const found = hosts.find((host) => {
              return host.address === serviceHost.address;
            });

            if (found) {
              foundServices.push({ name: serviceName, host: found });
            }
          });

          next();
        });
      }, (err) => {
        if (err) {
          return callback(err);
        }

        Items.parallel(foundServices, (foundService, next) => {
          exports.getStatus(foundService.host, (err, status) => {
            if (err) {
              return next(err);
            }

            foundService.status = status;
            next();
          });
        }, (err) => {
          if (err) {
            return callback(err);
          }

          return callback(null, foundServices);
        });
      });
    });
  });
};
