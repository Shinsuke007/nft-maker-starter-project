//NftUploader.jsx
import { Web3Storage } from 'web3.storage'
import Web3Mint from "../../utils/Web3Mint.json";//スマコン情報のjsonファイルをインポート
import { ethers } from "ethers";//フロントエンドとコントラクトを連携させるライブラリethersをインポート
import React from "react";//Reactをインポート
import { useEffect, useState } from 'react'//useEffect,useStateをインポート
//表示する画像をインポート
import cookPng from "./cook.png";
import cookingLogo from "./cookingLog.png";
import menu1 from "./menu1.jpeg";

import "./NftUploader.css";//cssをインポート

//NftUploader関数を実装
const NftUploader = () => {
  //ユーザーのウォレットアドレスを格納するために使用する状態変数を定義。
  const [currentAccount, setCurrentAccount] = useState("");
  
  //レシピ名を格納する変数
  const[recipeName, setRecipeName] = useState("");
  //レシピの具材及び数量のテキストを格納する変数
  const [ingredients, setIngredients] = useState("");
  //レシピの工程のテキストを格納する変数
  const [recipeProcess, setRecipeProcess] = useState("");
  console.log("currentAccount: ", currentAccount);

  //①
  //メタマスクに繋げる関数(画面起動時に呼び出す)
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  //②
  //メタマスクに繋げる関数(ボタン押印時に呼び出す)
  const connectWallet = async () =>{
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      //ウォレットアドレスに対してアクセスをリクエストしています。
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      //ウォレットアドレスを currentAccount に紐付けます。
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  //③
  //フロントから渡された画像(e)をIPFSに保存し、askContractToMintNft関数を呼び出す
  const imageToNFT = async (e) => {
    const client = new Web3Storage({ token:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDkyQUVlRmE3OUViNTUzMjRCY0EwZjkzZjFDNjIxMjM4MDE1NDM1MmQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NjY3NTQ4NjE2NDgsIm5hbWUiOiJURUtJVE8ifQ.hcow5-4KFiIsZyARE5C4hWHTUCXSHpzASaq5WKVXAUU"})
    const image = e.target
    console.log(image)

    //画像をIPFSに保存
    //返り値のCIDをrootCidに格納
    const rootCid = await client.put(image.files, {
        name: 'experiment',
        maxRetries: 3
    })

    //返り値CIDを用い、保存したファイルのデータを取る
    const res = await client.get(rootCid) // Web3Response
    const files = await res.files() // Web3File[]
    
    //file.cid：画像のIPFS
    for (const file of files) {
      console.log("file.cid:",file.cid)
      askContractToMintNft(file.cid)
    }
  }

  //④
  //スマートコントラクトのmintIpfsNFT関数を呼び出す関数。
  const askContractToMintNft = async (ipfs) => {
    const CONTRACT_ADDRESS =
      "0x8ced3e601f4E76c6c727f4D632d040AdD32F4328";
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          Web3Mint.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        //スマートコントラクトのmintIpfsNFT関数を呼び出す(引数を渡す)
        let nftTxn = await connectedContract.mintIpfsNFT(recipeName,ipfs,ingredients,recipeProcess);
        console.log("Mining...please wait.");
        await nftTxn.wait();
        console.log(
          `Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`
        );


        //
        // Event がemit される際に、コントラクトから送信される情報を受け取っています。
        // connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
        //   console.log(from, tokenId.toNumber());
        //   alert(
        //     `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
        //   );
        // });

        alert(`Completed!, see NFT: https://testnets.opensea.io/ja/${currentAccount}`);
        // alert(
        //   `Completed!, see NFT: https://testnets.opensea.io/ja/${currentAccount}`
        // );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  //⑤
  //フロントエンドとメタマスクが繋がっていない場合、メタマスクを呼び出す関数
  const renderNotConnectedContainer = () => (
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect to Wallet
      </button>
  );

  //⑥
  //メニュー部分
  const onChangeName = (event) => setRecipeName(event.target.value);
  const onChangeIngredient = (event) => setIngredients(event.target.value);
  const onChangeProcess = (event) => setRecipeProcess(event.target.value);

  //⑦
  //ページがロードされたときに useEffect()内の関数が呼び出されます。
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);


  //HTML部分
  return (
    <div className='all'>

      <div className="header">
        <div className='header-center'>
          <div className='header-content'>
            <div className='header-image'>
              <img src={cookingLogo} alt="cookingLogo" />
            </div>
            <div className='header-tekito'>
              TEKITO
            </div>
          </div>
        </div>
      </div>

      <div className='content'>

        <div className='sample'>
          <div>
            <div className='content-letter'>
              <p>Low carb recipe</p>
            </div>
            <div className='sample-image'>
                <img src={menu1} alt="menu1" />
            </div>
          </div>
        </div>

        <div className="outerBox">
          <div className='explanation'>
            <div>
              <p>TEKITO is Low carb recipe DAO.<br/>This is for people who want to be healthy.</p>
            </div>
          </div>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            <div>
              <p className='explanation-letter'>2STEP, you can mint your recipe NFT</p>
              <h2>①Please input recipe name, ingredients and process.</h2>
              {/* <button onClick={backLog1}>
                    バックログで確認
              </button> */}

              {/* レシピ詳細入力エリア */}
              <div className='input-recipeName'>
                  <p>Recipe name</p>
                  <textarea placeholder="Garlic sautéed shrimp.." onChange={onChangeName} cols="50" rows="2"></textarea>
              </div>
              <div className='inputArea'>
              
                <div className='input-ingredient'>
                  <p>Ingredients</p>
                  <textarea placeholder="220g shurimp.." onChange={onChangeIngredient} cols="50" rows="5"></textarea>
                </div>
                
                <div className='input-process'>
                <p>Process</p>
                  <textarea placeholder='Sauté shrimp with garlic' onChange={onChangeProcess} cols="50" rows="10"></textarea>
                </div>
              </div>

              <div className="title">
                <h2>②Please upload image.</h2>
              </div>
              <div className="nftUplodeBox">
                <div className="imageLogoAndText">
                  <img src={cookPng} alt="cookPng" />
                  <p>Tap here</p>
                </div>
                <input className="nftUploadInput" multiple name="imageURL" type="file" accept=".jpg , .jpeg , .png" onChange={imageToNFT}/>
              </div>

            </div>
          )}
        
        </div>
      </div>
    
      <div className="footer">
        <div className='footer-div'>
          TEKITO
        </div>

      </div>
    </div>
  );
};

//NftUploaderをexportする
export default NftUploader;
