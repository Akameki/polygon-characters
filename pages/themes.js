import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
//import Web3Modal from "web3modal"
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  nftaddress, nftmarketaddress, envChainName, envChainId, contract_owner
} from '../config'

import Link from 'next/link'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, where} from "firebase/firestore";

export default function Themes() {
  const [nfts, updateNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bought, setBought] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showModalMinting, setShowModalMinting] = useState(false)
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [modalMessage, setModalMessage] = useState(false)
  const [mintingState, setMintingState] = useState(false)
  const router = useRouter()
  const { home } = router.query

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0])
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
            console.log('Please connect to MetaMask.')
          } else {
            console.error(err)
          }
        })
      window.ethereum.on('accountsChanged', handleAccountsChanged)
    } else {
      setAddress("Non-Ethereum browser detected. You should consider installing MetaMask.")
    }
    return function cleanup() {
      //mounted = false
    }
  }, [])

  async function loadFirebase() {
    if (!address) {
      return
    }
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

    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    //const auth = getAuth(app)

    const themesRef = collection(db, "character-themes")
    const q = query(themesRef)
    const querySnapshot = await getDocs(q)
    //const workingNfts = []
    updateNfts( arr => [])
    querySnapshot.forEach((doc) => {
      let characterTheme = doc.data()
      let item = {
        id: doc.id,
        //image: characterTheme.imageUrl,
        name: characterTheme.name,
        //description: characterTheme.description,
        //tokenURI: theme.tokenURI,
        startTime: characterTheme.startTime,
        duration: characterTheme.duration,
        bids: characterTheme.bids || []
        //minted: theme.minted
      }
      item.winningBid = 0
      item.winningBidder = ''
      if (item.bids.length) {
        let winningBidData = item.bids.reduce((a, b) => {
          return a.price > b.price ? a : b
        })
        if (winningBidData) {
          item.winningBid = Number(winningBidData.price)
          item.winningBidder = winningBidData.bidder
        }
      }

      var readableDate = item.startTime.toDate()
      readableDate.setTime(readableDate.getTime() + (item.duration *60*60*1000))
      var daysToMint = ''
      var mintStatus = ''
      var diffDays = new Date() - readableDate
      diffDays = Math.ceil(diffDays / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        daysToMint = `${diffDays} days`
        mintStatus = 'Mint'
      } else {
        daysToMint = `${diffDays} days`
        mintStatus = 'Expired'
      }
      if (item.winningBidder.toUpperCase() === address.toUpperCase()) {
        const nftsRef = collection(db, "character-nfts")
        const nftsQuery = query(nftsRef, where("theme", "==", item.name))
        getDocs(nftsQuery).then(nftQuerySnapshot => {
          nftQuerySnapshot.forEach((doc) => {
            let characterNft = doc.data()
            let nftItem = {
              id: doc.id,
              theme: item.name,
              image: characterNft.imageUrl,
              // name: theme.name,
              description: characterNft.description,
              tokenURI: characterNft.tokenURI,
              //startTime: theme.startTime,
              //duration: theme.duration,
              minted: characterNft.minted,
              winningBid: item.winningBid,
              winningBidder: item.winningBidder,
              daysToMint: daysToMint
            }
            nftItem.mintStatus = mintStatus
            if (nftItem.minted) {
              nftItem.mintStatus = 'Minted Once'
            }
            updateNfts( arr => [...arr, nftItem])
          })
        })
      }
    })
  }

  useEffect(() => {
    loadFirebase()
      .then(
        setLoadingState('loaded')
      )

    return function cleanup() {
      //mounted = false
    }
  }, [address])

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

  async function validateMinting(nft) {
    if (nft.minted) {
      throw {title: 'Error - NFT has already been minted.', message: ''}
    }
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
        console.log('****validateMinting error', error)
        if (error.code === 4001) {
          throw {title: 'Error - Please check your wallet and try again', message: 'Connection request has been rejected. '}
        } else if (error.code === -32002) {
          throw {title: 'Error - Please check your wallet and try again', message: error.message}
        } else {
          throw {title: 'Error - Please check your wallet and try again', message: error.message}
        }
      })
      if (result) {
        console.log('****validateMinting result', result)
        let [accounts, chainId] = result
        if (accounts.length === 0) {
          throw {title: 'Error - Please check your wallet and try again', message: `MetaMask is locked or the user has not connected any accounts`}
        }
        if (chainId !== envChainId) {
          throw {title: 'Error - Please check your wallet and try again', message: `Error - Is your wallet connected to ${envChainName}?`}
        }
      }
    } else {
      throw {title: 'Error - Non-Ethereum browser detected.', message: 'You should consider installing MetaMask'}
    }
  }

  async function mint(nft) {
    setMintingState(true)
    try {
      await validateMinting(nft)
      await mintFirebase(nft)
    } catch(error) {
      setModalMessage(error)
    }
    setMintingState(false)
  }

  async function mintFirebase(nft) {
    try {
      setShowModal(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
      let transaction = await contract.createToken(nft.tokenURI)
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
      const nftRef = doc(db, "character-nfts", nft.id)
      await updateDoc(nftRef, {
        minted: true
      })
      loadFirebase()
        .then(
          setLoadingState('loaded')
        )
    } catch(error) {
      throw {title: 'Error - Please check your wallet and try again', message: error.message}
    } finally {
      setShowModal(false)
      setShowModalMinting(false)
    }
  }
  if (loadingState === 'loaded' && !nfts.length) return (
    <div className="modal modal-signin position-static d-block bg-secondary py-5" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content rounded-5 shadow">
          <div className="modal-header p-5 pb-4 border-bottom-0">
            <h2 className="fw-bold mb-0">You have nothing to mint.</h2>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setModalMessage(false)}></button>
          </div>

          <div className="modal-body p-5 pt-0">
            <div className="p-4">
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
              <div className="loader"></div>
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
              <div className="loader4Color"></div>
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
                        <video key={i} autoPlay muted loop alt="NFT series" width="100%" height="100%"
                           src={nft.image} poster={nft.image} />
                      </div>
                      <div className="card-body">
                      <h5 className="card-title">{nft.name}</h5>
                      <p className="card-text">{nft.description}</p>
                      <p className="card-text"><small className="text-muted">{nft.winningBidder}</small></p>
                      <div className="d-flex justify-content-between align-items-center">
                        {
                          (nft.mintStatus === 'Mint') ?
                          (
                            <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => mint(nft)}>Mint</button>
                          ) : (
                            <button type="button" className="btn btn-sm btn-outline-secondary disabled">{nft.mintStatus}</button>
                          )
                        }
                        <small className="text-muted">{nft.daysToMint}</small>
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
