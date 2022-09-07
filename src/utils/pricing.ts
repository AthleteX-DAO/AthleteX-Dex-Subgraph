/* eslint-disable prefer-const */
import { BigDecimal, Address } from "@graphprotocol/graph-ts/index";
import { Pair, Token, Bundle } from "../../generated/schema";
import { factoryContract } from "./helper";
import {
  ZERO_BD,
  ONE_BD,
  ADDRESS_ZERO,
  WRAPPED_GAS_TOKEN_ADDRESS,
  AX_ADDRESS,
} from "./constant";

export function getMaticPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdtPair = Pair.load(ADDRESS_ZERO); // usdt is token0
  let busdPair = Pair.load(ADDRESS_ZERO); // busd is token1

  if (busdPair !== null && usdtPair !== null) {
    let totalLiquidityMATIC = busdPair.reserve0.plus(usdtPair.reserve1);
    if (totalLiquidityMATIC.notEqual(ZERO_BD)) {
      let busdWeight = busdPair.reserve0.div(totalLiquidityMATIC);
      let usdtWeight = usdtPair.reserve1.div(totalLiquidityMATIC);
      return busdPair.token1Price
        .times(busdWeight)
        .plus(usdtPair.token0Price.times(usdtWeight));
    } else {
      return ZERO_BD;
    }
  } else if (busdPair !== null) {
    return busdPair.token1Price;
  } else if (usdtPair !== null) {
    return usdtPair.token0Price;
  } else {
    return ZERO_BD;
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [WRAPPED_GAS_TOKEN_ADDRESS, AX_ADDRESS];

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_MATIC = BigDecimal.fromString("0.0001");

/**
 * Search through graph to find derived MATIC per token.
 * @todo update to be derived MATIC (add stablecoin estimates)
 **/
export function findMaticPerToken(token: Token): BigDecimal {
  if (token.id == WRAPPED_GAS_TOKEN_ADDRESS) {
    return ONE_BD;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(
      Address.fromString(token.id),
      Address.fromString(WHITELIST[i])
    );
    if (pairAddress.toHex() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHex());
      if (
        pair.token0 == token.id &&
        pair.reserveMATIC.gt(MINIMUM_LIQUIDITY_THRESHOLD_MATIC)
      ) {
        let token1 = Token.load(pair.token1);
        return pair.token1Price.times(token1.derivedMATIC as BigDecimal); // return token1 per our token * MATIC per token 1
      }
      if (
        pair.token1 == token.id &&
        pair.reserveMATIC.gt(MINIMUM_LIQUIDITY_THRESHOLD_MATIC)
      ) {
        let token0 = Token.load(pair.token0);
        return pair.token0Price.times(token0.derivedMATIC as BigDecimal); // return token0 per our token * MATIC per token 0
      }
    }
  }
  return ZERO_BD; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedMATIC.times(bundle.maticPrice);
  let price1 = token1.derivedMATIC.times(bundle.maticPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  bundle: Bundle,
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedMATIC.times(bundle.maticPrice);
  let price1 = token1.derivedMATIC.times(bundle.maticPrice);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD;
}
