/**
 * Tigma Design Loader
 *
 * A utility class for loading .tigma designs into your TUI application.
 * You can use this with @opentui/core or extract the rendering logic
 * for your own TUI framework.
 *
 * Usage:
 *
 * import { TigmaLoader } from "./tigma-loader"
 *
 * const loader = new TigmaLoader()
 * const design = loader.load("mydesign.tigma")
 *
 * // Render to ASCII
 * const ascii = loader.renderToAscii(design)
 *
 * // Or use with @opentui/core
 * loader.renderToBuffer(design, buffer)
 */

import * as fs from "fs"
import * as path from "path"

export interface SerializedColor {
  r: number
  g: number
  b: number
  a: number
}

export interface SerializedTextChar {
  char: string
  bold: boolean
  color: SerializedColor | null
}

export interface SerializedTextBox {
  id: number
  x: number
  y: number
  chars: SerializedTextChar[]
  zIndex: number
  strokeColor: SerializedColor | null
  fillColor: SerializedColor | null
}

export interface SerializedRectangle {
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

export interface SerializedLine {
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

export interface TigmaDesign {
  version: 1
  textBoxes: SerializedTextBox[]
  rectangles: SerializedRectangle[]
  lines: SerializedLine[]
  width: number
  height: number
}

export class TigmaLoader {
  /**
   * Load a .tigma design file
   */
  load(filePath: string): TigmaDesign {
    const content = fs.readFileSync(path.resolve(filePath), "utf-8")
    const data = JSON.parse(content)

    if (data.version !== 1) {
      throw new Error(`Unsupported .tigma version: ${data.version}`)
    }

    // Calculate bounds
    let width = 80
    let height = 24

    for (const box of data.textBoxes) {
      width = Math.max(width, box.x + box.chars.length)
      height = Math.max(height, box.y)
    }

    for (const rect of data.rectangles) {
      width = Math.max(width, Math.max(rect.x1, rect.x2))
      height = Math.max(height, Math.max(rect.y1, rect.y2))
    }

    for (const line of data.lines) {
      width = Math.max(width, Math.max(line.x1, line.x2))
      height = Math.max(height, Math.max(line.y1, line.y2))
    }

    return {
      version: data.version,
      textBoxes: data.textBoxes,
      rectangles: data.rectangles,
      lines: data.lines,
      width: width + 1,
      height: height + 1,
    }
  }

  /**
   * Render design to ASCII string
   */
  renderToAscii(design: TigmaDesign): string {
    const grid: string[][] = Array(design.height)
      .fill(null)
      .map(() => Array(design.width).fill(" "))

    // Collect all entities
    type Entity =
      | { type: "text", data: SerializedTextBox, zIndex: number }
      | { type: "rect", data: SerializedRectangle, zIndex: number }
      | { type: "line", data: SerializedLine, zIndex: number }

    const entities: Entity[] = [
      ...design.textBoxes.map(b => ({ type: "text" as const, data: b, zIndex: b.zIndex })),
      ...design.rectangles.map(r => ({ type: "rect" as const, data: r, zIndex: r.zIndex })),
      ...design.lines.map(l => ({ type: "line" as const, data: l, zIndex: l.zIndex })),
    ]

    entities.sort((a, b) => a.zIndex - b.zIndex)

    for (const entity of entities) {
      if (entity.type === "text") {
        this.renderTextBox(grid, entity.data)
      } else if (entity.type === "rect") {
        this.renderRectangle(grid, entity.data)
      } else if (entity.type === "line") {
        this.renderLine(grid, entity.data)
      }
    }

    return grid.map(row => row.join("")).join("\n")
  }

  /**
   * Render design to an @opentui/core buffer
   * (requires @opentui/core to be installed)
   */
  renderToBuffer(design: TigmaDesign, buffer: any, offsetX = 0, offsetY = 0) {
    // Sort by z-index
    type Entity =
      | { type: "text", data: SerializedTextBox, zIndex: number }
      | { type: "rect", data: SerializedRectangle, zIndex: number }
      | { type: "line", data: SerializedLine, zIndex: number }

    const entities: Entity[] = [
      ...design.textBoxes.map(b => ({ type: "text" as const, data: b, zIndex: b.zIndex })),
      ...design.rectangles.map(r => ({ type: "rect" as const, data: r, zIndex: r.zIndex })),
      ...design.lines.map(l => ({ type: "line" as const, data: l, zIndex: l.zIndex })),
    ]

    entities.sort((a, b) => a.zIndex - b.zIndex)

    for (const entity of entities) {
      if (entity.type === "text") {
        const box = entity.data
        const text = box.chars.map(c => c.char).join("")
        buffer.drawText(offsetX + box.x, offsetY + box.y, text, {
          color: box.strokeColor ? this.toRGBA(box.strokeColor) : undefined,
          bold: box.chars.some(c => c.bold),
        })
      }
      // Add rectangle and line rendering if needed
    }
  }

  /**
   * Export design as code constants (for static layouts)
   */
  exportAsCode(design: TigmaDesign, varName = "DESIGN"): string {
    const ascii = this.renderToAscii(design)
    const lines = ascii.split("\n")

    let code = `export const ${varName} = \`\n`
    code += lines.join("\n")
    code += "\n\`\n"

    return code
  }

  private renderTextBox(grid: string[][], box: SerializedTextBox) {
    for (let i = 0; i < box.chars.length; i++) {
      const x = box.x + i
      const y = box.y
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0]!.length) {
        grid[y]![x] = box.chars[i]!.char
      }
    }
  }

  private renderRectangle(grid: string[][], rect: SerializedRectangle) {
    const minX = Math.min(rect.x1, rect.x2)
    const maxX = Math.max(rect.x1, rect.x2)
    const minY = Math.min(rect.y1, rect.y2)
    const maxY = Math.max(rect.y1, rect.y2)

    const chars = rect.bold
      ? { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" }
      : { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" }

    // Corners
    this.setCell(grid, minX, minY, chars.tl)
    this.setCell(grid, maxX, minY, chars.tr)
    this.setCell(grid, minX, maxY, chars.bl)
    this.setCell(grid, maxX, maxY, chars.br)

    // Horizontal edges
    for (let x = minX + 1; x < maxX; x++) {
      this.setCell(grid, x, minY, chars.h)
      this.setCell(grid, x, maxY, chars.h)
    }

    // Vertical edges
    for (let y = minY + 1; y < maxY; y++) {
      this.setCell(grid, minX, y, chars.v)
      this.setCell(grid, maxX, y, chars.v)
    }
  }

  private renderLine(grid: string[][], line: SerializedLine) {
    const dx = Math.abs(line.x2 - line.x1)
    const dy = Math.abs(line.y2 - line.y1)
    const sx = line.x1 < line.x2 ? 1 : -1
    const sy = line.y1 < line.y2 ? 1 : -1
    let err = dx - dy
    let x = line.x1
    let y = line.y1

    const chars = line.bold
      ? { h: "━", v: "┃", diag: "●" }
      : { h: "─", v: "│", diag: "·" }

    while (true) {
      let char = chars.diag
      if (dx === 0) char = chars.v
      else if (dy === 0) char = chars.h

      this.setCell(grid, x, y, char)

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

  private setCell(grid: string[][], x: number, y: number, char: string) {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0]!.length) {
      grid[y]![x] = char
    }
  }

  private toRGBA(color: SerializedColor) {
    // If using @opentui/core, convert to RGBA
    // Otherwise return the color object as-is
    return color
  }
}
