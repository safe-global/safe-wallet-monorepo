/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  Sign_message_lib,
  Sign_message_libInterface,
} from "../Sign_message_lib";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "msgHash",
        type: "bytes32",
      },
    ],
    name: "SignMsg",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
    ],
    name: "getMessageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "signMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class Sign_message_lib__factory {
  static readonly abi = _abi;
  static createInterface(): Sign_message_libInterface {
    return new utils.Interface(_abi) as Sign_message_libInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Sign_message_lib {
    return new Contract(address, _abi, signerOrProvider) as Sign_message_lib;
  }
}
