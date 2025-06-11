Invoke-WebRequest -Uri http://localhost:4000/api/wallet/register `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username": "user_table_test", "password": "pass_table_test"}' | ConvertFrom-Json


  # Buat Dodi Wallet
$dodiResponse = Invoke-WebRequest -Uri http://localhost:4000/api/wallet/user_table_test/create-dodi-wallet `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{}' | ConvertFrom-Json
$dodiId = $dodiResponse.wallet.id
Write-Host "Dodi Wallet ID: $dodiId"

# Buat Dudi Wallet
$dudiResponse = Invoke-WebRequest -Uri http://localhost:4000/api/wallet/user_table_test/create-dudi-wallet `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{}' | ConvertFrom-Json
$dudiId = $dudiResponse.wallet.id
Write-Host "Dudi Wallet ID: $dudiId"

# Buat Codi Wallet
$codiResponse = Invoke-WebRequest -Uri http://localhost:4000/api/wallet/user_table_test/create-codi-wallet `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{}' | ConvertFrom-Json
$codiId = $codiResponse.wallet.id
Write-Host "Codi Wallet ID: $codiId"

Codi Wallet ID: 918aee23-a556-418f-a957-60618e139bc0
Dudi Wallet ID: 23107bb2-5bf3-4a8c-930b-8b49ae92aceb
Dodi Wallet ID: f3138de3-63e2-43de-b899-9dcbb9a75842

Invoke-WebRequest -Uri http://localhost:4000/api/wallet/wallet/dodi/deposit `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body "{`"walletId`": `"$dodiId`", `"amount`": 1000}" | ConvertFrom-Json

Invoke-WebRequest -Uri http://localhost:4000/api/wallet/transfer `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body "{`"senderWalletType`":`"dodi`", `"senderWalletId`": `"$dodiId`", `"receiverWalletType`":`"dudi`", `"receiverWalletId`": `"$dudiId`", `"amount`": 300}" | ConvertFrom-Json

Invoke-WebRequest -Uri http://localhost:4000/api/wallet/transfer `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body "{`"senderWalletType`":`"dodi`", `"senderWalletId`": `"$dodiId`", `"receiverWalletType`":`"codi`", `"receiverWalletId`": `"918aee23-a556-418f-a957-60618e139bc0`", `"amount`": 300}" | ConvertFrom-Json

@GET
Invoke-WebRequest -Uri http://localhost:4000/api/wallet/user_table_test/wallets `
  -Method GET `
  -Headers @{"Content-Type"="application/json"} | ConvertFrom-Json

@GET Dudi
Invoke-WebRequest -Uri http://localhost:4000/api/wallet/wallet/dudi/$dudiId `
  -Method GET `
  -Headers @{"Content-Type"="application/json"} | ConvertFrom-Json

Invoke-WebRequest -Uri http://localhost:4000/api/wallet/wallet/dodi/$dodiId/transactions `
  -Method GET `
  -Headers @{"Content-Type"="application/json"} | ConvertFrom-Json