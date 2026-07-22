import type { KeyboardEvent } from "react"

const navigationKeys = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
])

export function sanitizeDecimalInput(value: string) {
  const normalizedValue = value.replace(",", ".").replace(/[^\d.]/g, "")
  const [integerPart, ...decimalParts] = normalizedValue.split(".")

  if (decimalParts.length === 0) {
    return integerPart
  }

  return `${integerPart}.${decimalParts.join("")}`
}

export function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "")
}

export function blockDecimalInput(event: KeyboardEvent<HTMLInputElement>) {
  if (shouldAllowControlKey(event)) {
    return
  }

  if (!/^[\d.]$/.test(event.key)) {
    event.preventDefault()
    return
  }

  if (event.key === "." && event.currentTarget.value.includes(".")) {
    event.preventDefault()
  }
}

export function blockIntegerInput(event: KeyboardEvent<HTMLInputElement>) {
  if (shouldAllowControlKey(event)) {
    return
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

export function getSlippageBps(slippage: string) {
  const parsedSlippage = Number(slippage)

  if (!Number.isFinite(parsedSlippage)) {
    return 0
  }

  return Math.max(0, Math.floor(parsedSlippage * 100))
}

export function getDeadlineMinutes(deadline: string) {
  const parsedDeadline = Number(deadline)

  if (!Number.isFinite(parsedDeadline) || parsedDeadline <= 0) {
    return 20
  }

  return Math.floor(parsedDeadline)
}

function shouldAllowControlKey(event: KeyboardEvent<HTMLInputElement>) {
  return (
    navigationKeys.has(event.key) ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  )
}
