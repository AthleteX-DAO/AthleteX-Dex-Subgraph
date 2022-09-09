/* eslint-disable prefer-const */
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const WRAPPED_GAS_TOKEN_ADDRESS = "{{wrapped_gas_token_address}}";
export const AX_ADDRESS = "{{ax_token_address}}";
export const FACTORY_ADDRESS = "{{ax_factory_address}}";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);
