const { Model } = require('sequelize');

const normalizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value instanceof Date || value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'object') {
    const plain = { ...value };

    if (plain.id !== undefined && plain._id === undefined) {
      plain._id = String(plain.id);
    }

    Object.keys(plain).forEach((key) => {
      plain[key] = normalizeValue(plain[key]);
    });

    return plain;
  }

  return value;
};

class BaseModel extends Model {
  static async deleteMany(where = {}) {
    return this.destroy({ where });
  }

  static async findById(id, options = {}) {
    return this.findByPk(id, options);
  }

  async remove() {
    return this.destroy();
  }

  toJSON() {
    return normalizeValue(this.get({ plain: true }));
  }
}

module.exports = BaseModel;
