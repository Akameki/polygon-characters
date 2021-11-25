
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  nftaddress, nftmarketaddress, envChainId, contract_owner
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function ConnectWallet() {
  const [showModalMessage, setShowModalMessage] = useState('')
  const router = useRouter()

  // For now, 'eth_accounts' will continue to always return an array
  async function handleChainIdWallet() {
    window.ethereum
      .request({ method: 'eth_chainId' })
      .then(chainId => {
        if (chainId === envChainId) {
          setShowModalMessage(`Connected to chainId : ${chainId}`)
          router.push('/')
        } else {
          setShowModalMessage("Error - Please check your MetaMask network connection and try again.")
        }
      })
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
          setShowModalMessage('Connection request has been rejected. Please refresh screen to try again.');
        } else {
          console.error(err);
          setShowModalMessage(`Received an error message from your crypto wallet: ${err.message}`)
        }
      })
  }

  // For now, 'eth_accounts' will continue to always return an array
  function handleRequestAccountsWallet(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
      setShowModalMessage("Error - Please connect to MetaMask and try again.")
    } else {
      window.ethereum
        .request({
          method: 'eth_getBalance', params: [accounts[0],"latest"] })
        .then(handleChainIdWallet)
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            console.log('Please connect to MetaMask.');
            setShowModalMessage('Connection request has been rejected. Please refresh screen to try again.');
          } else {
            console.error(err);
            setShowModalMessage(`Received an error message from your crypto wallet: ${err.message}`)
          }
        })
    }
  }

  function connectWallet() {
    if (window.ethereum) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleRequestAccountsWallet)
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            console.log('Please connect to MetaMask.');
            setShowModalMessage('Connection request has been rejected. Please refresh screen to try again.');
          } else {
            console.error(err);
            setShowModalMessage(`Received an error message from your crypto wallet: ${err.message}`)
          }
        })
    } else {
      setShowModalMessage("Unable to connect to a crypto wallet. Please refresh screen to try again.")
    }
  }

  useEffect(() => {
    connectWallet()
    return function cleanup() {
      //mounted = false
    }
  }, [])

  return (
    <div>
      <p>{showModalMessage}</p>
    </div>
  )
}
