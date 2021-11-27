import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'

import Carousel from 'react-bootstrap/Carousel';
import Pagination from 'react-bootstrap/Pagination';
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  nftaddress, nftmarketaddress, envChainName, envChainId, contract_owner
} from '../config'
import '../styles/Home.module.css'

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
  const [themeIndexes, updateThemeIndexes] = useState({ themeIndex: nextThemeIndex(), themeItemIndex: nextItemIndex(), title: `Week ${nextThemeIndex() + 1}` })
  const themes = [
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
  const [minimumBid, setMinimumBid] = useState(0.1)
  const [theme, setTheme] = useState()
  const [index, setIndex] = useState(0);
  const handleSelect = (selectedIndex, e) => {
    setIndex(selectedIndex);
  };

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
      throw `MetaMask is locked or the user has not connected any accounts`
    } else if (accounts[0] !== address) {
      setAddress(accounts[0])
      console.log("handleAccountsChanged event is fired", accounts[0]);
    }
  }
  function handleChainChanged(chainId) {
    console.log('handleChainChanged event is fired upon changing network', chainId);
    if (chainId !== envChainId) {
      throw `Error - Is MetaMask connected to ${envChainName}?`
    }
  }
  function handleConnect(info) {
    console.log('handleConnect event is fired upon changing network', info);
  }
  function handleDisconnect(error) {
    console.log('handleDisconnect event is fired upon changing network', error);
  }
  function handleNetworkChanged(newNetwork, oldNetwork) {
    console.log('handleNetworkChanged event is fired upon changing network', newNetwork, oldNetwork)
    // When a Provider makes its initial connection, it emits a "network"
    // event with a null oldNetwork along with the newNetwork. So, if the
    // oldNetwork exists, it represents a changing network
    if (oldNetwork) {
      window.location.reload()
    }
  }

  async function validateOnLoad() {
    if (window.ethereum) {
      try {
        let result = await Promise.all([
          window.ethereum.request({ method: 'eth_requestAccounts' }),
          window.ethereum.request({ method: 'eth_chainId' }),
          window.ethereum.request({ method: "wallet_requestPermissions",
            params: [
              {
                eth_accounts: {}
              }
            ]
          })
        ]).catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            throw 'Connection request has been rejected. Please refresh screen to try again.'
          } else {
            throw `Received an error message from your crypto wallet: ${err.message}`
          }
        })
        if (result) {
          let [accounts, chainId, permissions] = result
          handleAccountsChanged(accounts)
          handleChainChanged(chainId)
        }
      } catch(error) {
        setShowModalMessage(error.message || error)
      }
    } else {
      throw "Non-Ethereum browser detected. You should consider installing MetaMask."
    }
  }

  // useEffect(() => {
  //   try {
  //     validateOnLoad()
  //     window.ethereum.on('accountsChanged', handleAccountsChanged)
  //     window.ethereum.on('chainChanged', handleChainChanged)
  //     window.ethereum.on('connect', handleConnect)
  //     window.ethereum.on('disconnect', handleDisconnect)
  //       // Force page refreshes on network changes
  //       // The "any" network will allow spontaneous network changes
  //     let provider = new ethers.providers.Web3Provider(window.ethereum, "any")
  //     provider
  //       .on("network", handleNetworkChanged)
  //   } catch(error) {
  //     setShowModalMessage(error.message || error)
  //   }
  //   return function cleanup() {
  //     //mounted = false
  //   }
  // }, [])

  function endCountdownTime(targetDay) {
    return Math.floor(Date.now() / 1000) + (targetDay * 10)
  }

  function nextThemeIndex() {
    const b = new Date()
    const difference = Math.max(b.getUTCDate() - 27, 0)
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
    let groupByItems = groupBy(items, "theme")
    let theme = themes[themeIndexes.themeIndex]
    let saleItems = groupByItems[theme]
    let submitted = []
    let lowestBid = 0.1
    if (saleItems) {
      let maxSoldPrice = saleItems.reduce((prev, current) => {
        if (current.sold) {
          return Math.max(prev, current.price)
        } else {
          return prev
        }
      }, 0)

      // saleItems.forEach((item, i) => {
      //   if (i > themeIndexes.themeItemIndex) {
      //     item.image = '/patch-question.svg'
      //   }
      // });

      saleItems.push({
        id: 100,
        price: 100,
        name: 'king0',
        image: '/monkeyking0.png',
        seller: 'admin',
        sold: false,
        description: 'admin default',
        theme: theme
      })

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
        item.bidder_string = item.bidder ? [data.bidder.substr(0, 4), data.bidder.substr(38, 4)].join('...') : ''
        bidData.push(item)
      })
      submitted = bidData.filter(i => i.theme == theme)
      lowestBid = ((submitted[0]?.price || 0) + 0.2).toFixed(2)
    }
    setNfts(saleItems || [])
    setTheme(theme)
    lookupBidderAddress(submitted)
    setBids(submitted)
    setMinimumBid(lowestBid)
    setLoadingState('loaded')
  }

  async function lookupBidderAddress(arg) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.getDefaultProvider()
    for (var i=0; i<arg.length; i++) {
      let item = arg[i]
      if (item.bidder) {
        let bidder_address = await provider.lookupAddress(item.bidder)
        if (bidder_address) item.bidder_string = bidder_address
      }
    }
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

      const submitted = bidData.filter(i => i.theme.toUpperCase() === theme.toUpperCase())
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

          if (item.theme.toUpperCase() === theme.toUpperCase()) {
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
      setShowModalMessage(error.message || error)
    }
  }

  async function bid() {
    try {
      let bidAddress = await validateBidding()
      await commitBidding(bidAddress)
    } catch(error) {
      setShowModalMessage(error.message || error)
    }
    setShowModal(false)
    setShowModalMinting(false)
  }

  async function validateBidding() {
    if (window.ethereum) {
      await window.ethereum.request({ method: "wallet_requestPermissions",
        params: [
          {
            eth_accounts: {}
          }
        ]
      })

      let result = await Promise.all([
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        window.ethereum.request({ method: 'eth_chainId' })
      ]).catch((err) => {
        if (err.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          throw 'Connection request has been rejected. Please refresh screen to try again.'
        } else {
          throw `Received an error message from your crypto wallet: ${err.message}`
        }
      })
      if (result) {
        let [accounts, chainId] = result
        handleAccountsChanged(accounts)
        handleChainChanged(chainId)
        let balance = await window.ethereum.request({method: 'eth_getBalance', params: [accounts[0],"latest"] })
        let tokenBalance = parseInt(balance) / 10**18 // will need change based on what token
        if (tokenBalance < minimumBid) {
          throw "Error - Your wallet has a balance less than the Minimum Bid."
        }
        return accounts[0]
      }
    } else {
      throw "Non-Ethereum browser detected. You should consider installing MetaMask."
    }
  }

  async function commitBidding(bidAddress) {
    const firebaseConfig = {
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

    const submitted = bidData.filter(i => i.theme.toUpperCase() === theme.toUpperCase())
    var basePrice = 0
    var lastBidder = ''
    if (submitted.length > 0) {
      let winningBid = submitted.reduce((prev, curr) => {
        return prev.price > curr.price ? prev : curr;
      })
      basePrice = Number(winningBid.price)
      lastBidder = winningBid.bidder
    }
    console.log("*****basePrice", basePrice)
    console.log("*****Number(formInput.price)", Number(formInput.price))

    if (basePrice < Number(formInput.price)) {
      let eth_price = ethers.utils.parseUnits(formInput.price, 'ether')
      let eth_basePrice = ethers.utils.parseUnits(basePrice.toString(), 'ether')

      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection)
      const signer = provider.getSigner()

      setShowModal(true)
      setShowModalMinting(true)
      let contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
      let transaction = await contract.updateBid(lastBidder, eth_basePrice, {
        value: eth_price
      })
      await transaction.wait()

      const colRef = collection(db, 'auctions')
      addDoc(colRef, {
        price: Number(formInput.price),
        bidder: bidAddress,
        theme: theme,
        createdAt: Date.now()
      });

      updateThemeIndexes({ ...themeIndexes })
    } else {
      throw "Error - please enter a higher bid amount and try again."
    }
  }

  async function nextTheme() {
    settle(theme)
    updateThemeCountdown({ ...themeCountdown, themeEndTime: endCountdownTime(endThemeTime()), themeItemEndTime: endCountdownTime(endItemTime())})
    updateThemeIndexes({ ...themeIndexes, themeIndex: themeIndexes.themeIndex + 1, themeItemIndex: 0})
  }
  // async function loadNFTs() {
  //     const web3Modal = new Web3Modal({
  //       network: "mainnet",
  //       cacheProvider: true,
  //     })
  //   const connection = await web3Modal.connect()
  //   const provider = new ethers.providers.Web3Provider(connection)
  //   const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
  //   const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
  //   const data = await marketContract.fetchMarketItems()
  //
  //   const items = await Promise.all(data.map(async i => {
  //     const tokenUri = await tokenContract.tokenURI(i.tokenId)
  //     const meta = await axios.get(tokenUri)
  //     let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
  //     let item = {
  //       price,
  //       tokenId: i.tokenId.toNumber(),
  //       seller: i.seller,
  //       owner: i.owner,
  //       image: meta.data.image,
  //       name: meta.data.name,
  //       auction: i.auction,
  //       endTime: i.endTime,
  //       description: meta.data.description,
  //     }
  //     return item
  //   }))
  //   setNfts(items)
  //   setLoadingState('loaded')
  // }
  // async function buyFirebase(nft) {
  //   if (!window.ethereum) {
  //     setShowModalMessage("Unable to purchase without a crypto wallet. Please refresh screen to try again.")
  //   } else {
  //     setShowModal(true)
  //     const firebaseConfig = {
  //       // INSERT YOUR OWN CONFIG HERE
  //       apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
  //       authDomain: "pay-a-vegan.firebaseapp.com",
  //       databaseURL: "https://pay-a-vegan.firebaseio.com",
  //       projectId: "pay-a-vegan",
  //       storageBucket: "pay-a-vegan.appspot.com",
  //       messagingSenderId: "587888386485",
  //       appId: "1:587888386485:web:3a81137924d19cbe2439fc",
  //       measurementId: "G-MGJK6GF9YW"
  //     };
  //
  //     const app = initializeApp(firebaseConfig)
  //
  //     const db = getFirestore(app)
  //     const characterRef = doc(db, "characters", nft.id);
  //     // Set the "capital" field of the city 'DC'
  //     await updateDoc(characterRef, {
  //       sold: true,
  //       owner: address,
  //       price: nft.price
  //     });
  //     setShowModal(false)
  //     //loadFirebase()
  //
  //     router.push('/my-purchase')
  //   }
  // }
  // async function buyNft(nft) {
  //   setShowModal(true)
  //   const web3Modal = new Web3Modal()
  //   const connection = await web3Modal.connect()
  //   const provider = new ethers.providers.Web3Provider(connection)
  //   const signer = provider.getSigner()
  //   const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
  //
  //   const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
  //   const transaction = await contract.createMarketSale(Market, nft.tokenId, {
  //     value: price
  //   })
  //   await transaction.wait()
  //   setShowModal(false)
  //   loadNFTs()
  // }
  if (showModal) return (
    <div className="p-4">
      <p>Please wait. Your METAMASK wallet will prompt you once for minting your NFT Character token.</p>
      <p>{errorMessage}</p>
      <div className="loader"></div>
    </div>
  )
  if (showModalMessage) return (
    <div className="p-4">
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
      <main>
        <div className="row">
          <div className="col-md">
            <div className="album py-5">
              <div className="container">
                <div className="w300-px-wide">
                {
                  themeIndexes.themeIndex > nextThemeIndex() ?
                  (
                    <div>
                      <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
                      <p className="px-20 py-10">More creative work coming soon.</p>
                    </div>
                  ) : (
                    nfts.length ? (
                      <Carousel activeIndex={index} onSelect={handleSelect}>
                         {nfts.map((nft, i) => {
                          return (
                            <Carousel.Item key={i} style={{width: '460px', height: '580px'}}>
                              <Image
                                height="580px"
                                width="460px"
                                src={nft.image}
                                alt="slider image"
                              />
                            </Carousel.Item>
                          )
                        })}
                      </Carousel>
                    ) : (
                      <div>
                        <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>
                      </div>
                    )
                  )
                }
                </div>
              </div>
            </div>
          </div>
          <div className="col-md">
            <div className="card">
              <div className="card-header">
                <div className="row">
                  <div className="col-md">
                    <div className="container d-flex h-100">
                      <div className="justify-content-center align-self-center">
                       <h5 className="my-auto text-danger">{themeIndexes.title}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="col-md">
                    <div className="container d-flex h-100">
                      <div className="justify-content-center align-self-center">
                        <Pagination>
                          <Pagination.First onClick={() => updateThemeIndexes({...themeIndexes, themeIndex: 0, title: 'Week 1'})} />
                          <Pagination.Prev onClick={() => updateThemeIndexes({...themeIndexes, themeIndex: Math.max(0, themeIndexes.themeIndex - 1), title: `Week ${Math.max(1, themeIndexes.themeIndex)}`})} />
                          <Pagination.Next onClick={() => updateThemeIndexes({...themeIndexes, themeIndex: Math.min(themes.length - 1, themeIndexes.themeIndex + 1), title: `Week ${Math.min(themes.length, themeIndexes.themeIndex + 2)}`})} />
                          <Pagination.Last onClick={() => updateThemeIndexes({...themeIndexes, themeIndex: themes.length - 1, title: `Week ${themes.length}`})} />
                        </Pagination>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row mb-6">
                  <h2 className="card-title">{theme}</h2>
                </div>
                {
                  themeIndexes.themeIndex === nextThemeIndex() &&
                  (
                    <div className="row mb-6">
                      <div className="col-md">
                          <div className="col">
                            <h6 className="card-subtitle mb-2 text-muted">Current Bid</h6>
                            <h2 className="card-subtitle mb-2">{bids[0]?.price} eth</h2>
                          </div>
                      </div>
                      <div className="col-md">
                          <div className="justify-content-center align-self-center">
                          <h6 className="card-subtitle mb-2 text-muted">Ends in</h6>
                          <h2 className="card-subtitle mb-2">
                            <Clock endTime={themeCountdown.themeEndTime} trigger={() => nextTheme()} />
                          </h2>
                        </div>
                      </div>
                    </div>
                  )
                }
                {
                  themeIndexes.themeIndex < nextThemeIndex() &&
                  (
                    <div className="row mb-6">
                      <div className="col-md">
                      {
                        bids.length ? (
                          <div className="col">
                            <h6 className="card-subtitle mb-2 text-muted">Winning Bid</h6>
                            <h2 className="card-subtitle mb-2">{bids[0]?.price} eth</h2>
                          </div>
                        ) : (
                          <div className="col">
                            <h6 className="card-subtitle mb-2 text-muted">Winning Bid</h6>
                            <h2 className="card-subtitle mb-2">N/A</h2>
                          </div>
                        )
                      }
                      </div>
                      <div className="col-md">
                        <div className="justify-content-center align-self-center">
                          <h6 className="card-subtitle mb-2 text-muted">Winner</h6>
                          {
                            bids.length ? (
                              <div>
                                <h2 className="card-subtitle mb-2">{bids[0]?.bidder_string}</h2>
                                {
                                  bids[0].bidder.toUpperCase() === address.toUpperCase() &&
                                  <Link href="/themes">
                                    <a className="btn bouton-image-mint"></a>
                                  </Link>
                                }
                              </div>
                            ) : (
                              <div>
                                <h2 className="card-subtitle mb-2">N/A</h2>
                              </div>
                            )
                          }
                        </div>
                      </div>
                    </div>
                  )
                }
                {
                  themeIndexes.themeIndex === nextThemeIndex() &&
                  (
                    <div>
                      <div className="row mb-6">
                        <div className="col-md">
                          <h6 className="card-subtitle mb-2 text-muted">Minimum Bid:{minimumBid} eth</h6>
                          <input
                            placeholder="ETH"
                            className="mt-2 border rounded p-1"
                            value={formInput.price}
                            onChange={(event) => {
                              if (isFinite(event.target.value)) {
                                updateFormInput({ ...formInput, price: event.target.value});
                              }
                            }}
                          />
                        </div>
                        <div className="col-md">
                            <button className="btn bouton-image" onClick={bid}>
                            </button>
                        </div>
                      </div>
                    </div>
                  )
                }
                {
                  themeIndexes.themeIndex > nextThemeIndex() ?
                  (
                    <div className="row mb-6">
                      <p>Auction has not started yet.</p>
                    </div>
                  ) : (
                    <div className="row mb-6">
                      {
                        bids.length ?
                        (
                          bids.map((bid, i) => (
                            <div key={i}>
                            {
                              i == 0 ? (
                                <div className="row mb-3">
                                  <div className="col-4 themed-grid-col bg-warning">
                                    <div className="justify-content-center align-self-center">
                                      <span className="glyphicon one-fine-red-dot"></span>
                                      <small className="text-muted">
                                      {
                                        bid.bidder_string
                                      }
                                      </small>
                                    </div>
                                  </div>
                                  <div className="col-4 themed-grid-col bg-warning">
                                    <small className="text-muted">{bid.price} MATIC</small>
                                  </div>
                                </div>
                              ) : (
                                <div className="row mb-3">
                                  <div className="col-4 themed-grid-col">
                                    <small className="text-muted">
                                    {
                                      bid.bidder_string
                                    }
                                    </small>
                                  </div>
                                  <div className="col-4 themed-grid-col">
                                    <small className="text-muted">{bid.price} MATIC</small>
                                  </div>
                                </div>
                              )
                            }
                            </div>
                          ))
                        ) : (
                          themeIndexes.themeIndex < nextThemeIndex() ?
                          (
                            <div className="row mb-6">
                              <p>Auction has expired.</p>
                            </div>
                          ) : (
                            <div className="row mb-6">
                              <p>No submitted bids yet.</p>
                            </div>
                          )
                        )
                      }
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
