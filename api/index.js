const app = require('../server');
const connectDB = require('../config/db');

let databaseConnection;

module.exports = async (req, res) => {
  databaseConnection ??= connectDB();
  await databaseConnection;
  return app(req, res);
};
