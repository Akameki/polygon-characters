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

import Clock from './Clock'
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
  const [showModalMinting, setShowModalMinting] = useState(false);
  const [showModalMessage, setShowModalMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const [themeIndexes, updateThemeIndexes] = useState({ themeIndex: nextThemeIndex(), themeItemIndex: nextItemIndex() })
  const themes = ["Courage and Perseverance","Crypto",
    "Monkey King Adventure",
    "Monkey King Back To School",
    "Monkey King Office Survival",
    "Monkey King Stone Age",
    "Monkey King Spy World",
    "Monkey King Pirates",
    "Monkey King Assassin",
    "Monkey King Zodiac",
    "Monkey King Ghost Hunter",
    "Monkey King in Wonderland",
    "Monkey King Space Ranger",
    "Monkey King Halloween",
    "Monkey King Hip Hop",
    "Monkey King Babyland",
    "Monkey King Wild Wild West"]
  const [themeCountdown, updateThemeCountdown] = useState({ themeEndTime: endCountdownTime(endThemeTime()), themeItemEndTime: endCountdownTime(endItemTime()) })

  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const [bids, setBids] = useState([])
  const [showAuction, setShowAuction] = useState(false)
  const [theme, setTheme] = useState()
  const [connectToWallet, setConnectToWallet] = useState(false)

  function endThemeTime() {
    const d = new Date()
    let hour = d.getUTCHours()
    let minutes = d.getUTCMinutes()
    return (24 - hour) *60*6 - (minutes * 6)
    //return 9
  }

  function endItemTime() {
    const d = new Date()
    let minutes = d.getUTCMinutes()
    return (60 - minutes) * 6
    //return 1
  }

  function nextItemIndex() {
    const d = new Date();
    let hour = d.getUTCHours();
    return hour
  }

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
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
      setConnectToWallet(false)
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
      setConnectToWallet(true)
    } else {
      setConnectToWallet(true)
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
      setAddress("Non-Ethereum browser detected. You should consider installing MetaMask.")
    }
    return function cleanup() {
      //mounted = false
    }
  }, [])

  function endCountdownTime(targetDay) {
    return Math.floor(Date.now() / 1000) + (targetDay * 10)
  }

  function nextThemeIndex() {
    const b = new Date()
    const difference = Math.max(b.getUTCDate() - 11, 0)
    return difference
  }

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
      orderBy("theme"),
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
        theme: data.theme
      }

      items.push(item)
    })
    let showcaseItems = []
    let groupByItems = groupBy(items, "theme")

    //if (themeIndexes.themeIndex < themes.length)
    let theme = themes[themeIndexes.themeIndex]
    let saleItems = groupByItems[theme]
    if (saleItems) {
    //if (themeIndexes.themeIndex < (Object.keys(groupByItems).length)) {
      //let groupByIndex = themeIndexes.themeIndex
      //let theme = Object.keys(groupByItems)[groupByIndex]
      setTheme(theme)
      //let saleItems = groupByItems[theme]
      let maxSoldPrice = saleItems.reduce((prev, current) => {
        if (current.sold) {
          return Math.max(prev, current.price)
        } else {
          return prev
        }
      }, 0)

      saleItems.forEach((item, i) => {
        if (i > themeIndexes.themeItemIndex) {
          item.image = '/patch-question.svg'
        }
      });

      setNfts(saleItems)

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

      const submitted = bidData.filter(i => i.theme == theme)
      setBids(submitted)
    } else {
      setShowModalMessage("This is the end of auctions.")
    }

    setLoadingState('loaded')
  }

    async function settle() {
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

      const submitted = bidData.filter(i => i.theme == theme)
      if (submitted.length > 0) {
        let winningBid = submitted.reduce((prev, curr) => {
          return prev.price > curr.price ? prev : curr;
        })

        const nounsRef = collection(db, "characters");
        const q = query(nounsRef,
          orderBy("theme"),
          orderBy("createdAt", "asc"));

        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((queryDoc) => {
          let data = queryDoc.data();
          let item = {
            id: queryDoc.id,
            price: data.price,
            name: data.name,
            image: data.fileUrl,
            seller: data.seller,
            sold: data.sold,
            description: data.description,
            theme: data.theme
          }

          if (item.theme == theme) {
            const characterRef = doc(db, "characters", item.id);
            // Set the "capital" field of the city 'DC'
            updateDoc(characterRef, {
              owner: winningBid.bidder
            });
          }
        })
        setShowModalMinting(false)
      }
      setLoadingState('loaded')
    }

  useEffect(() => {
    //loadNFTs()

    loadFirebase()
    return function cleanup() {
      //mounted = false
    }
  }, [themeIndexes])


  async function mintFirebase(nft) {
    try {
      setShowModal(true)
      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      /* next, create the item */
      let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
      let transaction = await contract.createToken(nft.image)
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
      //loadFirebase()
    } catch (error) {
      setShowModalMessage(error.message)
    }
  }

  async function bid() {
    if (!window.ethereum || !address) {
      setShowModalMessage("Unable to purchase without a crypto wallet. Please refresh screen to try again.")
    } else {
      try {
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

        const submitted = bidData.filter(i => i.theme == theme)
        var basePrice = 0
        var lastBidder = ''
        if (submitted.length > 0) {
          let winningBid = submitted.reduce((prev, curr) => {
            return prev.price > curr.price ? prev : curr;
          })
          basePrice = Number(winningBid.price)
          lastBidder = winningBid.bidder
        }
        setShowModal(true)
        setShowModalMinting(true)
        setShowModalMessage('')
        if (basePrice < Number(formInput.price)) {
          const colRef = collection(db, 'auctions')
          addDoc(colRef, {
            price: Number(formInput.price),
            bidder: address,
            theme: theme,
            createdAt: Date.now()
          });

          let eth_price = ethers.utils.parseUnits(formInput.price, 'ether')
          let eth_basePrice = ethers.utils.parseUnits(basePrice.toString(), 'ether')

          const web3Modal = new Web3Modal()
          const connection = await web3Modal.connect()
          const provider = new ethers.providers.Web3Provider(connection)
          const signer = provider.getSigner()

          /* next, create the item */
          let contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
          //const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
          let transaction = await contract.updateBid(lastBidder, eth_basePrice, {
            value: eth_price
          })
          await transaction.wait()
          updateThemeIndexes({ ...themeIndexes })
        } else {
          setShowModalMessage("Error - please enter a higher bid amount and try again.")
        }
      } catch (error) {
        setShowModalMessage(error.message)
      }
      setShowModal(false)
      setShowModalMinting(false)
    }
  }

  async function nextTheme() {
    if (connectToWallet) settle()
    updateThemeCountdown({ ...themeCountdown, themeEndTime: endCountdownTime(endThemeTime()), themeItemEndTime: endCountdownTime(endItemTime())})
    updateThemeIndexes({ ...themeIndexes, themeIndex: themeIndexes.themeIndex + 1, themeItemIndex: 0})
  }
  async function nextThemeItem() {
    updateThemeCountdown({ ...themeCountdown, themeItemEndTime: endCountdownTime(endItemTime())})
    updateThemeIndexes({ ...themeIndexes, themeItemIndex: themeIndexes.themeItemIndex + 1})
  }
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
    const transaction = await contract.createMarketSale(Market, nft.tokenId, {
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
      <p>Please wait. Your METAMASK wallet will prompt you once for minting your NFT Character token.</p>
      <p>{errorMessage}</p>
      <div className="loader"></div>
    </div>
  )
  if (showModalMessage) return (
    <div className="p-4">
      <div className="header">{address}</div>
      <p>{showModalMessage}</p>
    </div>
  )
  if (showModalMinting) return (
    <div className="p-4">
      <p>Please wait. We are waiting for Smart Contract to finish processing.</p>
      <p>{errorMessage}</p>
      {!errorMessage && <div className="loader4Color"></div>}
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
              <p className="lead text-muted">From Monday - Friday, we showcase one item from each theme.</p>
            </div>
          </div>
          <div className="row">
            <div className="col-md">
                <h2 className="text-2xl">Countdown to next theme.</h2>
                <Clock endTime={themeCountdown.themeEndTime} trigger={() => nextTheme()} />
            </div>
          </div>
        </section>
        <div className="row">
          <div className="col-md">
            <div className="album py-5 bg-light">
              <div className="container">
                <div className="row">
                  <div className="col-md">
                      <h2 className="text-xl">Countdown to next item.</h2>
                      <Clock endTime={themeCountdown.themeItemEndTime} trigger={() => nextThemeItem()} />
                  </div>
                </div>
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                  {
                    nfts.map((nft, i) => (
                      <div key={i} className="col">
                        <div className="card shadow-sm">
                          <div className="card-header text-center">
                            {nft.theme}
                          </div>
                          <div>
                            <Image src={nft.image} alt="NFT on display" width="100%" height="100%"  />
                          </div>
                          <div className="card-body">
                            <h5 className="card-title">{nft.name}</h5>
                            <p className="card-text">{nft.description}</p>
                            <p className="card-text"><small className="text-muted">{nft.seller}</small></p>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="col-md">
            {
              bids.map((bid, i) => (
                <div key={i} className="row mb-3">
                  <div className="col-4 themed-grid-col"><small className="text-muted">{bid.price} MATIC</small></div>
                  <div className="col-4 themed-grid-col"><small className="text-muted">{bid.createdAt}</small></div>
                  <div className="col-4 themed-grid-col"><small className="text-muted">{bid.bidder}</small></div>
                </div>
              ))
            }
            {
              (bids.length == 0) && <p>No submitted bids yet.</p>
            }
            {
              <div>
                <div className="flex justify-center">
                  <div className="w-1/2 flex flex-col pb-12">
                    <input
                      placeholder="Character Price in MATIC"
                      className="mt-2 border rounded p-4"
                      value={formInput.price}
                      onChange={(event) => {
                        if (isFinite(event.target.value)) {
                          updateFormInput({ ...formInput, price: event.target.value});
                        }
                      }}
                    />
                    <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={bid}>
                      Submit Bid
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  )
}
