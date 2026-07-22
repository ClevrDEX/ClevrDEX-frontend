"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"

import {
  blockDecimalInput,
  blockIntegerInput,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from "@/features/forms/numericInput"

type TransactionSettingsModalProps = {
  open: boolean
  title: string
  description: string
  slippage: string
  deadline: string
  onSlippageChange: (value: string) => void
  onDeadlineChange: (value: string) => void
  onClose: () => void
}

export function TransactionSettingsModal({
  open,
  title,
  description,
  slippage,
  deadline,
  onSlippageChange,
  onDeadlineChange,
  onClose,
}: TransactionSettingsModalProps) {
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

  return createPortal(
    <div
      className="token-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="token-modal settings-modal"
        role="dialog"
        aria-labelledby="transaction-settings-title"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="token-menu-header">
          <div>
            <strong id="transaction-settings-title">{title}</strong>
            <span>{description}</span>
          </div>
          <button
            className="token-modal-close"
            type="button"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="setting-box">
            <label htmlFor="transaction-slippage">Max slippage</label>
            <div className="slippage-control">
              <input
                id="transaction-slippage"
                className="slippage-input"
                inputMode="decimal"
                value={slippage}
                onKeyDown={blockDecimalInput}
                onChange={(event) =>
                  onSlippageChange(sanitizeDecimalInput(event.target.value))
                }
              />
              <span>%</span>
            </div>
          </div>

          <div className="setting-box">
            <label htmlFor="transaction-deadline">Transaction window</label>
            <div className="slippage-control">
              <input
                id="transaction-deadline"
                className="deadline-input"
                inputMode="numeric"
                value={deadline}
                onKeyDown={blockIntegerInput}
                onChange={(event) =>
                  onDeadlineChange(sanitizeIntegerInput(event.target.value))
                }
              />
              <span>min</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
