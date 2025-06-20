const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")
const walletRoutes = require("../routes/wallet")
const logger = require("../utils/logger")

const app = express()

// Initialize Prisma Client once globally for serverless functions
// This helps with connection pooling and avoids creating new instances on every request.
let prisma
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

// --- CORS Configuration ---
// This should be one of the first middleware you use.
const allowedOrigins = [
  "https://wallet-frontend-six.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  // Add other origins here if needed
]

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    } else {
      // Log the blocked origin for debugging
      logger.warn(`CORS blocked request from origin: ${origin}`)
      return callback(new Error("Not allowed by CORS"))
    }
  },
  optionsSuccessStatus: 200, // For legacy browser support
}

app.use(cors(corsOptions))
// --------------------------

app.use(express.json())

// Middleware to attach prisma and logger to the request object
app.use((req, res, next) => {
  req.prisma = prisma
  req.logger = logger
  next()
})

// Logging middleware
app.use((req, res, next) => {
  req.logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params,
  })
  next()
})

// Use wallet routes
app.use("/api/wallet", walletRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  req.logger.error(`Error encountered: ${err.message}`, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  })
  res.status(500).send("Something broke!")
})

// Export the app for Vercel's serverless functions
module.exports = app

// In a serverless environment, app.listen and process.on handlers for exit/rejection
// are typically not needed as the environment manages the lifecycle.
// Prisma connection management is handled by the client itself.
