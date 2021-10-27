import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'

import Link from 'next/link'
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
  const [showModalMessage, setShowModalMessage] = useState('')
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
  useEffect(() => {
    if (window.ethereum) {
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
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    } else {
      console.log("Non-Ethereum browser detected. You should consider installing MetaMask.");
      setAddress("Non-Ethereum browser detected. You should consider installing MetaMask.")
    }
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
          orderBy("createdAt", "asc"));

        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          let item = {
            id: doc.id,
            price: data.price,
            name: data.name,
            image: data.fileUrl,
            seller: data.seller,
            sold: data.sold,
            description: data.description,
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
          let onSaleIndex = (sellerItems.length - 1) % ((new Date()).getHours())
          let descNotSoldItem = sellerItems.reduce((prev, current) => {
            return current.sold ? prev : current
          }, sellerItems[onSaleIndex])
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
    if (!window.ethereum) {
      setShowModalMessage("Unable to purchase without a crypto wallet. Please refresh screen to try again.")
    } else {
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
  if (showModalMessage) return (
    <div className="p-4">
      <div className="header">{address}</div>
      <p>{showModalMessage}</p>
    </div>
  )
  return (
    <div>
      <div className="header">{address}</div>
      <main>
        <section className="py-5 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-6 col-md-8 mx-auto">
              <h1 className="fw-light">Public Home</h1>
              <p className="lead text-muted">where creative work are put on display for purchase.</p>
            </div>
          </div>
        </section>
        <div className="album py-5 bg-light">
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {
                nfts.map((nft, i) => (
                  <div key={i} className="col">
                    <div className="card shadow-sm">
                      <div>
                        <Image src={nft.image} alt="NFT on display" width="100%" height="100%"  />
                      </div>
                      <div className="card-body">
                      <h5 className="card-title">{nft.name}</h5>
                      <p className="card-text">{nft.description}</p>
                      <p className="card-text"><small className="text-muted">{nft.seller}</small></p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group">
                          <Link href={{
                            pathname: "/by-artist",
                            query: {authorAddress: nft.seller}
                          }} >
                            <button type="button" className="btn btn-sm btn-outline-secondary">View</button>
                          </Link>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => buyFirebase(nft)}>Buy</button>
                        </div>
                        <small className="text-muted">{nft.priceDesc} MATIC</small>
                      </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
