import "./App.css";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import "sf-font";
import axios from "axios";
import VAULTABI from "./VAULTABI.json";
import { NFTCONTRACT, STAKINGCONTRACT, moralisapi, nftpng } from "./config";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3 from "web3";

var account = null;
var vaultcontract = null;
var web3 = null;

const moralisapikey =
  "UHv18svdJLCMJt4629tWz8P4fT0DDFLuyRAUYKjJCt5YOlh0iMK2FagfmUVq9z6w";

const providerOptions = {
  binancechainwallet: {
    package: true,
  },
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      QuickNode: "0a801f5bf0096bffcb7ea9d9f27619b9effa6d4a",
    },
  },
  walletlink: {
    package: WalletLink,
    options: {
      appName: "Flork Metaverse",
      QuickNode: "0a801f5bf0096bffcb7ea9d9f27619b9effa6d4a",
      rpc: "",
      chainId: 97,
      appLogoUrl: null,
      darkMode: true,
    },
  },
};

const web3Modal = new Web3Modal({
  network: "bsc-testnet",
  theme: "dark",
  cacheProvider: true,
  providerOptions,
});

export default function NFT() {
  const [apicall, getNfts] = useState([]);
  const [nftstk, getStk] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    callApi();
  }, []);

  async function callApi() {
    var provider = await web3Modal.connect();
    web3 = new Web3(provider);
    await provider.send("eth_requestAccounts");
    var accounts = await web3.eth.getAccounts();
    account = accounts[0];
    vaultcontract = new web3.eth.Contract(VAULTABI, STAKINGCONTRACT);
    let config = { "X-API-Key": moralisapikey, accept: "application/json" };
    const nfts = await axios
      .get(
        moralisapi +
          `/nft/${NFTCONTRACT}/owners?chain=bsc%20testnet&format=decimal`,
        { headers: config }
      )
      .then((outputb) => {
        const { result } = outputb.data;
        return result;
      });
    const apicall = await Promise.all(
      nfts.map(async (i) => {
        let item = {
          tokenId: i.token_id,
          holder: i.owner_of,
          wallet: account,
        };
        return item;
      })
    );
    const stakednfts = await vaultcontract.methods
      .tokensOfOwner(account)
      .call()
      .then((id) => {
        return id;
      });
    const nftstk = await Promise.all(
      stakednfts.map(async (i) => {
        let stkid = {
          tokenId: i,
        };
        return stkid;
      })
    );
    getNfts(apicall);
    getStk(nftstk);
   
    setLoadingState("loaded");
  }
  if (loadingState === "loaded" && !apicall.length)
    return <h1 className="text-3xl">Wallet Not Connected</h1>;

  return (
    <div className="nftportal mb-4">
      <div className="container col-lg-11">
        <div className="row items px-3 pt-3">
          <div
            className="ml-3 mr-3"
            style={{
              display: "inline-grid",
              gridTemplateColumns: "repeat(4, 5fr)",
              columnGap: "20px",
            }}
          >
            {apicall.map((nft, i) => {
              var owner = nft.wallet.toLowerCase();
              if (owner.indexOf(nft.holder) !== -1) {
                async function stakeit() {
                  vaultcontract.methods
                    .stake([nft.tokenId])
                    .send({ from: account });
                }
                return (
                  <div className="card nft-card mt-3 mb-3" key={i}>
                    <div className="image-over">
                      <img
                        className="card-img-top"
                        src={nftpng + nft.tokenId + ".png"}
                        alt=""
                      />
                    </div>
                    <div className="card-caption col-12 p-0">
                      <div className="card-body">
                        <div style={{ textAlign: "center" }}>
                          <h5 className="mb-0" style={{ color: "white" }}>
                            Flork's Metaverse NFT #{nft.tokenId} Genesis
                            Collection
                          </h5>
                        </div>

                        <div style={{ textAlign: "center" }}>
                          <h5 className="mb-0 mt-2" style={{ color: "white" }}>
                            STATUS
                            <p
                              style={{
                                color: "#39FF14",
                                fontWeight: "bold",
                                textShadow: "1px 1px 2px #000000",
                              }}
                            >
                              Ready to Stake
                            </p>
                          </h5>
                        </div>

                        <div className="card-bottom d-flex justify-content-center">
                          <input
                            key={i}
                            type="hidden"
                            id="stakeid"
                            value={nft.tokenId}
                          />
                          <Button
                            style={{ backgroundColor: "#ffffff10" }}
                            onClick={stakeit}
                          >
                            Stake it
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
            {nftstk.map((nft, i) => {
              async function unstakeit() {
                vaultcontract.methods
                  .unstake([nft.tokenId])
                  .send({ from: account });
              }
              return (
                <div>
                  <div className="card stakedcard mt-3 mb-3" key={i}>
                    <div className="image-over">
                      <img
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          width: "70px",
                        }}
                        src="stakeicon.png"
                        alt=""
                      ></img>
                      <img
                        className="card-img-top"
                        src={nftpng + nft.tokenId + ".png"}
                        alt=""
                      />
                    </div>
                    <div className="card-caption col-12 p-0">
                      <div className="card-body">
                        <div style={{ textAlign: "center" }}>
                          <h5 className="mb-0" style={{ color: "white" }}>
                            Flork's Metaverse NFT #{nft.tokenId} Genesis
                            Collection
                          </h5>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <h5 className="mb-0 mt-2" style={{ color: "white" }}>
                            STATUS
                            <p
                              style={{
                                color: "#39FF14",
                                fontWeight: "bold",
                                textShadow: "1px 1px 2px #000000",
                              }}
                            >
                              Ready to Stake
                            </p>
                          </h5>
                        </div>
                        <div className="card-bottom d-flex justify-content-center">
                          <input
                            key={i}
                            type="hidden"
                            id="stakeid"
                            value={nft.tokenId}
                          />
                          <Button
                            style={{ backgroundColor: "#ffffff10" }}
                            onClick={unstakeit}
                          >
                            Unstake it
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
