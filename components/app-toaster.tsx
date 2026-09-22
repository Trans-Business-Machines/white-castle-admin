"use client"

import { Toaster } from "react-hot-toast"

function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "font-sans text-sm",
        duration: 5000,
        success: { iconTheme: { primary: "#16659f", secondary: "#ffffff" } },
      }}
    />
  )
}

export { AppToaster }
