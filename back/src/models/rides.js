'use strict';

const { getDb } = require('../lib/mongodb');
const dateLib = require('../lib/date');
const Joi = require('../lib/joi');

const COLLECTION_NAME = 'rides';

const rideSchema = Joi.object({
  _id: Joi.objectId().required(),
  rider_id: Joi.objectId().required(),
  finished_at: Joi.date().default(() => dateLib.getDate(), 'time of completion'),
  amount: Joi.number().min(0).precision(2).required(),
});

/**
 * Validate schema consistency
 *
 * @param {Object} ride - the ride to validate
 *
 * @returns {Object} Referral: valid version of ride
 */
function _validateSchema(ride) {
  return Joi.attempt(ride, rideSchema);
}

/**
 * Return the rides collection
 *
 * @returns {Object} object to manipulate rides collection
 */
function collection() {
  return getDb().collection(COLLECTION_NAME);
}

/**
 * Create collection indexes
 *
 * @returns {void}
 */
async function createIndexes() {
  await collection().createIndex({ status: 1 }, { background: true });
}

/**
 * Returns a cursor on lots for a given query.
 *
 * @param {object} query       - mongo query
 * @param {object} projections - optional projection of results fields
 *
 * @returns {Promise<Cursor>} The cursor to iterate on messages
 */
function find(query = {}, projections = {}) {
  return collection().find(query, projections);
}

/**
 * Returns a ride found with its id
 *
 * @param {ObjectId} rideId   - identifier of the queried ride
 * @param {Object} projections - optional projection of result fields
 *
 * @returns {Object} The mongo document
 */
function findOneById(rideId, projections = {}) {
  return collection().findOne({ _id: rideId }, projections);
}

/**
 * Insert a new ride into the database
 *
 * @param {Object} ride - data about the inserted ride
 *
 * @returns {Object} the inserted ride
 */
async function insertOne(ride) {
  const validatedRide = _validateSchema(ride);
  const res = await collection().insert(validatedRide);

  return res.ops[0];
}

/**
 * Update a ride
 *
 * @param {ObjectId} rideId     - identifier of the updated ride
 * @param {Object} updatedFields - fields that are updated
 *
 * @returns {Object/null} result of update if succeeded, null otherwise
 */
async function updateOne(rideId, updatedFields) {
  const result = await collection().updateOne(
    { _id: rideId },
    { $set: updatedFields },
  );
  return result;
}

module.exports = {
  collection,
  createIndexes,
  findOneById,
  find,
  insertOne,
  updateOne,
};
