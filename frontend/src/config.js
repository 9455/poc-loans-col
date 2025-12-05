import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DedlyFi Loans',
  projectId: 'YOUR_PROJECT_ID', // Get one at https://cloudJV.walletconnect.com
  chains: [sepolia],
  bcr: true, // Use public RPCs if standard ones fail
});
