const path = require('path');
const { Service } = require('node-windows');

// Define the service
const svc = new Service({
  name: 'NextJS App',
  description: 'Next.js app running as a service',
  script: path.join(__dirname, 'node_modules/.bin/next'),
  args: ['start'],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// Install the service
svc.on('install', function () {
  console.log('Service installed');
  svc.start();
});

svc.on('start', function () {
  console.log('Service started');
});

svc.install();
