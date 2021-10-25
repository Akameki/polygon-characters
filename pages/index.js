import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'

import { useRouter } from 'next/router'
import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where } from "firebase/firestore";

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [showModal, setShowModal] = useState(false);
  const [address, setAddress] = useState('')
  const router = useRouter()
  function groupBy(arr, criteria) {
    const newObj = arr.reduce(function (acc, currentValue) {
      if (!acc[currentValue[criteria]]) {
        acc[currentValue[criteria]] = [];
      }
      acc[currentValue[criteria]].push(currentValue);
      return acc;
    }, {});
    return newObj;
  }
  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    console.log("****accounts,", accounts)
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
    }
  }
  function connect() {
    console.log("****connect");
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
      .catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err);
        }
      });
  }
  useEffect(() => {
    connect()
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return function cleanup() {
      //mounted = false
    }
  }, [])

  useEffect(() => {
    //loadNFTs()

      async function loadFirebase() {
        const firebaseConfig = {
          // INSERT YOUR OWN CONFIG HERE
          apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
          authDomain: "pay-a-vegan.firebaseapp.com",
          databaseURL: "https://pay-a-vegan.firebaseio.com",
          projectId: "pay-a-vegan",
          storageBucket: "pay-a-vegan.appspot.com",
          messagingSenderId: "587888386485",
          appId: "1:587888386485:web:3a81137924d19cbe2439fc",
          measurementId: "G-MGJK6GF9YW"
        };

        const app = initializeApp(firebaseConfig)

        const db = getFirestore(app)
        //const auth = getAuth(app)

        const nounsRef = collection(db, "characters");
        const q = query(nounsRef,
          orderBy("seller"),
          orderBy("createdAt", "desc"));

        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          let item = {
            id: doc.id,
            price: data.price,
            text: data.text,
            image: data.fileUrl,
            seller: data.seller,
            sold: data.sold
          }

          items.push(item)
        })
        let forSaleItems = []
        let groupBySellerItems = groupBy(items, "seller")
        Object.keys(groupBySellerItems).forEach((seller) => {
          let sellerItems = groupBySellerItems[seller]
          let maxSoldPrice = sellerItems.reduce((prev, current) => {
            if (current.sold) {
              return Math.max(prev, current.price)
            } else {
              return prev
            }
          }, 0)
          let descNotSoldItem = sellerItems.reduce((prev, current) => {
            return current.sold ? prev : current
          }, sellerItems[0])
          forSaleItems.push(descNotSoldItem)
          if (descNotSoldItem.price < maxSoldPrice + 1) {
            descNotSoldItem.price = maxSoldPrice + 1
            descNotSoldItem.priceDesc = `${maxSoldPrice} + 1`
          } else {
            descNotSoldItem.priceDesc = `${descNotSoldItem.price}`
          }
        })
        setNfts(forSaleItems)
        setLoadingState('loaded')
      }
    loadFirebase()
    return function cleanup() {
      //mounted = false
    }
  }, [])

  async function loadNFTs() {
      const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
      })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        auction: i.auction,
        endTime: i.endTime,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded')
  }
  async function buyFirebase(nft) {
    setShowModal(true)
    const firebaseConfig = {
      // INSERT YOUR OWN CONFIG HERE
      apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
      authDomain: "pay-a-vegan.firebaseapp.com",
      databaseURL: "https://pay-a-vegan.firebaseio.com",
      projectId: "pay-a-vegan",
      storageBucket: "pay-a-vegan.appspot.com",
      messagingSenderId: "587888386485",
      appId: "1:587888386485:web:3a81137924d19cbe2439fc",
      measurementId: "G-MGJK6GF9YW"
    };

    const app = initializeApp(firebaseConfig)

    const db = getFirestore(app)
    const characterRef = doc(db, "characters", nft.id);
    // Set the "capital" field of the city 'DC'
    await updateDoc(characterRef, {
      sold: true,
      owner: address,
      price: nft.price
    });
    setShowModal(false)
    //loadFirebase()

    router.push('/my-purchase')
  }
  async function buyNft(nft) {
    setShowModal(true)
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    })
    await transaction.wait()
    setShowModal(false)
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (
    <div>
      <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
      <p className="px-20 py-10">Please use Sell Digital Character to upload your creative work</p>
    </div>
  )
  if (showModal) return (
    <div className="p-4">
      <p>Please wait. Your METAMASK wallet will prompt you once for the purchase.</p>
      <p>We will move your purchase to your personal Collection page.</p>
    </div>
  )
  return (
    <div>
      <div className="header">{address}</div>
      <div className="p-4">
        <h1 className="text-2xl py-2">Public Home - where creative work are put on display for purchase.</h1>
      </div>
      <div className="flex justify-center">
        <div className="px-4" style={{ maxWidth: '1600px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {
              nfts.map((nft, i) => (
                <div key={i} className="border shadow rounded-xl overflow-hidden bg-black">
                  <Image src={nft.image} width="325" height="475" alt="NFT on display" />
                  <div className="p-4 bg-white">
                    <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                    <div style={{ height: '70px', overflow: 'hidden' }}>
                      <p className="text-gray-400">{nft.description}</p>
                    </div>
                    <div style={{ height: '70px', overflowWrap: 'break-word' }}>
                      <p className="text-gray-400">{nft.seller}</p>
                    </div>
                  </div>
                    <div className="p-4 bg-black">
                      <p className="text-2xl mb-4 font-bold text-white">{nft.priceDesc} MATIC</p>
                      <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyFirebase(nft)}>
                        Buy
                      </button>
                    </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
