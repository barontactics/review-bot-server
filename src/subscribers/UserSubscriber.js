const { EntitySubscriberInterface } = require('typeorm');
const { hashPassword } = require('../utils/password');

/**
 * User entity subscriber to automatically hash passwords before insert/update
 */
class UserSubscriber {
  /**
   * Indicates that this subscriber only listens to User events.
   */
  listenTo() {
    return 'User';
  }

  /**
   * Called before entity is inserted to the database.
   * Hashes the password if it's present.
   */
  async beforeInsert(event) {
    if (event.entity.password) {
      event.entity.password = await hashPassword(event.entity.password);
    }
  }

  /**
   * Called before entity is updated in the database.
   * Hashes the password if it was changed.
   */
  async beforeUpdate(event) {
    // Only hash if password is being updated
    if (event.entity.password && event.databaseEntity) {
      // Check if password has changed
      if (event.entity.password !== event.databaseEntity.password) {
        event.entity.password = await hashPassword(event.entity.password);
      }
    }
  }
}

module.exports = UserSubscriber;
