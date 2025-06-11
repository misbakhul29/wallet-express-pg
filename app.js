// app.js
require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const walletRoutes = require('./routes/wallet');
const logger = require('./utils/logger');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use((req, res, next) => {
  req.prisma = prisma;
  req.logger = logger;
  next();
});

app.use((req, res, next) => {
  req.logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

app.use('/api/wallet', walletRoutes);

app.use((err, req, res, next) => {
  req.logger.error(`Error encountered: ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body
  });
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected, application exiting.');
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at Promise: ${reason}`, { promise });
});