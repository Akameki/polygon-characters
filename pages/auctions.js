import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'
import {
  nftmarketaddress, nftaddress
} from '../config'
import { useRouter } from 'next/router'

import Clock from './Clock'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where } from "firebase/firestore";

export default function MyCollection() {
  const [nfts, setNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bids, setBids] = useState([])
  const [timers, updateTimers] = useState([])
  const [showModal, setShowModal] = useState(false);
  const [showModalMinting, setShowModalMinting] = useState(false);
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [optionsState, setOptionsState] = useState('')
  const router = useRouter()
  const { theme } = router.query
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const [showModalMessage, setShowModalMessage] = useState('')
  const [showAuction, setShowAuction] = useState(false)

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
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
    }
  }

  function handleChange(event) {
    setOptionsState(event.target.value);
  }
  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    //window.location.reload();
  }
  function startAuction() {
    setShowAuction(true)
  }
  function stopAuction() {
    setShowAuction(false)
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

    const nounsRef = collection(db, "auctions");
    const q = query(nounsRef,
      orderBy("theme"),
      orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);

    const items = [];
    querySnapshot.forEach((doc) => {
      let data = doc.data();
      let item = {
        id: doc.id,
        price: data.price,
        theme: data.theme,
        bidder: data.bidder,
        createdAt: new Date(data.createdAt).toString()
      }
      items.push(item)
    })

    const submitted = items.filter(i => i.theme == optionsState)
    setBids(submitted)
    setLoadingState('loaded')
  }

  useEffect(() => {
    loadFirebase()

    return function cleanup() {
      //mounted = false
    }
  }, [optionsState])

  function endTime(targetDay) {
    return Math.floor(Date.now() / 1000) + 10
  }

  function endTime2(targetDay) {
    let dateNow = new Date()
    let timeNow = dateNow.getTime()
    let daysTo = targetDay - (dateNow.getDay())
    dateNow.setDate(dateNow.getDate() + daysTo)
    dateNow.setHours(0)
    dateNow.setMinutes(0)
    dateNow.setSeconds(0)
    return Math.floor(dateNow.getTime() / 1000)
  }

  useEffect(() => {
    if (theme) setOptionsState(theme);

    let dateNow = new Date()
    // let timeNow = dateNow.getTime()
    // let daysToSat = 6 - (dateNow.getDay())
    // dateNow.setDate(dateNow.getDate() + daysToSat)
    // dateNow.setHours(0)
    // dateNow.setMinutes(0)
    // dateNow.setSeconds(0)
    // const difference = Math.floor(dateNow.getTime() - timeNow) / 1000;
    // var timeLeft = {
    //   days: Math.floor(difference / (60 * 60 * 24)),
    //   hours: Math.floor((difference / (60 * 60)) % 24),
    //   minutes: Math.floor((difference  / 60) % 60),
    //   seconds: Math.floor((difference ) % 60),
    // };
    // console.log("***timeLeft days", timeLeft.days == 0)
    // console.log("***timeLeft hours", timeLeft.hours == 0)
    if ((dateNow.getDay() == 0) || (dateNow.getDay() == 6)) {
      setShowAuction(true)
    } else {
      setShowAuction(false)
    }
  }, [theme]);

    async function bid() {
      if (!window.ethereum || !address) {
        setShowModalMessage("Unable to purchase without a crypto wallet. Please refresh screen to try again.")
      } else {
        try {
          setShowModal(false)
          setShowModalMessage('')

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

          const colRef = collection(db, 'auctions')
          addDoc(colRef, {
            price: formInput.price,
            bidder: address,
            theme: optionsState,
            createdAt: Date.now()
          });
          loadFirebase()
        } catch (error) {
          setErrorMessage(error.message)
        }
      }
    }
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
  if (loadingState === 'loaded' && !bids.length && optionsState) return (
    <div className="p-4">
      <div className="header">{address}</div>
      <main>
        <section className="py-5 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-6 col-md-8 mx-auto">
              <h1 className="fw-light">Auctions</h1>
              <p className="lead text-muted">Themed based auctions.</p>
            </div>
          </div>
            <select value={optionsState} onChange={handleChange}>
              <option value="" disabled default>Select your character theme</option>
              <option value="Stone Age">Stone Age</option>
              <option value="Space">Space</option>
              <option value="Evil and Justice">Evil and Justice</option>
              <option value="Courage and Perseverance">Courage and Perseverance</option>
              <option value="Crypto">Crypto</option>
            </select>
        </section>
        <h1 className="py-10 px-20 text-3xl">No bids submitted.</h1>
      </main>
    </div>
  )
  if (showModal) return (
    <div className="p-4">
      <p>Please wait. Your METAMASK wallet will prompt you once for minting your NFT Character token.</p>
      <p>{errorMessage}</p>
      <div className="loader"></div>
    </div>
  )
  if (showModalMinting) return (
    <div className="p-4">
      <p>Please wait. We are waiting for Smart Contract to finish processing.</p>
      <p>{errorMessage}</p>
      {!errorMessage && <div className="loader4Color"></div>}
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
              <h1 className="fw-light">Auctions</h1>
              <p className="lead text-muted">On Saturday, we will go into a 48 hour auction.</p>
            </div>
          </div>
            <select value={optionsState} onChange={handleChange}>
              <option value="" disabled default>Select your character theme</option>
              <option value="Stone Age">Stone Age</option>
              <option value="Space">Space</option>
              <option value="Evil and Justice">Evil and Justice</option>
              <option value="Courage and Perseverance">Courage and Perseverance</option>
              <option value="Crypto">Crypto</option>
            </select>
        </section>
        <div className="container">
          {
            bids.map((bid, i) => (
              <div key={i} className="row mb-3">
                <div className="col-4 themed-grid-col"><small className="text-muted">{bid.price} MATIC</small></div>
                <div className="col-4 themed-grid-col"><small className="text-muted">{bid.createdAt}</small></div>
                <div className="col-4 themed-grid-col"><small className="text-muted">{bid.bidder}</small></div>
              </div>
            ))
          }
        </div>
      </main>
      {showAuction ?
        (optionsState &&
          <div>
            <div className="p-4">
              <h2 className="text-2xl">Auction begins! Submit your bids before countdown runs out.</h2>
              <Clock endTime={endTime(1)} trigger={() => stopAuction()} />
            </div>
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
        ) : (
          <div>
            <div className="p-4">
              <h2 className="text-2xl">Let's countdown to the beginning of the next auction.</h2>
              <Clock endTime={endTime(6)} trigger={() => startAuction()} />
            </div>
          </div>
        )
      }
    </div>
  )
}
