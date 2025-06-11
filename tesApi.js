// testApi.js

const API_BASE_URL = 'http://localhost:6000/api/wallet';

async function testWalletApi() {
  let userWallets = {}; // Untuk menyimpan ID dompet yang dibuat

  console.log('--- 1. Mendaftar Pengguna Baru ---');
  try {
    const registerResponse = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'user_js_test', password: 'js_pass_test' }),
    });
    const registerData = await registerResponse.json();
    console.log('Register User Result:', registerData);
    if (!registerResponse.ok) throw new Error(registerData.error || 'Registration failed');
  } catch (error) {
    console.error('Error during user registration:', error.message);
    return;
  }

  console.log('\n--- 2. Membuat Beberapa Dompet untuk User yang Sama ---');
  const walletNames = ['dodi', 'dudi', 'codi'];
  for (const name of walletNames) {
    try {
      const createWalletResponse = await fetch(`${API_BASE_URL}/user_js_test/create-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletName: name }),
      });
      const createWalletData = await createWalletResponse.json();
      console.log(`Create Wallet '${name}' Result:`, createWalletData);
      if (!createWalletResponse.ok) throw new Error(createWalletData.error || `Failed to create wallet ${name}`);
      userWallets[name] = createWalletData.wallet.id; // Simpan ID dompet
    } catch (error) {
      console.error(`Error creating wallet '${name}':`, error.message);
      return;
    }
  }

  console.log('\n--- Wallet IDs for user_js_test ---');
  console.log(userWallets);

  console.log('\n--- 3. Melakukan Deposit ke Dompet Tertentu (dodi) ---');
  const dodiId = userWallets['dodi'];
  try {
    const depositResponse = await fetch(`${API_BASE_URL}/dodi/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletId: dodiId, amount: 1000 }),
    });
    const depositData = await depositResponse.json();
    console.log('Deposit to Dodi Result:', depositData);
    if (!depositResponse.ok) throw new Error(depositData.error || 'Deposit failed');
  } catch (error) {
    console.error('Error during deposit:', error.message);
  }

  console.log('\n--- 4. Melakukan Transfer Antar Dompet User (dodi ke dudi) ---');
  const dudiId = userWallets['dudi'];
  try {
    const transferResponse = await fetch(`${API_BASE_URL}/dodi/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderWalletId: dodiId, receiverWalletId: dudiId, amount: 300 }),
    });
    const transferData = await transferResponse.json();
    console.log('Transfer Result:', transferData);
    if (!transferResponse.ok) throw new Error(transferData.error || 'Transfer failed');
  } catch (error) {
    console.error('Error during transfer:', error.message);
  }

  console.log('\n--- 5. Mendapatkan Semua Dompet User ---');
  try {
    const getAllWalletsResponse = await fetch(`${API_BASE_URL}/user_js_test/wallets`);
    const allWalletsData = await getAllWalletsResponse.json();
    console.log('All Wallets for user_js_test:', allWalletsData);
    if (!getAllWalletsResponse.ok) throw new Error(allWalletsData.error || 'Failed to get all wallets');
  } catch (error) {
    console.error('Error getting all wallets:', error.message);
  }

  console.log('\n--- 6. Mendapatkan Detail Dompet Tertentu (dudi) ---');
  try {
    const getDudiDetailResponse = await fetch(`${API_BASE_URL}/dodi/${dudiId}`);
    const dudiDetailData = await getDudiDetailResponse.json();
    console.log('Dudi Wallet Detail:', dudiDetailData);
    if (!getDudiDetailResponse.ok) throw new Error(dudiDetailData.error || 'Failed to get Dudi detail');
  } catch (error) {
    console.error('Error getting Dudi detail:', error.message);
  }

  console.log('\n--- 7. Mendapatkan Riwayat Transaksi Dompet Tertentu (dodi) ---');
  try {
    const getDodiTransactionsResponse = await fetch(`${API_BASE_URL}/dodi/${dodiId}/transactions`);
    const dodiTransactionsData = await getDodiTransactionsResponse.json();
    console.log('Dodi Transactions History:', dodiTransactionsData);
    if (!getDodiTransactionsResponse.ok) throw new Error(dodiTransactionsData.error || 'Failed to get Dodi transactions');
  } catch (error) {
    console.error('Error getting Dodi transactions:', error.message);
  }
}

testWalletApi();