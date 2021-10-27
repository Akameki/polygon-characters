import '../styles/globals.css'
import '../styles/spinner.css'
import '../styles/album.css'

import "../styles/assets/dist/css/bootstrap.min.css"
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Metaverse Character Marketplace</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-pink-500">
              Public Home
            </a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-pink-500">
              Sell Digital Character
            </a>
          </Link>
          <Link href="/by-artist">
            <a className="mr-6 text-pink-500">
              By Artist
            </a>
          </Link>
          <Link href="/my-purchase">
            <a className="mr-6 text-pink-500">
              My Purchase
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace
