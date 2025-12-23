#!/usr/bin/env bun
/**
 * Example TUI App Using Tigma Designs
 *
 * This demonstrates how to load and use .tigma designs in your TUI application.
 *
 * Usage:
 *   1. First, create a design in Tigma and save it as "example.tigma"
 *   2. Run this script: bun example-app.ts
 */

import {
  createCliRenderer,
  RGBA,
  BoxRenderable,
  type OptimizedBuffer,
  type KeyEvent,
} from "@opentui/core"
import { TigmaLoader } from "./tigma-loader"
import * as fs from "fs"

async function main() {
  // Check if design file exists
  const designPath = "./example.tigma"

  let design: any = null
  let loader: TigmaLoader | null = null

  if (fs.existsSync(designPath)) {
    loader = new TigmaLoader()
    design = loader.load(designPath)
    console.log(`Loaded design from ${designPath}`)
  } else {
    console.log(`No design file found at ${designPath}`)
    console.log(`This example will show you how to use Tigma designs.`)
    console.log(`\nCreate a design with: bun run index.ts`)
    console.log(`Then save it as "example.tigma" and run this again.`)
  }

  // Create renderer
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
    enableMouseMovement: true,
  })

  renderer.setBackgroundColor(RGBA.fromInts(0, 0, 0, 255))

  // Application state
  let messages: string[] = [
    "Welcome to the example app!",
    "This demonstrates loading Tigma designs.",
    "",
    "Press SPACE to add a message",
    "Press Ctrl+C to exit",
  ]
  let counter = 0

  const canvas = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    renderAfter: (buffer: OptimizedBuffer) => {
      if (design && loader) {
        // Render the Tigma design as the base layout
        loader.renderToBuffer(design, buffer, 0, 0)

        // Add dynamic content on top
        buffer.drawText(2, 1, "Tigma Design Example", {
          color: RGBA.fromInts(100, 200, 255, 255),
          bold: true,
        })

        // Render messages
        let y = 5
        for (const msg of messages) {
          buffer.drawText(2, y++, msg, {
            color: RGBA.fromInts(200, 200, 200, 255),
          })
        }

        buffer.drawText(2, renderer.terminalHeight - 2, `Counter: ${counter}`, {
          color: RGBA.fromInts(150, 255, 150, 255),
        })
      } else {
        // Fallback: No design loaded, show instructions
        const instructions = [
          "╔══════════════════════════════════════════════════╗",
          "║          Tigma Design Integration Demo          ║",
          "╠══════════════════════════════════════════════════╣",
          "║                                                  ║",
          "║  No design file found!                           ║",
          "║                                                  ║",
          "║  To see this example in action:                  ║",
          "║                                                  ║",
          "║  1. Run: bun run index.ts                        ║",
          "║  2. Create a design (draw boxes, add text, etc)  ║",
          "║  3. Press Ctrl+S to save                         ║",
          "║  4. Name it: example.tigma                       ║",
          "║  5. Run this example again: bun example-app.ts   ║",
          "║                                                  ║",
          "║  The design you create will be used as the       ║",
          "║  layout/background for this app!                 ║",
          "║                                                  ║",
          "╚══════════════════════════════════════════════════╝",
          "",
          "Press Ctrl+C to exit",
        ]

        let y = 2
        for (const line of instructions) {
          buffer.drawText(5, y++, line, {
            color: RGBA.fromInts(200, 200, 200, 255),
          })
        }

        buffer.drawText(5, y + 2, `Messages so far: ${counter}`, {
          color: RGBA.fromInts(150, 255, 150, 255),
        })
      }
    },
  })

  // Handle keyboard input
  renderer.onKey((key: KeyEvent) => {
    if (key.name === "space") {
      counter++
      messages.push(`Message #${counter} at ${new Date().toLocaleTimeString()}`)

      // Keep only last 10 messages
      if (messages.length > 15) {
        messages = messages.slice(-10)
      }

      renderer.requestRender()
    }

    if (key.name === "r" && key.ctrl) {
      // Reload design
      if (fs.existsSync(designPath)) {
        loader = new TigmaLoader()
        design = loader.load(designPath)
        messages.push("Design reloaded!")
        renderer.requestRender()
      }
    }
  })

  console.log("\n🎨 Tigma Design Example App")
  if (design) {
    console.log(`📐 Loaded: ${designPath} (${design.width}x${design.height})`)
  }
  console.log("⌨️  Press SPACE to add messages, Ctrl+C to exit\n")

  renderer.start()
}

main()
