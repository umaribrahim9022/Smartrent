/**
 * Mimics a Mongoose Query object so controller code like:
 *   await Model.find({...}).populate('owner').sort({...})
 * works the same way against a mocked model as it does against a real one.
 *
 * Usage:
 *   Property.find.mockReturnValue(mockQuery([propertyDoc1, propertyDoc2]));
 */
function mockQuery(resolveValue) {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn(() => query),
    select: jest.fn(() => query),
    limit: jest.fn(() => query),
    then: (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject) => Promise.resolve(resolveValue).catch(reject)
  };
  return query;
}

module.exports = mockQuery;
