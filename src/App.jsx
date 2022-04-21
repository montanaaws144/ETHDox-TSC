import { ThemeProvider } from "@material-ui/core/styles";
import { useEffect, useState, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Route, Redirect, Switch, useLocation, useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Hidden, useMediaQuery } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import useTheme from "./hooks/useTheme";
import { useAddress, useWeb3Context } from "./hooks/web3Context";
import useGoogleAnalytics from "./hooks/useGoogleAnalytics";
import useSegmentAnalytics from "./hooks/useSegmentAnalytics";
import { storeQueryParameters } from "./helpers/QueryParameterHelper";

import { Home, Stake, ChooseBond, Bond, Dashboard, TreasuryDashboard, Presale, Swap } from "./views";
import Sidebar from "./components/Sidebar/Sidebar.jsx";
import TopBar from "./components/TopBar/TopBar.jsx";
import NavDrawer from "./components/Sidebar/NavDrawer.jsx";
import Messages from "./components/Messages/Messages";

import { dark as darkTheme } from "./themes/dark.js";
import { ethers } from "ethers";
import axios from "axios";

import "./style.scss";
import { DOX_ADDR, DOX_LOCK, DOX_UNLOCK, DOX_BNB_PAIR, DOX_DIVIDEND_ADDR } from './abi/address.js'
import DoxTokenABI from './abi/DoxToken.json'

import UnLockABI from './abi/UnLockABI.json'
import LockABI from './abi/LockABI.json'

import PancakePairABI from './abi/PancakePairABI.json';
import DoxDividendTracker from './abi/DoxDividendTracker.json';
import Pool from "./views/Pool";

// 😬 Sorry for all the console logging
const DEBUG = false;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// 🔭 block explorer URL
// const blockExplorer = targetNetwork.blockExplorer;

const drawerWidth = 280;
const transitionDuration = 969;

const useStyles = makeStyles(theme => ({
  drawer: {
    [theme.breakpoints.up("md")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(1),
    paddingTop: '40px',
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: transitionDuration,
    }),
    height: "100%",
    overflow: "auto",
    background: "#202020",
    backgroundSize: "cover",
    marginLeft: drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: transitionDuration,
    }),
    marginLeft: 0,
  },
  // necessary for content to be below app bar
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
}));

let rewardflag = null, poolflag = null;

function App() {
  useGoogleAnalytics();
  useSegmentAnalytics();
  const dispatch = useDispatch();
  const [theme, toggleTheme, mounted] = useTheme();
  const location = useLocation();
  const classes = useStyles();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSmallerScreen = useMediaQuery("(max-width: 980px)");
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  const history = useHistory();
  const { connect, hasCachedProvider, provider, chainID, connected } = useWeb3Context();
  const address = useAddress();

  const [walletChecked, setWalletChecked] = useState(false);

  const [tokeninfo, setTokenInfo] = useState({ name: 'DOXED', symbol: 'DOX', decimal: 18, totalSupply: 0 });
  const [projectinfo, setProjectInfo] = useState({ volume: 0, ethPrice: 0, price: 0, totalReward: 0 });
  const [userinfo, setUserInfo] = useState({ balance: 0, pendingReward: 0 });

  const [unlockinfo, setUnLockInfo] = useState(null);
  const [lockinfo, setLockInfo] = useState(null);
  const [lockups, setLockUps] = useState([{}, {}]);
  const [lockallow, setLockAllow] = useState(false);
  const [unlockallow, setUnLockAllow] = useState(false);

  useEffect(() => {
    if (hasCachedProvider()) {
      // then user DOES have a wallet
      connect().then(() => {
        setWalletChecked(true);
      });
    } else {
      // then user DOES NOT have a wallet
      setWalletChecked(true);
    }

    // We want to ensure that we are storing the UTM parameters for later, even if the user follows links
    storeQueryParameters();
  }, []);



  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarExpanded(false);
  };

  let themeMode = theme === "light" ? darkTheme : theme === "dark" ? darkTheme : darkTheme;

  useEffect(() => {
    themeMode = theme === "light" ? darkTheme : darkTheme;
  }, [theme]);

  useEffect(() => {
    if (isSidebarExpanded) handleSidebarClose();
  }, [location]);
  const path = useMemo(() => window.location.pathname, [window.location.pathname]);

  async function fetchProjectInfo() {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
    let ethPrice = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=47I5RB52NG9GZ95TEA38EXNKCAT4DMV5RX');
    ethPrice = ethPrice.data.result.ethusd;
    const pairContract = new ethers.Contract(DOX_BNB_PAIR, PancakePairABI, provider);
    const reserves = await pairContract.getReserves();
    const price = reserves[1] * Number(ethPrice) / reserves[0];
    let _dvolume = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${DOX_BNB_PAIR}&contractaddress=${DOX_ADDR}&page=1&offset=400&sort=desc&apikey=47I5RB52NG9GZ95TEA38EXNKCAT4DMV5RX`);
    _dvolume = _dvolume.data.result;
    let volume = 0;
    for (let i = 0; i < _dvolume.length; i++) {
      if (_dvolume[i].to && _dvolume[i].to.toLowerCase() === DOX_ADDR.toLowerCase()) continue;
      if (_dvolume[i].timeStamp / 1 < _dvolume[0].timeStamp / 1 - 3600 * 24) {
        break;
      }
      volume += _dvolume[i].value / Math.pow(10, 18);
    }

    const dividendContract = new ethers.Contract(DOX_DIVIDEND_ADDR, DoxDividendTracker, provider);
    const totalReward = await dividendContract.totalDividendsDistributed() / Math.pow(10, 18);

    setProjectInfo({ volume, price, totalReward, ethPrice });
  }

  async function fetchUserInfo() {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
    const tokenContract = new ethers.Contract(DOX_ADDR, DoxTokenABI, provider);
    const dividendContract = new ethers.Contract(DOX_DIVIDEND_ADDR, DoxDividendTracker, provider);

    let pendingReward = 0;
    let balance = 0;
    if (address) {
      pendingReward = await dividendContract.withdrawableDividendOf(address) / Math.pow(10, 18);
      balance = await tokenContract.balanceOf(address) / Math.pow(10, 18);
    }
    setUserInfo({ balance, pendingReward })
  }

  async function fetchTokenInfo() {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    const tokenContract = new ethers.Contract(DOX_ADDR, DoxTokenABI, provider);
    let temp = tokeninfo;
    temp.totalSupply = await tokenContract.totalSupply() / Math.pow(10, 18);
    setTokenInfo(temp);
  }

  async function fetchTrackerData() {
    fetchTokenInfo();
    fetchProjectInfo();
    fetchUserInfo();
  }

  async function getTokenData(address, isbalance = false) {
    const symbol = 'ETHDOX';
    const decimals = 18;
    return { address, symbol, decimals, balance: userinfo.balance, price: projectinfo.price, ethPrice: projectinfo.ethPrice };
  }

  async function fetchLockInfo() {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    const lockContract = new ethers.Contract(DOX_LOCK, LockABI, provider);
    const stakingToken = DOX_ADDR;
    const stakingTokenContract = new ethers.Contract(stakingToken, DoxTokenABI, provider);
    const stakingTokenInfo = await getTokenData(stakingToken, true);
    const earnedToken = DOX_ADDR;
    const earnedTokenInfo = await getTokenData(earnedToken);
    const reflectionToken = DOX_ADDR;
    const reflectionTokenInfo = await getTokenData(reflectionToken);
    const performanceFee = await lockContract.performanceFee();
    const bonusEndBlock = await lockContract.bonusEndBlock();
    setLockInfo({ stakingTokenInfo, reflectionTokenInfo, earnedTokenInfo, performanceFee, bonusEndBlock })
    let _allowance = 0;
    if (address)
      _allowance = await stakingTokenContract.allowance(address, DOX_LOCK);
    setLockAllow(_allowance / 1 > 0);
    let temp = [];
    for (let i = 0; i < 2; i++) {
      const lockup = await lockContract.lockups(i);
      let pendingReward = 0, pendingReflection = 0;
      if (address) {
        pendingReward = await lockContract.pendingReward(address, i) / Math.pow(10, earnedTokenInfo.decimals);
        pendingReflection = await lockContract.pendingDividends(address, i) / Math.pow(10, reflectionTokenInfo.decimals);
      }
      let userinfo = null;
      if (address) {
        const _userinfo = await lockContract.userInfo(i, address);
        userinfo = {
          amount: _userinfo.amount / Math.pow(10, stakingTokenInfo.decimals),
        }
      }
      const rate = lockup.rate / lockup.totalStaked * 36500 * 6426 * 38.03 / 37.45;
      temp.push({ lockup, pendingReward, pendingReflection, stakingTokenInfo, userinfo, rate });
    }
    setLockUps(temp);
  }
  async function fetchUnlockInfo() {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    const unlockContract = new ethers.Contract(DOX_UNLOCK, UnLockABI, provider);
    const stakingToken = DOX_ADDR;
    const stakingTokenContract = new ethers.Contract(stakingToken, DoxTokenABI, provider);
    const stakingTokenInfo = await getTokenData(stakingToken, true);
    let _allowance = 0;
    if (address)
      _allowance = await stakingTokenContract.allowance(address, DOX_UNLOCK);
    const earnedToken = DOX_ADDR;
    const earnedTokenInfo = await getTokenData(earnedToken);
    const reflectionToken = DOX_ADDR;
    const reflectionTokenInfo = await getTokenData(reflectionToken);
    const depositFee = await unlockContract.depositFee();
    const withdrawFee = await unlockContract.withdrawFee();
    const performanceFee = await unlockContract.performanceFee();
    let pendingReward = 0, pendingReflection = 0, userinfo = null;
    if (address) {
      pendingReward = await unlockContract.pendingReward(address) / Math.pow(10, earnedTokenInfo.decimals);
      pendingReflection = await unlockContract.pendingDividends(address) / Math.pow(10, reflectionTokenInfo.decimals);
      const _userinfo = await unlockContract.userInfo(address);
      userinfo = {
        amount: _userinfo.amount / Math.pow(10, stakingTokenInfo.decimals),
      }
    }
    const rewardPerBlock = await unlockContract.rewardPerBlock();
    const totalStaked = await unlockContract.totalStaked();
    const rate = rewardPerBlock / totalStaked * 36500 * 6426 * 38.03 / 37.45;
    const bonusEndBlock = await unlockContract.bonusEndBlock();
    const lastRewardBlock = await unlockContract.lastRewardBlock();

    setUnLockInfo({
      earnedTokenInfo,
      reflectionTokenInfo,
      stakingTokenInfo,
      depositFee,
      withdrawFee,
      pendingReward,
      pendingReflection,
      performanceFee,
      userinfo,
      rate,
      totalStaked,
      endsIn: bonusEndBlock - lastRewardBlock
    })
    setUnLockAllow(_allowance / 1 > 0);
  }

  useEffect(() => {
    fetchTrackerData();
    if (rewardflag) {
      clearInterval(rewardflag);
    }
    rewardflag = setInterval(async function () {
      fetchTrackerData();
    }, 5000)
  }, [address])

  useEffect(() => {
    fetchUnlockInfo();
    fetchLockInfo();
    if (poolflag) {
      clearInterval(poolflag);
    }
    poolflag = setInterval(async function () {
      fetchUnlockInfo();
      fetchLockInfo();
    }, 5000)
  }, [address, userinfo, projectinfo])
  return (
    <Router>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />

        {/* {isAppLoading && <LoadingSplash />} */}
        <div className={`app ${isSmallerScreen && "tablet"} ${isSmallScreen && "mobile"} light`}>
          <Messages />
          {path === "/" ? null : (
            <TopBar theme={theme} toggleTheme={toggleTheme} handleDrawerToggle={handleDrawerToggle} />
          )}
          {path === "/" ? null : (
            <nav className={classes.drawer}>
              {isSmallerScreen ? (
                <NavDrawer mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
              ) : (
                <Sidebar />
              )}
            </nav>
          )}

          <div className={`${path === "/" ? null : classes.content} ${isSmallerScreen && classes.contentShift}`}>
            <Switch>
              <Route exact path="/dashboard">
                <TreasuryDashboard />

              </Route>
              <Route exact path="/reward">
                <Swap
                  tokeninfo={tokeninfo}
                  projectinfo={projectinfo}
                  userinfo={userinfo}
                  account={address} />

              </Route>
              <Route exact path="/pool">
                <Pool
                  account={address}
                  unlockinfo={unlockinfo}
                  lockinfo={lockinfo}
                  lockups={lockups}
                  lockallow={lockallow}
                  unlockallow={unlockallow} />

              </Route>
              <Route exact path="/">
                <Redirect to="reward" />
              </Route>
            </Switch>
          </div>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
