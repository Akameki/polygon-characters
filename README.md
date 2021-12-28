# Steps to run webapp
$ git clone https://github.com/tong2984a/polygon-characters polygon-characters

$ cd polygon-characters

$ node version
> v16.10.0

$ yarn

$ npm run dev

# Asset Configuration - characters (Firebase collection)
Each document represents a MonkeyKing character you see in the Carousel:
- fileUrl: link to an image file, e.g. stored in IPFS or Firestore
- maskUrl: link to a masked image file, e.g. stored either in IPFS or Firestore
- theme: a character always belongs to a theme (see character-themes)
- name: name of the character
- description: description of the character
- order: display order of the character in a carousel

# Asset Configuration - character-themes (Firebase collection)
Each document represents a MonkeyKing character you see in the Carousel:
- name: name of a theme
- description: description of the theme
- startTime: indicates when the theme is available for minting
- duration: indicates how long the theme is available for minting, i.e. startTime + duration = endTime

# Asset Configuration - character-nfts (Firebase collection)
Each document represents a MonkeyKing character you see in the Carousel:
- name: name of a NFT
- description: description of the NFT
- theme: name of a theme that the NFT belongs to
- imageUrl: link to an mp4 file, e.g. stored in IPFS or Firestore
- tokenURI: link to an NFT JSON file, e.g. stored in IPFS or Firestore

# Asset Configuration - NFT JSON file
- name: name of an NFT
- description: description of the NFT
- image: link to an mp4 file, e.g. stored in IPFS or Firestore
