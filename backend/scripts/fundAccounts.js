require('dotenv').config({ path: '.env' });
const { ethers } = require('ethers');

// ABI mínimo para un token ERC20 con función mint
const ERC20_MINT_ABI = [
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function main() {
  // Configuración inicial del proveedor y signer
  const rpcUrl = process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  if (!process.env.PRIVATE_KEY) {
      console.error("❌ PRIVATE_KEY no encontrada en .env");
      process.exit(1);
  }
  
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Dirección a fondear
  const targetAddress = process.env.TARGET_ADDRESS || "0x0c1ee65e59cd82c1c6ff3bc0d5e612190f45264d";
  
  console.log(`\n💰 Fondeando cuenta: ${targetAddress}`);
  console.log(`� Usando signer: ${signer.address}`);
  console.log(`� Conectado a Sepolia via ${rpcUrl}\n`);

  // Tokens en Sepolia (leídos de env o defaults comunes)
  const tokens = {
    WETH: process.env.SEPOLIA_WETH_TOKEN || "0xd28824F4515fA0FeDD052eA70369EA6175a4e18b",
    WBTC: process.env.SEPOLIA_WBTC_TOKEN || "0x29f2D40B0605204364af54EC677bD022dA425d03",
    USDC: process.env.SEPOLIA_USDC_TOKEN || "0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad"
  };

  for (const [symbol, address] of Object.entries(tokens)) {
    try {
      console.log(`\n🪙 Procesando ${symbol} (${address})...`);
      
      const token = new ethers.Contract(address, ERC20_MINT_ABI, signer);
      
      // Obtener datos del token
      let decimals = 18;
      try {
          decimals = await token.decimals();
      } catch (e) {
          console.log("   ⚠️  No se pudo leer decimals, asumiendo 18.");
      }

      const amountToMint = symbol === 'WBTC' ? "1" : "10000000"; // 1 WBTC o 10000000 de otros
      const amount = ethers.parseUnits(amountToMint, decimals);
      
      // Verificar balance actual
      try {
          const balanceBefore = await token.balanceOf(targetAddress);
          console.log(`   Balance actual: ${ethers.formatUnits(balanceBefore, decimals)} ${symbol}`);
      } catch (e) {
          console.log("   ⚠️  No se pudo leer el balance.");
      }
      
      // Intentar mintear
      console.log(`   Minteando ${amountToMint} ${symbol}...`);
      const tx = await token.mint(targetAddress, amount);
      console.log(`   ➡️  Tx enviada: ${tx.hash}`);
      await tx.wait();
      
      // Verificar nuevo balance
      const balanceAfter = await token.balanceOf(targetAddress);
      console.log(`   ✅ Nuevo balance: ${ethers.formatUnits(balanceAfter, decimals)} ${symbol}`);
      
    } catch (error) {
      console.error(`   ❌ Error con ${symbol}: ${error.message}`);
      if (error.code === 'CALL_EXCEPTION') {
          console.log(`   ℹ️  Probablemente este token no tiene función 'mint' pública o falló la ejecución.`);
      }
    }
  }

  console.log(`\n✨ Proceso completado!\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
