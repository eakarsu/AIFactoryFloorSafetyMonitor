const express = require('express');
const { sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { createWorkflow } = require('./workflowCore');
const { createGovernedRouter } = require('./routerFactory');

const query = async (sql, params, transaction) => {
  const [rows] = await sequelize.query(sql, { bind: params, transaction });
  return Array.isArray(rows) ? rows : [];
};
const db = {
  query: (sql, params) => query(sql, params),
  transaction: (work) => sequelize.transaction((transaction) => work((sql, params) => query(sql, params, transaction))),
};
module.exports = createGovernedRouter({ express, workflow: createWorkflow(require('./config')), auth: authenticateToken, db });
