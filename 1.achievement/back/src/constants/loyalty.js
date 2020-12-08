'use strict';

const loyaltyStatuses = ['bronze', 'silver', 'gold', 'platinum'];

const loyaltyCoef = {
  bronze: { rides: 0, coef: 1 },
  silver: { rides: 20, coef: 3 },
  gold: { rides: 50, coef: 5 },
  platinum: { rides: 100, coef: 10 },
};

module.exports = {
  loyaltyStatuses,
  loyaltyCoef,
};
