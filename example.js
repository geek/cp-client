'use strict';

const Client = require('./');

Client.getStatuses((err, services) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(JSON.stringify(services, null, '    '));
});
