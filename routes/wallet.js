const express = require("express")
const router = express.Router()

// Helper function untuk mendapatkan model dompet berdasarkan tipe
const getWalletModel = (prisma, type) => {
  switch (type.toLowerCase()) {
    case "dodi":
      return prisma.dodiWallet
    case "dudi":
      return prisma.dudiWallet
    case "codi":
      return prisma.codiWallet
    default:
      return null
  }
}

// Middleware untuk memvalidasi walletType
const validateWalletType = (req, res, next) => {
  const { walletType } = req.params
  const logger = req.logger // Akses logger dari req object

  const validTypes = ["dodi", "dudi", "codi"]
  if (!validTypes.includes(walletType.toLowerCase())) {
    logger.warn(`Invalid wallet type provided: '${walletType}'`)
    return res.status(400).json({ error: "Invalid wallet type provided. Must be dodi, dudi, or codi." })
  }
  next()
}

router.post("/register", async (req, res) => {
  const { username, password } = req.body
  const prisma = req.prisma
  const logger = req.logger

  if (!username || !password) {
    logger.warn("Registration attempt with missing username or password", { username })
    return res.status(400).json({ error: "Username and password are required" })
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      logger.info(`Registration failed: Username '${username}' already exists`)
      return res.status(409).json({ error: "Username already exists" })
    }

    const newUser = await prisma.user.create({
      data: { username, password },
    })
    logger.info(`User '${username}' created successfully`, { userId: newUser.id })
    res.status(201).json({ message: "User created successfully", user: newUser })
  } catch (error) {
    logger.error(`Error registering user '${username}': ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint untuk membuat dompet spesifik (Dodi, Dudi, Codi) untuk user yang sudah ada
router.post("/:username/create-:walletType-wallet", validateWalletType, async (req, res) => {
  // <-- Updated route path
  const { username, walletType } = req.params
  const prisma = req.prisma
  const logger = req.logger
  const walletModel = getWalletModel(prisma, walletType)

  // No need for if (!walletModel) here, as validateWalletType handles it.
  // Unless you want a specific error message here based on getWalletModel's return.

  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      logger.warn(`Attempt to create ${walletType} wallet for non-existent user: '${username}'`)
      return res.status(404).json({ error: "User not found" })
    }

    // Periksa apakah user sudah punya dompet jenis ini
    const existingWallet = await walletModel.findUnique({ where: { userId: user.id } })
    if (existingWallet) {
      logger.warn(`User '${username}' already has a ${walletType} wallet.`)
      return res.status(409).json({ error: `User already has a ${walletType} wallet.` })
    }

    const newWallet = await walletModel.create({
      data: { userId: user.id, balance: 0 },
    })
    logger.info(`New ${walletType} wallet created for user '${username}'`, { walletId: newWallet.id, userId: user.id })
    res
      .status(201)
      .json({ message: `Wallet ${walletType} created successfully for user '${username}'`, wallet: newWallet })
  } catch (error) {
    logger.error(`Error creating ${walletType} wallet for user '${username}': ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint untuk mendapatkan semua dompet milik user (Dodi, Dudi, Codi)
router.get("/:username/wallets", async (req, res) => {
  const { username } = req.params
  const prisma = req.prisma
  const logger = req.logger

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        dodiWallet: true,
        dudiWallet: true,
        codiWallet: true,
      },
    })

    if (!user) {
      logger.warn(`Attempt to fetch wallets for non-existent user: '${username}'`)
      return res.status(404).json({ error: "User not found" })
    }

    const allWallets = []
    if (user.dodiWallet) allWallets.push({ type: "dodi", ...user.dodiWallet })
    if (user.dudiWallet) allWallets.push({ type: "dudi", ...user.dudiWallet })
    if (user.codiWallet) allWallets.push({ type: "codi", ...user.codiWallet })

    logger.info(`Successfully fetched ${allWallets.length} wallets for user '${username}'`, { userId: user.id })
    res.json(allWallets)
  } catch (error) {
    logger.error(`Error fetching wallets for user '${username}': ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint untuk mendapatkan detail dompet spesifik berdasarkan TIPE dan WALLET ID
router.get("/wallet/:walletType/:walletId", validateWalletType, async (req, res) => {
  // <-- Updated route path
  const { walletType, walletId } = req.params
  const prisma = req.prisma
  const logger = req.logger
  const walletModel = getWalletModel(prisma, walletType)

  // No need for if (!walletModel) here, as validateWalletType handles it.

  try {
    const wallet = await walletModel.findUnique({
      where: { id: walletId },
      include: { user: { select: { username: true } } },
    })

    if (!wallet) {
      logger.warn(`Attempt to fetch non-existent ${walletType} wallet with ID: '${walletId}'`)
      return res.status(404).json({ error: "Wallet not found" })
    }
    logger.info(
      `Successfully fetched ${walletType} wallet details for ID '${walletId}' (Owner: ${wallet.user.username})`,
      { walletId: wallet.id, balance: wallet.balance },
    )
    res.json(wallet)
  } catch (error) {
    logger.error(`Error fetching ${walletType} wallet '${walletId}': ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint untuk menambahkan saldo (deposit) ke dompet spesifik
router.post("/wallet/:walletType/deposit", validateWalletType, async (req, res) => {
  // <-- Updated route path
  const { walletType } = req.params
  const { walletId, amount } = req.body
  const prisma = req.prisma
  const logger = req.logger
  const walletModel = getWalletModel(prisma, walletType)

  // No need for if (!walletModel) here, as validateWalletType handles it.
  if (!walletId || !amount) {
    logger.warn(`Deposit attempt to ${walletType} with missing parameters`, { walletId, amount })
    return res.status(400).json({ error: "Wallet ID and amount are required" })
  }

  const depositAmount = Number.parseFloat(amount)
  if (isNaN(depositAmount) || depositAmount <= 0) {
    logger.warn(`Deposit attempt to ${walletType} with invalid amount`, { walletId, amount })
    return res.status(400).json({ error: "Invalid deposit amount" })
  }

  try {
    const targetWallet = await walletModel.findUnique({ where: { id: walletId } })
    if (!targetWallet) {
      logger.warn(`Deposit failed: ${walletType} wallet '${walletId}' not found.`)
      return res.status(404).json({ error: "Wallet not found" })
    }

    logger.info(
      `Initiating deposit of ${depositAmount} for ${walletType} wallet '${walletId}' (Current Balance: ${targetWallet.balance})`,
    )

    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await walletModel.update({
        where: { id: targetWallet.id },
        data: { balance: { increment: depositAmount } },
      })

      const transactionData = {
        sourceWalletType: walletType,
        sourceWalletId: wallet.id,
        type: "credit",
        amount: depositAmount,
        description: `Deposit to ${walletType} wallet`,
      }

      if (walletType === "dodi") {
        transactionData.dodiWalletId = wallet.id
      } else if (walletType === "dudi") {
        transactionData.dudiWalletId = wallet.id
      } else if (walletType === "codi") {
        transactionData.codiWalletId = wallet.id
      }

      await tx.transaction.create({ data: transactionData })
      return wallet
    })

    logger.info(
      `Deposit successful for ${walletType} wallet '${updatedWallet.id}'. New Balance: ${updatedWallet.balance}`,
    )
    res.json({ message: "Deposit successful", newBalance: updatedWallet.balance, walletId: updatedWallet.id })
  } catch (error) {
    logger.error(`Error during deposit for ${walletType} wallet '${walletId}': ${error.message}`, {
      stack: error.stack,
      depositAmount,
    })
    res.status(500).json({ error: "Internal server error" })
  }
})

// Endpoint untuk transfer antar dompet (bisa beda jenis atau sama, bisa beda user atau sama)
router.post("/transfer", async (req, res) => {
  const { senderWalletType, senderWalletId, receiverWalletType, receiverWalletId, amount } = req.body
  const prisma = req.prisma
  const logger = req.logger

  if (!senderWalletType || !senderWalletId || !receiverWalletType || !receiverWalletId || !amount) {
    logger.warn("Transfer attempt with missing parameters", {
      senderWalletType,
      senderWalletId,
      receiverWalletType,
      receiverWalletId,
      amount,
    })
    return res.status(400).json({ error: "All transfer parameters are required." })
  }

  if (senderWalletId === receiverWalletId && senderWalletType === receiverWalletType) {
    logger.warn("Transfer attempt to the same wallet", { senderWalletId, senderWalletType })
    return res.status(400).json({ error: "Cannot transfer to the same wallet." })
  }

  const transferAmount = Number.parseFloat(amount)
  if (isNaN(transferAmount) || transferAmount <= 0) {
    logger.warn("Transfer attempt with invalid amount", { senderWalletId, receiverWalletId, amount })
    return res.status(400).json({ error: "Invalid transfer amount." })
  }

  const senderModel = getWalletModel(prisma, senderWalletType)
  const receiverModel = getWalletModel(prisma, receiverWalletType)

  if (!senderModel || !receiverModel) {
    return res.status(400).json({ error: "Invalid sender or receiver wallet type." })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const senderWallet = await senderModel.findUnique({ where: { id: senderWalletId } })
      if (!senderWallet) {
        logger.warn(`Transfer failed: Sender ${senderWalletType} wallet '${senderWalletId}' not found.`)
        throw new Error("Sender wallet not found.")
      }
      if (senderWallet.balance < transferAmount) {
        logger.warn(
          `Transfer failed: Insufficient balance for ${senderWalletType} wallet '${senderWalletId}'. Attempted: ${transferAmount}, Current: ${senderWallet.balance}`,
        )
        throw new Error("Insufficient balance.")
      }

      const receiverWallet = await receiverModel.findUnique({ where: { id: receiverWalletId } })
      if (!receiverWallet) {
        logger.warn(`Transfer failed: Receiver ${receiverWalletType} wallet '${receiverWalletId}' not found.`)
        throw new Error("Receiver wallet not found.")
      }

      logger.info(
        `Initiating transfer of ${transferAmount} from ${senderWalletType} '${senderWalletId}' to ${receiverWalletType} '${receiverWalletId}'`,
      )

      await senderModel.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: transferAmount } },
      })

      await receiverModel.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: transferAmount } },
      })

      const senderTransactionData = {
        sourceWalletType: senderWalletType,
        sourceWalletId: senderWallet.id,
        type: "debit",
        amount: transferAmount,
        description: `Transfer to ${receiverWalletType} ${receiverWallet.id.substring(0, 8)}...`,
        senderWalletType: senderWalletType,
        senderWalletId: senderWallet.id,
        receiverWalletType: receiverWalletType,
        receiverWalletId: receiverWallet.id,
      }
      if (senderWalletType === "dodi") {
        senderTransactionData.dodiWalletId = senderWallet.id
      } else if (senderWalletType === "dudi") {
        senderTransactionData.dudiWalletId = senderWallet.id
      } else if (senderWalletType === "codi") {
        senderTransactionData.codiWalletId = senderWallet.id
      }
      await tx.transaction.create({ data: senderTransactionData })

      const receiverTransactionData = {
        sourceWalletType: receiverWalletType,
        sourceWalletId: receiverWallet.id,
        type: "credit",
        amount: transferAmount,
        description: `Received from ${senderWalletType} ${senderWallet.id.substring(0, 8)}...`,
        senderWalletType: senderWalletType,
        senderWalletId: senderWallet.id,
        receiverWalletType: receiverWalletType,
        receiverWalletId: receiverWallet.id,
      }
      if (receiverWalletType === "dodi") {
        receiverTransactionData.dodiWalletId = receiverWallet.id
      } else if (receiverWalletType === "dudi") {
        receiverTransactionData.dudiWalletId = receiverWallet.id
      } else if (receiverWalletType === "codi") {
        receiverTransactionData.codiWalletId = receiverWallet.id
      }
      await tx.transaction.create({ data: receiverTransactionData })

      logger.info(
        `Transfer successful: ${transferAmount} from ${senderWalletType} '${senderWalletId}' to ${receiverWalletType} '${receiverWalletId}'`,
      )
      res.json({ message: "Transfer successful" })
    })
  } catch (error) {
    logger.error(
      `Error during transfer from ${senderWalletType} '${senderWalletId}' to ${receiverWalletType} '${receiverWalletId}': ${error.message}`,
      { stack: error.stack, transferAmount },
    )
    res.status(400).json({ error: error.message })
  }
})

// Endpoint untuk melihat riwayat transaksi dompet spesifik
router.get("/wallet/:walletType/:walletId/transactions", validateWalletType, async (req, res) => {
  // <-- Updated route path
  const { walletType, walletId } = req.params
  const prisma = req.prisma
  const logger = req.logger
  const walletModel = getWalletModel(prisma, walletType)

  // No need for if (!walletModel) here, as validateWalletType handles it.

  try {
    const targetWallet = await walletModel.findUnique({ where: { id: walletId } })
    if (!targetWallet) {
      logger.warn(`Attempt to fetch transactions for non-existent ${walletType} wallet: '${walletId}'`)
      return res.status(404).json({ error: "Wallet not found" })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        sourceWalletId: walletId,
        sourceWalletType: walletType,
      },
      orderBy: { createdAt: "desc" },
    })

    logger.info(`Successfully fetched ${transactions.length} transactions for ${walletType} wallet '${walletId}'`)
    res.json(transactions)
  } catch (error) {
    logger.error(`Error fetching transactions for ${walletType} wallet '${walletId}': ${error.message}`, {
      stack: error.stack,
    })
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
