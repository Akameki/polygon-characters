import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
//import Web3Modal from "web3modal"
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
import { onSnapshot, getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where } from "firebase/firestore";

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [biddingState, setBiddingState] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showModalMinting, setShowModalMinting] = useState(false)
  const [showModalMessage, setShowModalMessage] = useState('')
  const [modalMessage, setModalMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const [themeIndexes, updateThemeIndexes] = useState({ themeIndex: nextThemeIndex(), themeItemIndex: nextItemIndex(), title: `Week ${nextThemeIndex() + 1}` })
  const themes = [
    "Monkey King: Classic",
    "Monkey King: Back to School",
    "Monkey King: Pirates"]
  const themes2 = [
    "Monkey King Adventure",
    "Monkey King Office Survival",
    "Monkey King: Arabic Night",
    "Monkey King Stone Age",
    "Monkey King Spy World",
    "Monkey King Assassin",
    "Monkey King Zodiac",
    "Monkey King Ghost Hunter",
    "Monkey King in Wonderland",
    "Monkey King Space Ranger",
    "Monkey King Halloween",
    "Monkey King Hip Hop",
    "Monkey King Babyland",
    "Monkey King Wild Wild West"]
  const [themeCountdown, updateThemeCountdown] = useState({ themeEndTime: endThemeTime() })
  const [formInput, updateFormInput] = useState({ price: ''})
  const [bids, setBids] = useState([])
  const [minimumBid, setMinimumBid] = useState(0.1)
  const [index, setIndex] = useState(0)
  const handleSelect = (selectedIndex, e) => {
    setIndex(selectedIndex)
  }

  function startTime() {
    return new Date('Dec 15 2021 5:00:00 EST')
  }

  function nextThemeIndex() {
    const d = new Date()
    let differenceInMinutes = Math.floor((d - startTime()) / (60 * 1000)) //  (testing)
    let differenceInHours = Math.floor((d - startTime()) / (60 * 60 * 1000)) //  (testing)
    let differenceInDays = Math.floor((d - startTime()) / (24 * 60 * 60 * 1000)) //production
    return differenceInDays
  }

  function endThemeTime() {
    const d = new Date()
    let duration = 24 * 60 * 60 * (1 + nextThemeIndex())
    let differenceInSeconds = Math.floor((d - startTime()) / (1000))
    return Math.floor(Date.now() / 1000) + (duration - differenceInSeconds)
  }

  function nextItemIndex() {
    const d = new Date()
    let hour = d.getUTCHours()
    let startHour = startTime().getUTCHours()
    //return 0 //a constant number of revealed figures
    return Math.floor((hour - startHour) / 5) //every 3 hours
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

    const nounsRef = collection(db, "characters")
    const q = query(nounsRef, orderBy("theme"), orderBy("order"))
    const querySnapshot = await getDocs(q)
    const items = []
    querySnapshot.forEach((doc) => {
      let data = doc.data()
      let item = {
        id: doc.id,
        price: data.price,
        name: data.name,
        image: data.fileUrl,
        maskUrl: data.maskUrl,
        seller: data.seller,
        sold: data.sold,
        description: data.description,
        theme: data.theme.toUpperCase()
      }
      items.push(item)
    })
    let groupByItems = groupBy(items, "theme")
    if (themeIndexes.themeIndex < themes.length) {
      let current_theme = themes[themeIndexes.themeIndex]
      let saleItems = groupByItems[current_theme.toUpperCase()]
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

        saleItems.forEach((item, i) => {
          if (item.theme === current_theme.toUpperCase()) {
            if (i > themeIndexes.themeItemIndex) {
              if (item.maskUrl) {
                item.image = item.maskUrl
              }
            }
          }
        })
      }

      const themesRef = collection(db, "character-themes")
      const themesQuery = query(themesRef, where("name", "==", current_theme))
      const themesQuerySnapshot = await getDocs(themesQuery)
      const bidData = []
      themesQuerySnapshot.forEach((doc) => {
        let data = doc.data()
        let bids = (data.bids || []).sort((a, b) => {
          return b.createdAt - a.createdAt
        })
        bids.forEach((bid, i) => {
          let item = {
            id: doc.id,
            price: bid.price,
            theme: data.name,
            bidder: bid.bidder,
            createdAt: new Date(bid.createdAt).toString()
          }
          item.bidder_string = item.bidder ? [item.bidder.substr(0, 4), item.bidder.substr(38, 4)].join('...') : ''
          bidData.push(item)
        })
      })

      lowestBid = ((bidData[0]?.price || 0) + 0.2).toFixed(2)

      setNfts(saleItems || [])
      lookupBidderAddress(bidData)
      setBids(bidData)
      setMinimumBid(lowestBid)
      setLoadingState('loaded')
    } else {
      setShowModalMessage("Monkey King auction has ended")
    }
  }

  async function lookupBidderAddress(arg) {
    const provider = new ethers.getDefaultProvider()
    for (var i=0; i<arg.length; i++) {
      let item = arg[i]
      if (item.bidder) {
        let bidder_address = await provider.lookupAddress(item.bidder)
        if (bidder_address) item.bidder_string = bidder_address
      }
    }
  }

  useEffect(() => {
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
    }
    let firebase = initializeApp(firebaseConfig)
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    const themesRef = collection(db, "character-themes")
    var unsub = {}
    if (themeIndexes.themeIndex < themes.length) {
      let current_theme = themes[themeIndexes.themeIndex]
      const q = query(themesRef, where("name", "==", current_theme)) //theme
      unsub = onSnapshot(q, (querySnapshot) => {
        loadFirebase()
      })

      loadFirebase()
    } else {
      setShowModalMessage("Monkey King auction has ended.")
    }

    return function cleanup() {
      //mounted = false
      unsub()
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
      const characterRef = doc(db, "characters", nft.id)
      await updateDoc(characterRef, {
        minted: true
      })
      setShowModalMinting(false)
      //loadFirebase()
    } catch (error) {
      setShowModalMessage(error.message || error)
    }
  }

  async function bid() {
    setBiddingState(true)
    try {
      let bidAddress = await validateBidding()
      await commitBidding(bidAddress)
    } catch(error) {
      setModalMessage(error)
    }
    setBiddingState(false)
    setShowModal(false)
    setShowModalMinting(false)
  }

  async function validateWalletRequestPermissions() {
      try {
        let permissions = await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [
              {
                eth_accounts: {}
              }
            ]
          })
          const accountsPermission = permissions.find(
            (permission) => permission.parentCapability === 'eth_accounts'
          )
          if (accountsPermission) {
            console.log('eth_accounts permission successfully requested!')
          }
      } catch(error) {
          console.log('****validateWalletRequestPermissions error', error)
          if (error.code === 4001) {
            throw {title: 'Error - Please check your wallet and try again', message: 'Connection request has been rejected. '}
          } else if (error.code === -32601) {
            throw {title: 'Error - Please check your wallet and try again', message: 'Permissions needed to continue.'}
          } else if (error.code === -32002) {
            throw {title: 'Error - Please check your wallet and try again', message: error.message}
          } else {
            throw {title: 'Error - Please check your wallet and try again', message: error.message}
          }
      }
  }

  async function validateBidding() {
    if (window.ethereum) {
      try {
        await validateWalletRequestPermissions()
      } catch(error) {
        console.log("****validateWalletRequestPermissions", error)
        //do not rethrow because Brave wallet does not yet support wallet_requestPermissions
      }
      let result = await Promise.all([
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        window.ethereum.request({ method: 'eth_chainId' })
      ]).catch((error) => {
        console.log('****validateBidding error', error)
        if (error.code === 4001) {
          throw {title: 'Error - Please check your wallet and try again', message: 'Connection request has been rejected. '}
        } else if (error.code === -32002) {
          throw {title: 'Error - Please check your wallet and try again', message: error.message}
        } else {
          throw {title: 'Error - Please check your wallet and try again', message: error.message}
        }
      })
      if (result) {
        console.log('****validateBidding result', result)
        let [accounts, chainId] = result
        if (accounts.length === 0) {
          throw {title: 'Error - Please check your wallet and try again', message: `MetaMask is locked or the user has not connected any accounts`}
        }
        if (chainId !== envChainId) {
          throw {title: 'Error - Please check your wallet and try again', message: `Error - Is your wallet connected to ${envChainName}?`}
        }
        let balance = await window.ethereum.request({method: 'eth_getBalance', params: [accounts[0], "latest"] })
        let tokenBalance = parseInt(balance) / 10**18 // will need change based on what token
        let account = [accounts[0].substr(0, 4), accounts[0].substr(38, 4)].join('...')
        if (tokenBalance < minimumBid) {
          throw {title: 'Error - Please check your wallet and try again', message: `Your account ${account} has a balance less than the Minimum Bid.`}
        }
        return accounts[0]
      }
    } else {
      throw {title: 'Error - Non-Ethereum browser detected.', message: 'You should consider installing MetaMask'}
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
    }

    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    const themesRef = collection(db, "character-themes")
    const q = query(themesRef, where("name", "==", themes[themeIndexes.themeIndex]))
    const querySnapshot = await getDocs(q)
    const bidData = []
    querySnapshot.forEach((doc) => {
      let data = doc.data()
      let bids = (data.bids || []).sort((a, b) => {
        return a.createdAt < b.createdAt
      })
      bids.forEach((bid, i) => {
        let item = {
          id: doc.id,
          price: bid.price,
          theme: data.name,
          bidder: bid.bidder,
          createdAt: new Date(bid.createdAt).toString()
        }
        item.bidder_string = item.bidder ? [item.bidder.substr(0, 4), item.bidder.substr(38, 4)].join('...') : ''
        bidData.push(item)
      })
    })

    const submitted = bidData.filter(i => i.theme.toUpperCase() === theme.toUpperCase())
    var basePrice = 0
    var lastBidder = contract_owner
    if (submitted.length > 0) {
      let winningBid = submitted.reduce((prev, curr) => {
        return prev.price > curr.price ? prev : curr;
      })
      basePrice = Number(winningBid.price)
      lastBidder = winningBid.bidder
    }

    if (basePrice < Number(formInput.price)) {
      let eth_price = ethers.utils.parseUnits(formInput.price, 'ether')
      let eth_basePrice = ethers.utils.parseUnits(basePrice.toString(), 'ether')
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      setShowModal(true)
      setShowModalMinting(true)
      let contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
      try {
        let transaction = await contract.updateBid(lastBidder, eth_basePrice, {
          value: eth_price
        })
        await transaction.wait()
      } catch(error) {
        if (error.code === -32603) {
          throw {title: 'Error - Please check your wallet and try again.', message: 'It is very possible that the RPC endpoint you are using to connect to the network with MetaMask is congested or experiencing technical problems'}
        } else {
          throw {title: 'Error - Please check your wallet and try again.', message: error.message}
        }
      }

      const themesRef = collection(db, "character-themes")
      const q = query(themesRef, where("name", "==", themes[themeIndexes.themeIndex]))
      const querySnapshot = await getDocs(q)
      querySnapshot.forEach((doc) => {
        let data = doc.data()
        updateDoc(doc.ref, {
            bids: [...(data.bids || []), {
              price: Number(formInput.price),
              bidder: bidAddress,
              createdAt: Date.now()
            }]
        })
      })

      updateThemeIndexes({ ...themeIndexes })
    } else {
      throw {title: 'Error - Please enter a higher bid amount and try again.', message: ''}
    }
  }

  async function nextTheme() {
    //updateThemeCountdown({ ...themeCountdown, themeEndTime: endThemeTime()})
    //updateThemeCountdown({ ...themeCountdown, themeEndTime: endCountdownTime(endThemeTime()), themeItemEndTime: endCountdownTime(endItemTime())})
    //updateThemeIndexes({ ...themeIndexes, themeIndex: themeIndexes.themeIndex + 1, themeItemIndex: 0, title: `Week ${themeIndexes.themeIndex + 2}`})
  }

  if (showModal) return (
    <div className="modal modal-signin position-static d-block bg-secondary py-5" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content rounded-5 shadow">
          <div className="modal-header p-5 pb-4 border-bottom-0">
            <h2 className="fw-bold mb-0">Please wait. Your wallet will prompt you for minting your NFT Character token.</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalMessage(false)}></button>
          </div>

          <div className="modal-body p-5 pt-0">
            <div className="p-4">
              <p>{errorMessage}</p>
              <div className="loader"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (showModalMessage) return (
    <div className="modal modal-signin position-static d-block bg-secondary py-5" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content rounded-5 shadow">
          <div className="modal-header p-5 pb-4 border-bottom-0">
            <h2 className="fw-bold mb-0">{showModalMessage}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalMessage(false)}></button>
          </div>

          <div className="modal-body p-5 pt-0">
            <div className="p-4">
              <p></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  if (modalMessage) return (
    <div className="modal modal-signin position-static d-block bg-secondary py-5" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content rounded-5 shadow">
          <div className="modal-header p-5 pb-4 border-bottom-0">
            <h2 className="fw-bold mb-0">{modalMessage.title}</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalMessage(false)}></button>
          </div>

          <div className="modal-body p-5 pt-0">
            <div className="p-4">
              <p>{modalMessage.message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  if (showModalMinting) return (
    <div className="modal modal-signin position-static d-block bg-secondary py-5" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content rounded-5 shadow">
          <div className="modal-header p-5 pb-4 border-bottom-0">
            <h2 className="fw-bold mb-0">Please wait. We are waiting for Smart Contract to finish processing.</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalMessage(false)}></button>
          </div>

          <div className="modal-body p-5 pt-0">
            <div className="p-4">
              <p>{errorMessage}</p>
              {!errorMessage && <div className="loader4Color"></div>}
            </div>
          </div>
        </div>
      </div>
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
                          <Pagination.First onClick={() => {
                            updateThemeCountdown({ ...themeCountdown, themeEndTime: endThemeTime()})
                            updateThemeIndexes({...themeIndexes, themeIndex: 0, title: 'Week 1'})
                          }}
                          />
                          <Pagination.Prev onClick={() => {
                            updateThemeCountdown({ ...themeCountdown, themeEndTime: endThemeTime()})
                            updateThemeIndexes({...themeIndexes, themeIndex: Math.max(0, themeIndexes.themeIndex - 1), title: `Week ${Math.max(1, themeIndexes.themeIndex)}`})
                          }}
                          />
                          <Pagination.Next onClick={() => {
                            updateThemeCountdown({ ...themeCountdown, themeEndTime: endThemeTime()})
                            updateThemeIndexes({...themeIndexes, themeIndex: Math.min(themes.length - 1, themeIndexes.themeIndex + 1), title: `Week ${Math.min(themes.length, themeIndexes.themeIndex + 2)}`})
                          }}
                          />
                          <Pagination.Last onClick={() => {
                            updateThemeCountdown({ ...themeCountdown, themeEndTime: endThemeTime()})
                            updateThemeIndexes({...themeIndexes, themeIndex: themes.length - 1, title: `Week ${themes.length}`})
                          }}
                          />
                        </Pagination>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row mb-6">
                  <h2 className="card-title">{themeIndexes.title}</h2>
                  <h3>{themes[themeIndexes.themeIndex]}</h3>
                </div>
                {
                  themeIndexes.themeIndex === nextThemeIndex() &&
                  (
                    <div className="row mb-6">
                      <div className="col-md">
                          <div className="col">
                            <h6 className="card-subtitle mb-2 text-muted">Current Bid</h6>
                            {
                              nfts.length && bids.length ? (
                                <h2 className="card-subtitle mb-2">{bids[0]?.price} eth</h2>
                              ) : (
                                <h2 className="card-subtitle mb-2">N/A</h2>
                              )
                            }
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
                        nfts.length && bids.length ? (
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
                            nfts.length && bids.length ? (
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
                  (nfts.length && themeIndexes.themeIndex === nextThemeIndex()) ?
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
                            <button disabled={biddingState} className="btn bouton-image" onClick={bid}>
                            </button>
                        </div>
                      </div>
                    </div>
                  ) : (<div></div>)
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
                        nfts.length && bids.length ?
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
