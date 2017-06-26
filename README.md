# cp-client
ContainerPilot client for Node.js

[![Npm Version](https://img.shields.io/npm/v/cp-client.svg)](https://npmjs.com/package/cp-client)
[![Build Status](https://secure.travis-ci.org/geek/cp-client.svg)](http://travis-ci.org/geek/cp-client)


## API

The consul instance to connect to can be configured either through the `config()` function or through the following environment variables:
* `CONSUL_HOST`: defaults to 'consul'
* `CONSUL_PORT`: defaults to 8500


### config(config)

Configure cp-client with any of the following settings
* `consul` - the base URL to use to connect to consul


### getStatus(host, callback)

Get the /status results for a ContainerPilot configured service with the following arguments

* `host`: object with `address` and `port` properties. Should be the `containerpilot` registered service in consul, as it will have the `/status` endpoint.
* `callback`: function with the signature `(err, status)` where `status` is an object of the parsed response from [`/status`](https://github.com/joyent/containerpilot/pull/408)


### getStatuses(callback)

Maps all status results to services configured in consul to have a telemetry endpoint. Please note that if a service isn't configured with telemetry then it will not exist in the resulting data.

* `callback`: function with the signature `(err, statuses)` where `statuses` is an array of objects with the following structure:
  - `name` - name of the registered service in consul
  - `host` - object with `address` and `port` properties for the `containerpilot` service registered
  - `status` - the parsed response from [`/status`](https://github.com/joyent/containerpilot/pull/408)
