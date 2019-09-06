const chai = require('chai');

const mongodb = require('../src/lib/mongodb');
const riders = require('../src/models/riders');

chai.use(require('sinon-chai'));
chai.use(require('dirty-chai'));

before(async () => {
  // Write before all tests hooks here
});

beforeEach(async () => {
  // Write before each tests hooks here
  await mongodb.connect();
  await riders.createIndexes();
});

afterEach(async () => {
  // Write after each all tests hooks here
});

after(async () => {
  // Write after all tests hooks here
  await mongodb.disconnect();
});
