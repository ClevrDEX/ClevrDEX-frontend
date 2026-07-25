"use client"

import { useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { createPortal } from "react-dom"

import { CloseIcon } from "@/components/CloseIcon"

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

const STEP_STATUS_LABELS: Record<TransactionFlowStepStatus, string> = {
  pending: "Pending",
  active: "Waiting for wallet",
  confirming: "Confirming",
  success: "Done",
  skipped: "Skipped",
  error: "Failed",
}

export function TransactionFlowModal({
  open,
  title,
  description,
  steps,
  error,
  onClose,
}: TransactionFlowModalProps) {
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
            aria-label="Close transaction progress"
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
                    <span>{STEP_STATUS_LABELS[step.status]}</span>
                  </div>
                  <p>{step.description}</p>
                  {step.hash ? <code>{shortHash(step.hash)}</code> : null}
                </div>
              </li>
            ))}
          </ol>

          {error ? <p className="status error">{error}</p> : null}

          {isFinalConfirming ? (
            <p className="status">
              The transaction has been submitted. You can close this window and
              continue using the app while it confirms on-chain.
            </p>
          ) : (
            <p className="status">
              Keep your wallet available for each signature. Closing this window
              will not cancel a submitted transaction.
            </p>
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

function shortHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
