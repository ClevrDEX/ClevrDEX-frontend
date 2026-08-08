"use client"

import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { createPortal } from "react-dom"
import { useChainId } from "wagmi"

import { CloseIcon } from "@/components/CloseIcon"
import { getTransactionExplorerUrl } from "@/chains/explorer"
import { useI18n, type MessageKey } from "@/i18n"

export type TransactionFlowStepStatus =
  | "pending"
  | "active"
  | "confirming"
  | "success"
  | "skipped"
  | "error"

export type TransactionFlowStep = {
  id: string
  label: string
  description: string
  status: TransactionFlowStepStatus
  hash?: `0x${string}`
}

type TransactionFlowModalProps = {
  open: boolean
  title: string
  description: string
  steps: TransactionFlowStep[]
  error?: string
  onClose: () => void
}

export function TransactionFlowModal({
  open,
  title,
  description,
  steps,
  error,
  onClose,
}: TransactionFlowModalProps) {
  const chainId = useChainId()
  const { t } = useI18n()

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open || typeof document === "undefined") {
    return null
  }

  const isFinalConfirming = steps.at(-1)?.status === "confirming"

  return createPortal(
    <div
      className="token-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="token-modal transaction-flow-modal"
        role="dialog"
        aria-labelledby="transaction-flow-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="token-menu-header">
          <div>
            <strong id="transaction-flow-title">{title}</strong>
            <span>{description}</span>
          </div>
          <button
            className="token-modal-close"
            type="button"
            aria-label={t("common.closeProgress")}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="transaction-flow-body">
          <ol className="transaction-flow-steps">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`transaction-flow-step ${step.status}`}
              >
                <span className="transaction-flow-step-index">{index + 1}</span>
                <div>
                  <div className="transaction-flow-step-main">
                    <strong>{step.label}</strong>
                    <span>{t(`flow.status.${step.status}` as MessageKey)}</span>
                  </div>
                  <p>{step.description}</p>
                  {step.hash ? (
                    <TransactionHashLink chainId={chainId} hash={step.hash} />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {error ? <p className="status error">{error}</p> : null}

          {isFinalConfirming ? (
            <p className="status">{t("flow.finalConfirming")}</p>
          ) : (
            <p className="status">{t("flow.keepWallet")}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function updateFlowStep(
  setFlowSteps: Dispatch<SetStateAction<TransactionFlowStep[]>>,
  stepId: string,
  patch: Partial<TransactionFlowStep>,
) {
  setFlowSteps((steps) =>
    steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
  )
}

export async function waitForAllowance(
  refetchAllowance: () => Promise<{ data?: bigint }>,
  requiredAmount: bigint,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await refetchAllowance()
    if ((result.data ?? 0n) >= requiredAmount) {
      return
    }

    await sleep(1_500)
  }

  throw new Error("Approval confirmed, but allowance did not update in time.")
}

function TransactionHashLink({
  chainId,
  hash,
}: {
  chainId: number
  hash: `0x${string}`
}) {
  const href = getTransactionExplorerUrl(chainId, hash)

  if (!href) {
    return <code>{shortHash(hash)}</code>
  }

  return (
    <a
      className="transaction-hash-link"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {shortHash(hash)}
    </a>
  )
}

function shortHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
