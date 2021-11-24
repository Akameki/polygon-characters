import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'
import {
  nftmarketaddress, nftaddress
} from '../config'
import monkeymint_config from '../monkeymint_config.json'
import { useRouter } from 'next/router'

import Link from 'next/link'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where} from "firebase/firestore";

export default function ByAuthor() {
  const [nfts, setNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bought, setBought] = useState([])
  const [timers, updateTimers] = useState([])
  const [showModal, setShowModal] = useState(false);
  const [showModalMinting, setShowModalMinting] = useState(false);
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { home } = router.query

  async function getMETT(currentAccount) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)

    const tokenBalance = await contract.balanceOf(currentAccount);
    console.log({ tokenBalance: tokenBalance.toString() });
  }

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
    }
  }

  // While you are awaiting the call to eth_requestAccounts, you should disable
  // any buttons the user can click to initiate the request.
  // MetaMask will reject any additional requests while the first is still
  // pending.

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
      setAddress("Non-Ethereum browser detected. You should consider installing MetaMask.")
    }
    return function cleanup() {
      //mounted = false
    }
  }, [])

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

    const auctionRef = collection(db, "auctions");
    const auction_query = query(auctionRef,
      orderBy("theme"),
      orderBy("createdAt", "desc"));
    const auctionQuerySnapshot = await getDocs(auction_query);
    const bidData = [];
    auctionQuerySnapshot.forEach((doc) => {
      let data = doc.data();
      let item = {
        id: doc.id,
        price: data.price,
        theme: data.theme,
        bidder: data.bidder,
        createdAt: new Date(data.createdAt).toString()
      }
      bidData.push(item)
    })

    const nounsRef = collection(db, "characters");
    const q = query(nounsRef,
      orderBy("theme"),
      orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      let character = doc.data();
      let item = {
        id: doc.id,
        price: character.price,
        image: character.fileUrl,
        name: character.name,
        description: character.description,
        sold: character.sold,
        seller: character.seller,
        owner: character.owner,
        minted: character.minted,
        theme: character.theme
      }
      items.push(item)
    })
    const myItems = items.filter(i => i.owner == address)

    myItems.forEach((item, i) => {
      const submitted = bidData.filter(bid => bid.theme == item.theme)
      var basePrice = 0
      var lastBidder = ''
      if (submitted.length > 0) {
        let winningBid = submitted.reduce((prev, curr) => {
          return prev.price > curr.price ? prev : curr;
        })
        basePrice = Number(winningBid.price)
        lastBidder = winningBid.bidder
      }
      item.winningBid = basePrice
      item.winningBidder = lastBidder
    });

    setNfts(myItems)
    setLoadingState('loaded')
  }

  useEffect(() => {
    loadFirebase()

    return function cleanup() {
      //mounted = false
    }
  }, [address])

  async function mintFirebase(nft) {
    try {
      setShowModal(true)
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      /* next, create the item */
      let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
      let m = monkeymint_config[nft.name]
      let transaction = await contract.createToken(m.uri)
      setShowModal(false)
      setShowModalMinting(true)
      let tx = await transaction.wait()
      let event = tx.events[0]
      let value = event.args[2]
      let tokenId = value.toNumber()

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
        minted: true
      });
      setShowModalMinting(false)
      loadFirebase()
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsCreated()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        sold: i.sold,
        auction: i.auction,
        endTime: i.endTime,
        image: meta.data.image,
      }
      return item
    }))

    const boughtData = await marketContract.fetchMyNFTs()

    const bougntItems = await Promise.all(boughtData.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        sold: i.sold,
        image: meta.data.image,
      }
      return item
    }))
    /* create a filtered array of items that have been sold */
    const soldItems = items.filter(i => i.sold)
    setSold(soldItems)
    setNfts(items)
    setBought(bougntItems)
    setLoadingState('loaded')
  }
  if (loadingState === 'loaded' && !nfts.length && !bought.length) return (
    <div>
      <main>
        <section className="py-5 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-6 col-md-8 mx-auto">
              <h1 className="fw-light">Mint Your Own Themes</h1>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
  if (showModal) return (
    <div>
      <div className="header">{address}</div>
      <div className="p-4">
        <p>Please wait. Your METAMASK wallet will prompt you once for minting your NFT Character token.</p>
        <p>{errorMessage}</p>
        <div className="loader"></div>
      </div>
    </div>
  )
  if (showModalMinting) return (
    <div>
      <div className="header">{address}</div>
      <div className="p-4">
        <p>Please wait. We are waiting for Smart Contract to finish processing.</p>
        <p>{errorMessage}</p>
        {!errorMessage && <div className="loader4Color"></div>}
      </div>
    </div>
  )
  return (
    <div>
      <main>
        <section className="py-5 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-6 col-md-8 mx-auto">
              <h1 className="fw-light">Mint Your Own Themes</h1>
            </div>
          </div>
        </section>
        <div className="album py-5 bg-light">
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {
                nfts.map((nft, i) => (
                  <div key={i} className="col">
                    <div className="card shadow-sm border-5">
                      <div className="card-header text-center">
                        {nft.theme}
                      </div>
                      <div>
                        <Image src={nft.image} alt="NFT series" width="100%" height="100%"  />
                      </div>
                      <div className="card-body">
                      <h5 className="card-title">{nft.name}</h5>
                      <p className="card-text">{nft.description}</p>
                      <p className="card-text"><small className="text-muted">{nft.winningBidder}</small></p>
                      <div className="d-flex justify-content-between align-items-center">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => mintFirebase(nft)}>Mint</button>
                        <small className="text-muted">{nft.winningBid} MATIC</small>
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
