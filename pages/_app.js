import '../styles/globals.css'
import '../styles/spinner.css'
import '../styles/album.css'
import "../styles/assets/dist/css/bootstrap.min.css"
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6 bg-cover">
        <div className="flex mt-4">
          <div className="bg-header">
            <div className="text-center bg-title">
              <h1 className="bg-monkey">Monkey</h1>
              <h1 className="bg-monkey">King</h1>
            </div>
            <p className="bg-link-treasury">
                <a href="#" className="text-black">
                    <u>TREASURY 100</u>
                </a>
            </p>
            <p className="bg-link-connect">
                <a href="#" className="text-black">
                    <u>CONNECT WALLET</u>
                </a>
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
          <svg className="svg1" viewBox='0 0 150 150'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,80
                     h 100
                     a 20,20 1 0,0 0,-80
                     a 10,10 1 0,0 -30,-20
                     a 15,15 1 0,0 -70,20
                     z' />
          </svg>
          <svg className="svg2" viewBox='0 0 105 105'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,40
                     h 50
                     a 20,20 1 0,0 0,-40
                     a 10,10 1 0,0 -15,-10
                     a 15,15 1 0,0 -35,10
                     z' />
          </svg>
          <svg className="svg3" viewBox='0 0 150 150'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,80
                     h 100
                     a 20,20 1 0,0 0,-80
                     a 10,10 1 0,0 -30,-20
                     a 15,15 1 0,0 -70,20
                     z' />
          </svg>
          <svg className="svg4" viewBox='0 0 105 105'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,40
                     h 50
                     a 20,20 1 0,0 0,-40
                     a 10,10 1 0,0 -15,-10
                     a 15,15 1 0,0 -35,10
                     z' />
          </svg>
          <svg className="svg5" viewBox='0 0 150 150'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,80
                     h 100
                     a 20,20 1 0,0 0,-80
                     a 10,10 1 0,0 -30,-20
                     a 15,15 1 0,0 -70,20
                     z' />
          </svg>
          <svg className="svg6" viewBox='0 0 105 105'>
            <path d='M 25,60
                     a 20,20 1 0,0 0,40
                     h 50
                     a 20,20 1 0,0 0,-40
                     a 10,10 1 0,0 -15,-10
                     a 15,15 1 0,0 -35,10
                     z' />
          </svg>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace
