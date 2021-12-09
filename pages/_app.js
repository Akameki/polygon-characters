import '../styles/globals.css'
import '../styles/spinner.css'
import '../styles/album.css'
import "../styles/assets/dist/css/bootstrap.min.css"
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6 page-header">
        <div className="flex mt-4">
          <div className="bg-header">
            <Link href="/">
            <div className="text-center bg-title">
              <button>
                <h1 className="bg-monkey">Monkey</h1>
                <h1 className="bg-monkey">King</h1>
              </button>
            </div>
          </Link>
            <p className="bg-link-treasury">
                <a href="#" className="text-black">
                    <u>TREASURY 100</u>
                </a>
            </p>
            <p className="bg-link-connect">
              <Link href="/connectWallet">
                <a href="#" className="text-black">
                    <u>CONNECT WALLET</u>
                </a>
              </Link>
            </p>
            <p className="bg-link-dao">
                <a href="#" className="text-black">
                    <u>DAO</u>
                </a>
            </p>
            <p className="bg-link-docs">
                <a href="#" className="text-black">
                    <u>DOCS</u>
                </a>
            </p>
            <p className="bg-link-theme">
                <a href="#" className="text-black">
                    <u>THEME</u>
                </a>
            </p>
          </div>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace
