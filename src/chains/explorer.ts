import { getDexDeployment } from "@/chains/deployments"

export function getTransactionExplorerUrl(chainId: number, hash: `0x${string}`) {
  const explorerUrl = getDexDeployment(chainId)?.chain.blockExplorers?.default.url

  if (!explorerUrl) {
    return undefined
  }

  return `${explorerUrl.replace(/\/$/, "")}/tx/${hash}`
}
