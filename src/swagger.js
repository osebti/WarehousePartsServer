const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'CMPUT 401 Assignment API DOCS',
    description: 'PC HARDWARE PARTS',
  },
  host: '',
  schemes: ['http'],
};

const outputFile = './src/API_DOCS';
const endpointsFiles = ['./src/index.js'];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);