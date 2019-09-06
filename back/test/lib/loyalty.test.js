'use strict';

const { expect } = require('chai');

const loyaltyLib = require('../../src/lib/loyalty');

describe('lib/loyalty', () => {
  describe('#getLoyaltyStatusForRideCount', () => {
    it('should get the correct loyalty status for zero rides', () => {
      const status = loyaltyLib.getLoyaltyStatusForRideCount(0);
      expect(status).to.equal('bronze');
    });

    it('should get the bronze status', () => {
      const status = loyaltyLib.getLoyaltyStatusForRideCount(9);
      expect(status).to.equal('bronze');
    });

    it('should get the silver status', () => {
      const status = loyaltyLib.getLoyaltyStatusForRideCount(25);
      expect(status).to.equal('silver');
    });

    it('should get the gold status', () => {
      const status = loyaltyLib.getLoyaltyStatusForRideCount(78);
      expect(status).to.equal('gold');
    });

    it('should get the platinum status', () => {
      const status = loyaltyLib.getLoyaltyStatusForRideCount(160);
      expect(status).to.equal('platinum');
    });
  });

  describe('#getLoyaltyPointsForRideAmount', () => {
    it('should get the correct points for bronze', () => {
      const points = loyaltyLib.getLoyaltyPointsForRideAmount('bronze', 22);
      expect(points).to.equal(22);
    });

    it('should get the correct points for silver', () => {
      const points = loyaltyLib.getLoyaltyPointsForRideAmount('silver', 15);
      expect(points).to.equal(45);
    });

    it('should get the correct points for gold', () => {
      const points = loyaltyLib.getLoyaltyPointsForRideAmount('gold', 20);
      expect(points).to.equal(100);
    });

    it('should get the correct points for platinum', () => {
      const points = loyaltyLib.getLoyaltyPointsForRideAmount('platinum', 30);
      expect(points).to.equal(300);
    });
  });

  describe('#getRemainingRidesToNextStatus', () => {
    it('should get the correct remaining rides for zero-rider', () => {
      const rides = loyaltyLib.getRemainingRidesToNextStatus(0);
      expect(rides).to.equal(20);
    });

    it('should get the correct remaining rides for a current silver', () => {
      const rides = loyaltyLib.getRemainingRidesToNextStatus(32);
      expect(rides).to.equal(18);
    });

    it('should get the correct remaining rides for a gold', () => {
      const rides = loyaltyLib.getRemainingRidesToNextStatus(69);
      expect(rides).to.equal(31);
    });

    it('should return 0 for a platinum', () => {
      const rides = loyaltyLib.getRemainingRidesToNextStatus(100);
      expect(rides).to.equal(0);
    });

    it('should return 0 for a platinum (2)', () => {
      const rides = loyaltyLib.getRemainingRidesToNextStatus(150);
      expect(rides).to.equal(0);
    });
  });

  describe('#getRiderUpdate', () => {
    it('should update the model for a new rider', () => {
      const riderInfo = {
        ride_count: 0,
        points: 0,
        status: 'bronze'
      };
      const riderUpdate = loyaltyLib.getRiderUpdate(riderInfo, 10);

      expect(riderUpdate).to.deep.equal({
        ride_count: 1,
        points: 10,
        status: 'bronze'
      });
    });

    it('should upgrade loyalty status if ride count steps over threshold', () => {
      const riderInfo = {
        ride_count: 19,
        points: 50,
        status: 'bronze'
      };
      const riderUpdate = loyaltyLib.getRiderUpdate(riderInfo, 10);

      expect(riderUpdate).to.deep.equal({
        ride_count: 20,
        points: 60,
        status: 'silver'
      });
    });

    it('should apply silver multiplicator', () => {
      const riderInfo = {
        ride_count: 25,
        points: 100,
        status: 'silver'
      };
      const riderUpdate = loyaltyLib.getRiderUpdate(riderInfo, 10);

      expect(riderUpdate).to.deep.equal({
        ride_count: 26,
        points: 130,
        status: 'silver'
      });
    });

    it('should apply gold multiplicator', () => {
      const riderInfo = {
        ride_count: 65,
        points: 100,
        status: 'gold'
      };
      const riderUpdate = loyaltyLib.getRiderUpdate(riderInfo, 10);

      expect(riderUpdate).to.deep.equal({
        ride_count: 66,
        points: 150,
        status: 'gold'
      });
    });

    it('should apply platinum multiplicator', () => {
      const riderInfo = {
        ride_count: 125,
        points: 1000,
        status: 'platinum'
      };
      const riderUpdate = loyaltyLib.getRiderUpdate(riderInfo, 10);

      expect(riderUpdate).to.deep.equal({
        ride_count: 126,
        points: 1100,
        status: 'platinum'
      });
    });
  });
});
