import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'
import {
  nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";

export default function MyCollection() {
  const [nfts, setNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bought, setBought] = useState([])
  const [timers, updateTimers] = useState([])
  const [showModal, setShowModal] = useState(false);
  const [showModalMinting, setShowModalMinting] = useState(false);
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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

  function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    //window.location.reload();
  }

  // While you are awaiting the call to eth_requestAccounts, you should disable
  // any buttons the user can click to initiate the request.
  // MetaMask will reject any additional requests while the first is still
  // pending.
  function connect() {
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
    // window.ethereum
    // .request({ method: 'eth_accounts' })
    // .then(handleAccountsChanged)
    // .catch((err) => {
    //   // Some unexpected error.
    //   // For backwards compatibility reasons, if no accounts are available,
    //   // eth_accounts will return an empty array.
    //   console.error(err);
    // });
    connect();

    // Note that this event is emitted on page load.
    // If the array of accounts is non-empty, you're already
    // connected.
    window.ethereum.on('accountsChanged', handleAccountsChanged);
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

    const querySnapshot = await getDocs(collection(db, "characters"));
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
        minted: character.minted
      }
      items.push(item)
    })

    const myItems = items.filter(i => i.seller === address)
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
  if (!address) return (<h1 className="py-10 px-20 text-3xl">Unable to connect to any crypto wallet.</h1>)
  if (loadingState === 'loaded' && !nfts.length && !bought.length) return (
    <div>
      <div className="header">{address}</div>
      <h1 className="py-10 px-20 text-3xl">No assets created</h1>
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
      <div className="header">{address}</div>
      <div className="p-4">
        <h2 className="text-2xl py-2">My Collection - where you can find work that you uploaded.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden  bg-black">
                <Image src={nft.image} className="rounded" width="325" height="475" alt="NFT purchased" />
                {nft.sold ?
                  (<div className="p-4 bg-black">
                    <p className="text-2xl font-bold text-red-500">Sold - {nft.price} MATIC</p>
                    <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => mintFirebase(nft)}>
                      Mint
                    </button>
                  </div>)
                  :

                (<div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">Price - {nft.price} MATIC</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => mintFirebase(nft)}>
                    Mint
                  </button>
                </div>)}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
