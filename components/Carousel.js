import { useRef, useState } from "react";

const ItemComponent = ({ nft, i }) => {
  return (
    <div key={i} className="inline-block w-1/5 shadow-sm border-5">
      <div className="card-header text-center">{nft.theme}</div>
      <div>
        <video key={i} autoPlay muted loop alt="NFT series" width="100%" height="100%"
            src={nft.image} poster={nft.image} />
      </div>
      <div className="card-body">
        <h5 className="card-title">{nft.name}</h5>
        <p className="card-text">{nft.description}</p>
        <p className="card-text"><small className="text-muted">{nft.winningBidder}</small></p>
        <div className="flex justify-between items-center">
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
  );
};

function Carousel({ nfts }) {

  const [clickCount, setClickCount] = useState(0);
  const mainWrap = useRef();
  const containerRef = useRef();

  const scrollSlides = (direction) => {
    const width = mainWrap.current?.clientWidth;
    let scrollTo;

    const diff = direction === "next" ? 1 : -1;
    const newValue = (clickCount + diff) % (nfts.length / 5);
    setClickCount(newValue);
    scrollTo = width * newValue;

    containerRef.current?.scrollTo({
      behavior: "smooth",
      left: scrollTo
    });
  };

  return (
    <div className="w-full flex space-x-2" ref={mainWrap}>
      <button className="text-9xl text-yellow-500" onClick={() => scrollSlides("prev")}>{'<'}</button>
      <div className="w-full whitespace-nowrap overflow-auto" ref={containerRef}>
        {nfts?.map((nft, i) => <ItemComponent key={i} nft={nft} i={i} />)}
      </div>
      <button className="text-9xl text-yellow-500" onClick={() => scrollSlides("next")}>{'>'}</button>
    </div>
  );
}


export default Carousel;
