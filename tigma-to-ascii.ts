#!/usr/bin/env bun
/**
 * Tigma to ASCII Converter
 *
 * Converts a .tigma design file to plain ASCII text that you can
 * copy-paste into your TUI application.
 *
 * Usage:
 *   bun tigma-to-ascii.ts mydesign.tigma
 *   bun tigma-to-ascii.ts mydesign.tigma > output.txt
 */

import * as fs from "fs"
import * as path from "path"

interface SerializedColor {
  r: number
  g: number
  b: number
  a: number
}

interface SerializedTextChar {
  char: string
  bold: boolean
  color: SerializedColor | null
}

interface SerializedTextBox {
  id: number
  x: number
  y: number
  chars: SerializedTextChar[]
  zIndex: number
  strokeColor: SerializedColor | null
  fillColor: SerializedColor | null
}

interface SerializedRectangle {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  bold: boolean
  zIndex: number
  strokeColor: SerializedColor | null
  fillColor: SerializedColor | null
}

interface SerializedLine {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  bold: boolean
  zIndex: number
  strokeColor: SerializedColor | null
  fillColor: SerializedColor | null
}

interface TigmaFile {
  version: 1
  textBoxes: SerializedTextBox[]
  rectangles: SerializedRectangle[]
  lines: SerializedLine[]
  nextTextBoxId: number
  nextRectId: number
  nextLineId: number
  nextZIndex: number
}

type Entity =
  | { type: "text", data: SerializedTextBox }
  | { type: "rect", data: SerializedRectangle }
  | { type: "line", data: SerializedLine }

function renderToAscii(filePath: string): string {
  // Load the .tigma file
  const content = fs.readFileSync(filePath, "utf-8")
  const design = JSON.parse(content) as TigmaFile

  // Determine canvas bounds
  let minX = 0, minY = 0, maxX = 80, maxY = 24

  for (const box of design.textBoxes) {
    maxX = Math.max(maxX, box.x + box.chars.length)
    maxY = Math.max(maxY, box.y)
  }

  for (const rect of design.rectangles) {
    maxX = Math.max(maxX, Math.max(rect.x1, rect.x2))
    maxY = Math.max(maxY, Math.max(rect.y1, rect.y2))
  }

  for (const line of design.lines) {
    maxX = Math.max(maxX, Math.max(line.x1, line.x2))
    maxY = Math.max(maxY, Math.max(line.y1, line.y2))
  }

  // Create a 2D grid
  const grid: string[][] = Array(maxY + 1)
    .fill(null)
    .map(() => Array(maxX + 1).fill(" "))

  // Collect all entities with their z-index
  const entities: (Entity & { zIndex: number })[] = [
    ...design.textBoxes.map(b => ({ type: "text" as const, data: b, zIndex: b.zIndex })),
    ...design.rectangles.map(r => ({ type: "rect" as const, data: r, zIndex: r.zIndex })),
    ...design.lines.map(l => ({ type: "line" as const, data: l, zIndex: l.zIndex })),
  ]

  // Sort by z-index (lower first, so higher renders on top)
  entities.sort((a, b) => a.zIndex - b.zIndex)

  // Render each entity
  for (const entity of entities) {
    if (entity.type === "text") {
      const box = entity.data
      for (let i = 0; i < box.chars.length; i++) {
        const x = box.x + i
        const y = box.y
        if (y >= 0 && y <= maxY && x >= 0 && x <= maxX) {
          grid[y][x] = box.chars[i]!.char
        }
      }
    } else if (entity.type === "rect") {
      const rect = entity.data
      const minRX = Math.min(rect.x1, rect.x2)
      const maxRX = Math.max(rect.x1, rect.x2)
      const minRY = Math.min(rect.y1, rect.y2)
      const maxRY = Math.max(rect.y1, rect.y2)

      // Draw corners
      grid[minRY][minRX] = "┌"
      grid[minRY][maxRX] = "┐"
      grid[maxRY][minRX] = "└"
      grid[maxRY][maxRX] = "┘"

      // Draw horizontal edges
      for (let x = minRX + 1; x < maxRX; x++) {
        grid[minRY][x] = "─"
        grid[maxRY][x] = "─"
      }

      // Draw vertical edges
      for (let y = minRY + 1; y < maxRY; y++) {
        grid[y][minRX] = "│"
        grid[y][maxRX] = "│"
      }
    } else if (entity.type === "line") {
      const line = entity.data
      const dx = Math.abs(line.x2 - line.x1)
      const dy = Math.abs(line.y2 - line.y1)
      const sx = line.x1 < line.x2 ? 1 : -1
      const sy = line.y1 < line.y2 ? 1 : -1
      let err = dx - dy
      let x = line.x1
      let y = line.y1

      while (true) {
        if (y >= 0 && y <= maxY && x >= 0 && x <= maxX) {
          // Determine line character based on direction
          if (dx === 0) {
            grid[y][x] = "│" // vertical
          } else if (dy === 0) {
            grid[y][x] = "─" // horizontal
          } else {
            grid[y][x] = "·" // diagonal
          }
        }

        if (x === line.x2 && y === line.y2) break

        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x += sx
        }
        if (e2 < dx) {
          err += dx
          y += sy
        }
      }
    }
  }

  // Convert grid to string
  return grid.map(row => row.join("")).join("\n")
}

// Main
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error("Usage: bun tigma-to-ascii.ts <design.tigma>")
  console.error("Example: bun tigma-to-ascii.ts mydesign.tigma")
  process.exit(1)
}

const filePath = path.resolve(args[0]!)
const ascii = renderToAscii(filePath)
console.log(ascii)
