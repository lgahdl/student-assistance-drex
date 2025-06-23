import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import toast from 'react-hot-toast';

interface UseWeb3Return {
  isConnected: boolean;
  account: string | null;
  isLoading: boolean;
  connectWallet: () => Promise<string | null>;
  signMessage: (message: string) => Promise<string | null>;
  disconnect: () => void;
}

export const useWeb3 = (): UseWeb3Return => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = await detectEthereumProvider();
        if (provider && window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return null;
      }

      if (!window.ethereum) {
        toast.error('Ethereum provider not found');
        return null;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const account = accounts[0];
        setAccount(account);
        setIsConnected(true);
        toast.success('Wallet connected successfully!');
        return account;
      } else {
        toast.error('No accounts found');
        return null;
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Please connect to MetaMask.');
      } else {
        toast.error('Error connecting to wallet');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!account || !window.ethereum) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Error signing message:', error);
      if (error.code === 4001) {
        toast.error('Message signing was cancelled');
      } else {
        toast.error('Error signing message');
      }
      return null;
    }
  }, [account]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  }, []);

  return {
    isConnected,
    account,
    isLoading,
    connectWallet,
    signMessage,
    disconnect,
  };
};

// Extend window object for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
} 