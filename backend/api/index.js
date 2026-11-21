// Vercel Serverless Function entry point
// Routes all /api/* requests to the Express app

require('dotenv').config();
const app = require('../src/index.js');

module.exports = app;
