# Installation on Windows
Refer to https://github.com/nvm-sh/nvm
- Install GitBash from https://gitforwindows.org/
- Run GitBash from taskbar
  - This should open a GitBash shell
- Execute the followings in the GitBash shell
     $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
     
     $ export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
     
     $ [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
     
     $ nvm install 16
     
     $ nvm use 16
     
     $ node -v
     > 16.13.1

     $ npm install --global yarn

# Steps to run webapp
     $ git clone https://github.com/tong2984a/polygon-characters polygon-characters

     $ cd polygon-characters

     $ node -v
     > v16.10.0

     $ yarn

     $ npm run dev
     > if you run on Windows and see a pop-up, just hit OK
     
     lastly, point your browser to http://localhost:3000

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
