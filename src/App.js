import "./App.css";
import { Button, ButtonGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { Component } from "react";
import "sf-font";
import axios from "axios";
import ABI from "./ABI.json";
import VAULTABI from "./VAULTABI.json";
import TOKENABI from "./TOKENABI.json";
import { NFTCONTRACT, STAKINGCONTRACT, bsc_rpc, moralisapi } from "./config";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletLink from "walletlink";
import Web3 from "web3";

var account = null;
var contract = null;
var vaultcontract = null;
var web3 = null;

const bscapykey = "P5B53Y8K46NV6HQWS9QR6BCRVS92AJZA91";
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

class App extends Component {
  constructor() {
    super();
    this.state = {
      balance: [],

      rawearn: [],
    };
  }

  handleModal() {
    this.setState({ show: !this.state.show });
  }

  handleNFT(nftamount) {
    this.setState({ outvalue: nftamount.target.value });
  }

  async componentDidMount() {
    await axios
      .get(
        bsc_rpc +
          `?module=stats&action=tokensupply&contractaddress=${NFTCONTRACT}&apikey=${bscapykey}`
      )
      .then((outputa) => {
        this.setState({
          balance: outputa.data,
        });
       
      });

    let config = { "X-API-Key": moralisapikey, accept: "application/json" };
    await axios
      .get(
        moralisapi +
          `/nft/${NFTCONTRACT}/owners?chain=bsc%20testnet&format=decimal`,
        { headers: config }
      )
      .then((outputb) => {
        const { result } = outputb.data;
        this.setState({
          nftdata: result,
        });
       
      });
  }

  render() {
    const { balance } = this.state;
    const { outvalue } = this.state;

    async function connectwallet() {
      var provider = await web3Modal.connect();
      web3 = new Web3(provider);
      await provider.send("eth_requestAccounts");
      var accounts = await web3.eth.getAccounts();
      account = accounts[0];
      document.getElementById("wallet-address").textContent = account;
      contract = new web3.eth.Contract(ABI, NFTCONTRACT);
      vaultcontract = new web3.eth.Contract(VAULTABI, STAKINGCONTRACT);
      var getstakednfts = await vaultcontract.methods
        .tokensOfOwner(account)
        .call();
      document.getElementById("yournfts").textContent = getstakednfts;
      var getbalance = Number(
        await vaultcontract.methods.balanceOf(account).call()
      );
      document.getElementById("stakedbalance").textContent = getbalance;
      const arraynft = Array.from(getstakednfts.map(Number));
      const tokenid = arraynft.filter(Number);
      var rwdArray = [];

      for (const id of tokenid) {
        var rawearn = await vaultcontract.methods
          .earningInfo(account, [id])
          .call();
        var array = Array.from(rawearn.map(String)); // Convert values to strings

        for (const item of array) {
          var earned = item.split(",")[0];
          var earnedrwd = web3.utils.fromWei(earned, "ether"); // Convert to ether units
          var rewardx = Number(earnedrwd).toFixed(2);
          var numrwd = Number(rewardx);
          rwdArray.push(numrwd);
        }
      }

      async function delayedLog(item) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        var sum = rwdArray.reduce((a, b) => a + b, 0);
        var formatsum = sum.toFixed(2);
        document.getElementById("earned").textContent = formatsum;
      }

      await Promise.all(
        rwdArray.map(async (item) => {
          await delayedLog(item);
        })
      );
    }

    async function verify() {
      var getstakednfts = await vaultcontract.methods
        .tokensOfOwner(account)
        .call();
      document.getElementById("yournfts").textContent = getstakednfts;
      var getbalance = Number(
        await vaultcontract.methods.balanceOf(account).call()
      );
      document.getElementById("stakedbalance").textContent = getbalance;
    }

    async function enable() {
      contract.methods
        .setApprovalForAll(STAKINGCONTRACT, true)
        .send({ from: account });
    }

    const Web3Alc = new Web3(
      "https://necessary-few-scion.bsc-testnet.discover.quiknode.pro/0a801f5bf0096bffcb7ea9d9f27619b9effa6d4a/"
    );

    async function claimit() {
      var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
      const arraynft = Array.from(rawnfts.map(Number));
      const tokenid = arraynft.filter(Number);
      await Web3Alc.eth.getBlock().then((tip) => {
        Web3Alc.eth.getBlock("pending").then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = maxPriority + baseFee;
          tokenid.forEach(async (id) => {
            await vaultcontract.methods.claim([id]).send({
              from: account,
              maxFeePerGas: maxFee,
              maxPriorityFeePerGas: maxPriority,
            });
          });
        });
      });
    }
    async function unstakeall() {
      var rawnfts = await vaultcontract.methods.tokensOfOwner(account).call();
      const arraynft = Array.from(rawnfts.map(Number));
      const tokenid = arraynft.filter(Number);
      await Web3Alc.eth.getBlock().then((tip) => {
        Web3Alc.eth.getBlock("pending").then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = maxPriority + baseFee;
          tokenid.forEach(async (id) => {
            await vaultcontract.methods.unstake([id]).send({
              from: account,
              maxFeePerGas: maxFee,
              maxPriorityFeePerGas: maxPriority,
            });
          });
        });
      });
    }

    async function mintnative() {
      var _mintAmount = Number(outvalue);
      var mintRate = Number(await contract.methods.cost().call());
      var totalAmount = global.BigInt(mintRate) * global.BigInt(_mintAmount);
      await Web3Alc.eth.getGasPrice().then((tip) => {
        Web3Alc.eth.getBlock("pending").then((block) => {
          var baseFee = Number(block.baseFeePerGas);
          var maxPriority = Number(tip);
          var maxFee = baseFee + maxPriority;
          contract.methods.mint(account, _mintAmount).send({
            from: account,
            value: String(totalAmount),
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: maxPriority,
          });
        });
      });
    }

    async function mint0() {
      try {
        const _pid = "0";
        const erc20address = await contract.methods.getCryptotoken(_pid).call();
        const currency = new web3.eth.Contract(TOKENABI, erc20address);
        const mintRate = await contract.methods.getNFTCost(_pid).call();
        const _mintAmount = Number(outvalue);
        const totalAmount =
          global.BigInt(mintRate) * global.BigInt(_mintAmount);

        const tip = await Web3Alc.eth.getGasPrice();
        const block = await Web3Alc.eth.getBlock("pending");
        const baseFee = Number(block.baseFeePerGas);
        const maxPriority = Number(tip);
        const maxFee = maxPriority + baseFee;

        // Aprobación de tokens
        await currency.methods.approve(NFTCONTRACT, String(totalAmount)).send({
          from: account,
        });

        // Transferencia de tokens
        const transferTx = await currency.methods
          .transfer(NFTCONTRACT, String(totalAmount))
          .send({
            from: account,
          });

        

        // Esperar a que la transferencia tenga éxito antes de mintear el NFT
        if (transferTx.status) {
         
          await contract.methods.mintpid(account, _mintAmount, _pid).send({
            from: account,
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: maxPriority,
          });
         
        } else {
          console.error("Token transfer failed.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }

    const refreshPage = () => {
      window.location.reload();
    };

    return (
      <div className="App">
        <nav class="navbar navbarfont navbarglow navbar-expand-md navbar-dark bg-dark mb-4">
          <img
            src="logoNFTgenesis.png"
            alt="Logo"
            width="150px"
            height="auto"
            style={{ marginLeft: "150px" }}
          />

          <a
            class="navbar-brand px-5"
            style={{ fontWeight: "700", fontSize: "23px" }}
            href=" "
          >
            Flork Metaverse
          </a>
          <a
            class="navbar-brand px-4"
            style={{ fontWeight: "700", fontSize: "23px" }}
            href=" "
          >
            FlorkCoin Staking
          </a>
          <a
            class="navbar-brand px-4"
            style={{ fontWeight: "700", fontSize: "23px" }}
            href=" "
          >
            White Paper
          </a>
          <a
            class="navbar-brand px-4"
            style={{ fontWeight: "700", fontSize: "23px" }}
            href=" "
          >
            MarketPlace
          </a>

          <div className="px-5">
            <input
              id="connectbtn"
              type="button"
              className="connectbutton"
              onClick={connectwallet}
              style={{ fontFamily: "SF Pro Display" }}
              value="Connect Your Wallet"
            />
          </div>
        </nav>
        <div className="container container-style">
          <div className="col">
            <body className="nftminter">
              <form>
                <div className="row pt-3">
                  <div>
                    <h1 className="pt-2" style={{ fontWeight: "30" }}>
                      NFT Minter
                    </h1>
                  </div>
                  <h3>{balance.result}/1000</h3>
                  <h6>Your Wallet Address</h6>
                  <div
                    className="pb-3"
                    id="wallet-address"
                    style={{
                      color: "#39FF14",
                      fontWeight: "400",
                      textShadow: "1px 1px 1px black",
                    }}
                  >
                    <label for="floatingInput">Please Connect Wallet</label>
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: "300", fontSize: "18px" }}>
                    Select NFT Quantity
                  </label>
                </div>
                <ButtonGroup
                  size="lg"
                  aria-label="First group"
                  name="amount"
                  style={{ boxShadow: "1px 1px 5px #000000" }}
                  onClick={(nftamount) => this.handleNFT(nftamount, "value")}
                >
                  <Button value="1">01</Button>
                  <Button value="2">02</Button>
                  <Button value="3">03</Button>
                  <Button value="4">04</Button>
                  <Button value="5">05</Button>
                </ButtonGroup>
                <ButtonGroup
                  size="lg"
                  aria-label="First group"
                  name="amount"
                  style={{
                    boxShadow: "1px 1px 5px #000000",
                    marginTop: "10px",
                  }}
                  onClick={(nftamount) => this.handleNFT(nftamount, "value")}
                >
                  <Button value="6">06</Button>
                  <Button value="7">07</Button>
                  <Button value="8">08</Button>
                  <Button value="9">09</Button>
                  <Button value="10">10</Button>
                </ButtonGroup>
                <h6
                  className="pt-2"
                  style={{
                    fontFamily: "SF Pro Display",
                    fontWeight: "300",
                    fontSize: "18px",
                  }}
                >
                  Buy with your preferred crypto!
                </h6>
                <div className="row px-2 pb-2 row-style">
                  <div className="col">
                    <Button
                      className="button-style"
                      onClick={mint0}
                      style={{
                        border: "0.2px",
                        borderRadius: "14px",
                        boxShadow: "1px 1px 5px #000000",
                        padding: 0,
                      }}
                    >
                      <img src={"FLORK.png"} width="100%" alt="BNB" />
                    </Button>
                    <p
                      style={{
                        textAlign: "center",
                        marginTop: "10px",
                        color: "white",
                      }}
                    >
                      Coming Soon FLORK
                    </p>
                  </div>

                  <div className="col">
                    <Button
                      className="button-style"
                      onClick={mintnative}
                      style={{
                        border: "0.2px",
                        borderRadius: "14px",
                        boxShadow: "1px 1px 5px #000000",
                        padding: 0,
                      }}
                    >
                      <img src={"BNB.png"} width="100%" alt="BNB" />
                    </Button>
                    <p
                      style={{
                        textAlign: "center",
                        marginTop: "10px",
                        color: "white",
                      }}
                    >
                      Create NFT with BNB
                    </p>
                  </div>
                  <div className="col">
                    <Button
                      className="button-style"
                      onClick={mint0}
                      style={{
                        border: "0.2px",
                        borderRadius: "14px",
                        boxShadow: "1px 1px 5px #000000",
                        padding: 0,
                      }}
                    >
                      <img src={"USDT.png"} width="100%" alt="BNB" />
                    </Button>
                    <p
                      style={{
                        textAlign: "center",
                        marginTop: "10px",
                        color: "white",
                      }}
                    >
                      Create NFT with USDT
                    </p>
                  </div>
                  <div>
                    <div
                      id="txout"
                      style={{
                        color: "#39FF14",
                        marginTop: "5px",
                        fontSize: "20px",
                        fontWeight: "500",
                        textShadow: "1px 1px 2px #000000",
                      }}
                    >
                      <p style={{ fontSize: "20px" }}>Transfer Status</p>
                    </div>
                  </div>
                </div>
              </form>
            </body>
          </div>
          <div className="col">
            <body className="nftstaker border-0">
              <form style={{ fontFamily: "SF Pro Display" }}>
                <h2
                  style={{
                    borderRadius: "14px",
                    fontWeight: "300",
                    fontSize: "25px",
                  }}
                >
                  FLORK NFT Staking Vault{" "}
                </h2>
                <h6 style={{ fontWeight: "300" }}>First time staking?</h6>
                <Button
                  onClick={enable}
                  className="btn"
                  style={{
                    backgroundColor: "#ffffff10",
                    boxShadow: "1px 1px 5px #000000",
                    marginBottom: "12px",
                  }}
                >
                  Authorize Your Wallet
                </Button>
                <div className="row px-3">
                  <div className="col">
                    <form
                      class="stakingrewards"
                      style={{
                        borderRadius: "25px",
                        boxShadow: "1px 1px 15px #ffffff",
                      }}
                    >
                      <h5 style={{ color: "#FFFFFF", fontWeight: "300" }}>
                        Your Vault Activity
                      </h5>
                      <h6 style={{ color: "#FFFFFF" }}>Verify Staked Amount</h6>
                      <Button
                        onClick={verify}
                        style={{
                          backgroundColor: "#ffffff10",
                          boxShadow: "1px 1px 5px #000000",
                        }}
                      >
                        Verify
                      </Button>
                      <table className="table mt-3 mb-5 px-3 table-dark">
                        <tr>
                          <td style={{ fontSize: "19px" }}>
                            Your Staked NFTs:
                            <span
                              style={{
                                backgroundColor: "#ffffff00",
                                fontSize: "21px",
                                color: "#39FF14",
                                fontWeight: "500",
                                textShadow: "1px 1px 2px #000000",
                              }}
                              id="yournfts"
                            ></span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: "19px" }}>
                            Total Staked NFTs:
                            <span
                              style={{
                                backgroundColor: "#ffffff00",
                                fontSize: "21px",
                                color: "#39FF14",
                                fontWeight: "500",
                                textShadow: "1px 1px 2px #000000",
                              }}
                              id="stakedbalance"
                            ></span>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: "19px" }}>
                            Unstake All Staked NFTs
                            <Button
                              onClick={unstakeall}
                              className="mb-3"
                              style={{
                                backgroundColor: "#ffffff10",
                                boxShadow: "1px 1px 5px #000000",
                              }}
                            >
                              Unstake All
                            </Button>
                          </td>
                        </tr>
                      </table>
                    </form>
                  </div>
                  <img
                    className="col-lg-4"
                    src="nftstaking.png" alt=""
                    width="200"
                    height="275"
                    style={{ marginTop: "0px" }}
                  />

                  <div className="col">
                    <form
                      className="stakingrewards"
                      style={{
                        borderRadius: "25px",
                        boxShadow: "1px 1px 15px #ffffff",
                        fontFamily: "SF Pro Display",
                      }}
                    >
                      <h5 style={{ color: "#FFFFFF", fontWeight: "300" }}>
                        {" "}
                        Staking Rewards
                      </h5>
                      <Button
                        style={{
                          backgroundColor: "#ffffff10",
                          boxShadow: "1px 1px 5px #000000",
                        }}
                      >
                        Earned FLORK Rewards
                      </Button>
                      <div
                        id="earned"
                        style={{
                          color: "#39FF14",
                          marginTop: "5px",
                          fontSize: "25px",
                          fontWeight: "500",
                          textShadow: "1px 1px 2px #000000",
                        }}
                      >
                        <p style={{ fontSize: "20px" }}>Earned Tokens</p>
                      </div>
                      <div className="col-12 mt-2">
                        <div style={{ color: "white" }}>Claim Rewards</div>
                        <Button
                          onClick={claimit}
                          style={{
                            backgroundColor: "#ffffff10",
                            boxShadow: "1px 1px 5px #000000",
                          }}
                          className="mb-2"
                        >
                          Claim
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="row px-4 pt-2">
                  <div class="header">
                    <div
                      style={{
                        fontSize: "25px",
                        borderRadius: "14px",
                        color: "#ffffff",
                        fontWeight: "300",
                      }}
                    >
                      FLORK NFT Staking Pool Active Rewards
                    </div>
                    <table className="table px-3 table-bordered table-dark">
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">Collection</th>
                          <th scope="col">Rewards Per Day</th>
                          <th scope="col">Rewards Per Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="stakegoldeffect">
                          <td>FLORK NFT GENESIS COLLECTION</td>
                          <td
                            class="amount"
                            data-test-id="rewards-summary-one-time"
                          >
                            <span class="amount">6,500,000 </span>&nbsp;
                            <span class="currency">FLORK</span>
                          </td>
                          <td class="exchange">
                            <span class="amount">2,372,500,000 </span>
                            <span class="currency">FLORK</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="header">
                      <div
                        style={{
                          fontSize: "25px",
                          borderRadius: "14px",
                          fontWeight: "300",
                        }}
                      >
                        FLORK Token Stake Farms
                      </div>
                      <table
                        className="table table-bordered table-dark"
                        style={{ borderRadius: "14px" }}
                      >
                        <thead className="thead-light">
                          <tr>
                            <th scope="col">Farm Pools</th>
                            <th scope="col">Initial APR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Stake FLORK to Earn FLORK</td>
                            <td
                              class="amount"
                              data-test-id="rewards-summary-ads"
                            >
                              <span class="amount">145,7171,4571,444</span>
                              &nbsp;<span class="currency">%</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </form>
            </body>
          </div>
        </div>
        <div className="row nftportal mt-3">
          <div className="col mt-4 ml-3">
            <img src="FlorkMeta.png" alt="" width={"70%"}></img>
          </div>
          <div className="col">
            <h1 className="n2dtitlestyle mt-3 font-weight-bold">
              Your NFT Portal
            </h1>

            <Button
              onClick={refreshPage}
              style={{
                backgroundColor: "#000000",
                boxShadow: "1px 1px 5px #000000",
              }}
            >
              Refresh NFT Portal
            </Button>
          </div>
          <div className="col mt-3 mr-5">
            <img src="binance.png" alt="" width={"70%"}></img>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
