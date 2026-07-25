export const apassAbi = [
  {
    type: "function",
    name: "hasAPass",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isValidAPass",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

export const aTokenPolicyAbi = [
  {
    type: "function",
    name: "isTokenRegistered",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "canTransfer",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

export const apassComplianceValidatorAbi = [
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "poolAddress", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "complianceVerify",
    stateMutability: "view",
    inputs: [
      { name: "poolAddress", type: "address" },
      { name: "userAddress", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const
