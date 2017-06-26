'use strict';

const Http = require('http');
const Url = require('url');
const Lab = require('lab');
const CPClient = require('../');


const { describe, it, expect } = exports.lab = Lab.script();


describe('getStatus()', () => {
  it('returns the result of ContainerPilot /status', (done) => {
    const server = Http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        Services: [
          {
            Name: 'foo',
            Address: '172.17.0.8',
            Port: 3000,
            Status: 'unknown'
          },
          {
            Name: 'containerpilot',
            Address: '172.17.0.8',
            Port: 9090,
            Status: 'healthy'
          }
        ],
        Watches: ['docker-compose-api']
      }));
    });

    server.listen(0, () => {
      CPClient.config({ consul: `http://localhost:${server.address().port}` });

      CPClient.getStatus({ address: 'localhost', port: server.address().port }, (err, status) => {
        expect(err).to.not.exist();
        expect(status.Watches).to.contain('docker-compose-api');
        CPClient.config({});
        done();
      });
    });
  });
});


describe('getStatuses()', () => {
  it('returns the statuses for configured services', (done) => {
    const statusServer = Http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        Services: [
          {
            Name: 'api',
            Address: 'localhost',
            Port: 3000,
            Status: 'unknown'
          },
          {
            Name: 'containerpilot',
            Address: 'localhost',
            Port: 9090,
            Status: 'healthy'
          }
        ],
        Watches: ['docker-compose-api']
      }));
    });

    statusServer.listen(0, () => {
      const consulServer = Http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const path = Url.parse(req.url).pathname;

        if (path === '/v1/catalog/services') {
          return res.end(JSON.stringify({
            containerpilot: [ 'op' ],
            api: [
              'traefik.backend=api',
              'traefik.frontend.rule=PathPrefixStrip:/api',
              'traefik.frontend.entryPoints=http'
            ],
            foo: []
          }));
        }

        if (path === '/v1/health/service/containerpilot') {
          return res.end(JSON.stringify([
            { Service: { Address: 'localhost', Port: statusServer.address().port } }
          ]));
        }

        if (path === '/v1/health/service/api') {
          return res.end(JSON.stringify([
            { Service: { Address: 'localhost', Port: 8080 } }
          ]));
        }

        if (path === '/v1/health/service/foo') {
          return res.end(JSON.stringify([
            { Service: { Address: 'foo.com', Port: 8080 } }
          ]));
        }
      });

      consulServer.listen(0, () => {
        CPClient.config({ consul: `http://localhost:${consulServer.address().port}` });

        CPClient.getStatuses((err, statuses) => {
          expect(err).to.not.exist();
          expect(statuses.length).to.equal(1);
          expect(statuses[0].name).to.equal('api');
          expect(statuses[0].host).to.exist();
          expect(statuses[0].status).to.exist();
          CPClient.config({});
          done();
        });
      });
    });
  });
});
