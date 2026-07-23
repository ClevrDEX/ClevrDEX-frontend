"use client"

import type { ReactNode } from "react"

type SwapCardHeaderProps = {
  kicker: string
  title: string
  leading?: ReactNode
  actions?: ReactNode
  settingsLabel?: string
  onSettingsClick?: () => void
}

export function SwapCardHeader({
  kicker,
  title,
  leading,
  actions,
  settingsLabel = "Settings",
  onSettingsClick,
}: SwapCardHeaderProps) {
  return (
    <div className="swap-card-header">
      <div className="swap-card-header-top">
        <div className="swap-card-header-start">
          {leading}
          <span className="card-kicker">{kicker}</span>
        </div>
        {actions || onSettingsClick ? (
          <div className="swap-card-header-actions">
            {actions}
            {onSettingsClick ? (
              <button
                className="settings-button"
                type="button"
                aria-label={settingsLabel}
                onClick={onSettingsClick}
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path
                    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <h3 className="swap-card-title">{title}</h3>
    </div>
  )
}
