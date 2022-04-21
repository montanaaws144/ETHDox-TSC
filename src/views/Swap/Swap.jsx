import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Box } from "@material-ui/core";
import styled from "styled-components";
import { FaChevronRight } from 'react-icons/fa'
import { ethers } from "ethers";
import { useAddress, useWeb3Context } from "../../hooks/web3Context";
import { DOX_ADDR, DOX_LOCK, DOX_UNLOCK, DOX_BNB_PAIR, DOX_DIVIDEND_ADDR } from '../../abi/address.js'
import DoxTokenABI from '../../abi/DoxToken.json'

function TreasuryDashboard({ tokeninfo, projectinfo, userinfo, account }) {
  const [pending, setPending] = useState(false);
  const { connect, hasCachedProvider, provider, chainID, connected } = useWeb3Context();
  
  console.log(userinfo);
  const onClaim = async () => {
    setPending(true);
    try {
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(DOX_ADDR, DoxTokenABI, signer);
      await tokenContract.claim();
    }
    catch (error) {
      console.log(error);
    }
    setPending(false);
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return (
    <StyledContainer>

      <Paper width={'100%'} height={'fit-content'} maxWidth={'400px'}>
        <Box fontSize={'32px'}>Your Info</Box>
        <Box width={'250px'} height={'250px'} mx={'auto'} mt={'30px'}>
          <img src={'/images/dox.png'} alt={'logo'} width={'100%'} height={'100%'} />
        </Box>
        <Info mt={'40px'} display={'flex'} alignItems={'center'}>
          <Box width={'50px'} height={'50px'}>
            <img src={'/images/balance.png'} alt={'logo'} width={'100%'} height={'100%'} />
          </Box>
          <Box ml={'20px'}>
            <Box color={'#a7afca'}>Balance</Box>
            <Box mt={'10px'}>{numberWithCommas(userinfo.balance.toFixed(2))} {tokeninfo.symbol}</Box>
          </Box>
        </Info>
        <Info mt={'20px'} display={'flex'} alignItems={'center'}>
          <Box width={'50px'} height={'50px'}>
            <img src={'/images/price-tag.png'} alt={'logo'} width={'100%'} height={'100%'} />
          </Box>
          <Box ml={'20px'}>
            <Box color={'#a7afca'}>Balance Price</Box>
            <Box mt={'10px'}>${numberWithCommas((userinfo.balance * projectinfo.price).toFixed(2))}</Box>
          </Box>
        </Info>
        <Info mt={'20px'} display={'flex'} alignItems={'center'}>
          <Box width={'50px'} height={'50px'}>
            <img src={'/images/wallet.png'} alt={'logo'} width={'100%'} height={'100%'} />
          </Box>
          <Box ml={'20px'}>
            <Box color={'#a7afca'}>Pending Rewards </Box>
            <Box mt={'10px'}>${numberWithCommas((userinfo.pendingReward * projectinfo.ethPrice).toFixed(2))}</Box>
          </Box>
        </Info>
        <Box display={'flex'} justifyContent={'end'} mt={'20px'}>
          <StyledButton disabled={!account || pending} onClick={() => onClaim()} >
            CLAIM
            <Box fontSize={'16px'} mt={'7px'}>
              <FaChevronRight />
            </Box>
          </StyledButton>
        </Box>
      </Paper>
      <Box ml={'50px'} maxWidth={'750px'} width={'100%'}>
        <Paper height={'fit-content'} width={'100%'}>
          <Box fontSize={'32px'} mt={'10px'}>Token Info</Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Name
            </Box>
            <Box>
              {'ETHDox'}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Symbol
            </Box>
            <Box>
              {'ETHDOX'}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Decimal
            </Box>
            <Box>
              {18}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Total Supply
            </Box>
            <Box>
              {numberWithCommas(tokeninfo.totalSupply)}
            </Box>
          </Box>

        </Paper>
        <Paper height={'fit-content'} mt={'50px'} width={'100%'}>
          <Box fontSize={'32px'} mt={'10px'}>Project Info</Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Price
            </Box>
            <Box>
              ${projectinfo.price.toFixed(10)}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Market Cap
            </Box>
            <Box>
              ${projectinfo ? numberWithCommas((projectinfo.price * tokeninfo.totalSupply).toFixed(2)) : 0}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Daily Volume
            </Box>
            <Box>
              ${projectinfo ? numberWithCommas((projectinfo.price * projectinfo.volume).toFixed(2)) : 0}
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Reward Token
            </Box>
            <Box>
              ETH
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Total Rewards
            </Box>
            <Box>
              {numberWithCommas((projectinfo.totalReward).toFixed(2))} ETH
            </Box>
          </Box>
          <Box display={'flex'} justifyContent={'space-between'} fontSize={'24px'} mt={'20px'} lineHeight={'34px'}>
            <Box color={'lightgray'}>
              Total Rewards Price
            </Box>
            <Box>
              ${numberWithCommas((projectinfo.totalReward * projectinfo.ethPrice).toFixed(2))}
            </Box>
          </Box>
        </Paper>
      </Box>
    </StyledContainer>
  );
}


const Info = styled(Box)`
  background-image: linear-gradient(106.91deg,hsla(0,0%,100%,.15) 30.28%,hsla(0,0%,100%,0) 119.6%);;
  color white;
  padding: 20px;
  border-radius 10px;
  font-size 18px;
  width : 100%;
`;
const Paper = styled(Box)`
  width fit-content;
  box-shadow 0px 2px 60px 0px rgb(211 113 52 / 40%);
  border : 2px solid #e9b346;
  background: rgba(211,113,52,0.22);
  padding :  30px 50px;
  @media screen and (max-width : 450px){
    padding : 30px 20px;
  }
  @media screen and (max-width : 530px){
    >div:nth-child(1){
      font-size : 24px!important;
    }
  }
`;
const StyledContainer = styled(Box)`
  display flex;
  min-height: 100vh;
  width: 100%;
  background-color : #202020!important;
  background-size 100% 100%;
  position: relative;
  padding 0px;
  padding-bottom 50px;
  color white;
  justify-content center;
  overflow hidden;
  @media screen and (max-width : 1250px){
    flex-direction : column;
    align-items : center;
    background-color : white;
    background-repeat : repeat-y;
    background-position : top;
    background-size : unset;
    >div:nth-child(1){
      width : 100%;
      max-width : 750px;
    }
    >div:nth-child(2){
      margin-left : 0;
      margin-top : 60px;
    }
  }
  @media screen and (max-width : 700px){
    padding-left : 20px;
    padding-right : 20px;
  }
  @media screen and (max-width : 530px){
    >div:nth-child(2)>div>div{
      font-size : 18px;
    }
  }
`;
const StyledButton = styled.button`
    display : flex;
    justify-content : center;
    align-items : center;
    color : white;
    padding : 10px 0px;
    width : 170px;
    font-size : 21px;
    cursor : pointer;
    border : none;
    transition : all 0.3s;
    background : #d37134;
    font-family : 'Titillium Web';
    box-shadow : 0px 12px 18px -6px rgb(0 0 0 / 30%);
    letter-spacing : 2px;
    :disabled{
        background : rgba(112,125,162,0.3);
        color : rgb(189, 194, 196);
        cursor : not-allowed;
        border : none;
    }
    >div{
      opacity : 0;
      margin-left : -15px;
      transition : all 0.3s;
    }
    :hover:not([disabled]){
      >div{
        opacity : 1;
        margin-left : 10px;
      }
    }
`


export default TreasuryDashboard