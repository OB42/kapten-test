'use strict';

const handleRideCreatedEvent = require('./rideCreatedEvent');
const handleRideCompletedEvent = require('./rideCompletedEvent');
const handleSignupEvent = require('./signupEvent');

module.exports = {
  handleRideCreatedEvent,
  handleRideCompletedEvent,
  handleSignupEvent
};
