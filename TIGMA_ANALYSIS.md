# Tigma TUI Framework Analysis

## Overview

Tigma is a terminal-based design tool built on **@opentui/core**, a TUI (Text User Interface) framework. It demonstrates how to create interactive, mouse-driven terminal applications with features like drawing tools, color management, undo/redo, and file persistence.

## Core Architecture

### 1. **Framework: @opentui/core**

Tigma is built using the `@opentui/core` library, which provides:

- **CliRenderer**: Main rendering engine for terminal UIs
- **RGBA**: Color management system
- **BoxRenderable**: Component for creating interactive UI boxes
- **TextAttributes**: Text styling capabilities
- **Event Handling**: Mouse and keyboard event systems
- **OptimizedBuffer**: High-performance rendering buffer

### 2. **Application Structure**

The main application follows this pattern:

```typescript
// 1. Create the renderer
const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 60,
  useConsole: false,
  enableMouseMovement: true,
})

// 2. Create your application class
class CanvasApp {
  constructor(renderer: CliRenderer) {
    this.renderer = renderer

    // 3. Create renderable components
    this.canvas = new BoxRenderable(renderer, {
      width: "100%",
      height: "100%",
      onMouse: (event) => this.handleMouse(event),
      renderAfter: (buffer) => this.render(buffer),
    })
  }
}

// 4. Start the renderer
renderer.start()
```

## Key Features Demonstrated

### 1. **Drawing System**

Tigma implements multiple drawing tools:

- **Text Tool**: Create and edit text boxes with cursor navigation
- **Rectangle Tool**: Draw boxes using box-drawing characters
- **Line Tool**: Draw lines using Bresenham's algorithm
- **Move Tool**: Select, move, and resize objects

### 2. **State Management**

```typescript
interface TextBox {
  id: number
  x: number
  y: number
  chars: TextChar[]
  zIndex: number
  strokeColor: EntityColor
  fillColor: EntityColor
}

interface Rectangle {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  bold: boolean
  zIndex: number
  strokeColor: EntityColor
  fillColor: EntityColor
}
```

### 3. **Color Management**

Two separate color palettes:
- **Stroke Palette**: Bright colors for text, borders, lines
- **Fill Palette**: Muted colors for backgrounds

```typescript
const STROKE_PALETTE: (RGBA | null)[] = [
  null, // transparent
  RGBA.fromInts(0, 0, 0, 255),       // black
  RGBA.fromInts(255, 255, 255, 255), // white
  // ...
]
```

### 4. **History Management (Undo/Redo)**

```typescript
interface HistorySnapshot {
  textBoxes: TextBox[]
  rectangles: Rectangle[]
  lines: Line[]
  nextTextBoxId: number
  nextRectId: number
  nextLineId: number
  nextZIndex: number
}
```

### 5. **File Persistence**

Designs are saved as `.tigma` files in JSON format:

```typescript
interface TigmaFile {
  version: 1
  textBoxes: SerializedTextBox[]
  rectangles: SerializedRectangle[]
  lines: SerializedLine[]
  // ... state counters
}
```

### 6. **Event Handling**

**Mouse Events:**
```typescript
onMouse(event: MouseEvent) {
  // Handle clicks, drags, movement
  // event.button, event.x, event.y, event.type
}
```

**Keyboard Events:**
```typescript
renderer.onKey((key: KeyEvent) => {
  // Handle key presses
  // key.name, key.ctrl, key.sequence
})
```

### 7. **Layering System**

Objects are rendered based on z-index for proper stacking:
- Each object has a `zIndex` property
- Higher z-index = rendered on top
- Selection and hover states are rendered above objects

## How to Import into Your TUI App

### Option 1: Use @opentui/core Directly

Install the dependency:
```bash
bun add @opentui/core
# or
npm install @opentui/core
```

Create a basic TUI application:

```typescript
import {
  createCliRenderer,
  RGBA,
  BoxRenderable,
  type CliRenderer,
  type MouseEvent,
  type KeyEvent,
  type OptimizedBuffer,
} from "@opentui/core"

class MyTuiApp {
  private renderer: CliRenderer
  private canvas: BoxRenderable

  constructor(renderer: CliRenderer) {
    this.renderer = renderer

    this.canvas = new BoxRenderable(renderer, {
      id: "my-canvas",
      width: "100%",
      height: "100%",
      backgroundColor: RGBA.fromInts(0, 0, 0, 255),
      onMouse: (event: MouseEvent) => this.handleMouse(event),
      renderAfter: (buffer: OptimizedBuffer) => this.render(buffer),
    })

    renderer.onKey((key: KeyEvent) => this.handleKey(key))
  }

  handleMouse(event: MouseEvent) {
    // Handle mouse events
    console.log(`Mouse: ${event.type} at ${event.x},${event.y}`)
    this.renderer.requestRender()
  }

  handleKey(key: KeyEvent) {
    // Handle keyboard events
    if (key.ctrl && key.name === "c") {
      process.exit(0)
    }
  }

  render(buffer: OptimizedBuffer) {
    // Custom rendering logic
    buffer.drawText(5, 5, "Hello TUI!", {
      color: RGBA.fromInts(255, 255, 255, 255),
      bold: true,
    })
  }
}

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 60,
    enableMouseMovement: true,
  })

  const app = new MyTuiApp(renderer)
  renderer.start()
}

main()
```

### Option 2: Extract Components from Tigma

You can copy specific features from Tigma:

1. **Drawing Tools** - Copy the rectangle/line/text rendering logic
2. **Color System** - Use the STROKE_PALETTE and FILL_PALETTE approach
3. **History System** - Implement undo/redo with snapshots
4. **File Persistence** - Use the serialization pattern

Example - Extract the rectangle drawing:

```typescript
interface Rectangle {
  x1: number
  y1: number
  x2: number
  y2: number
  strokeColor: RGBA | null
  fillColor: RGBA | null
  bold: boolean
}

function drawRectangle(buffer: OptimizedBuffer, rect: Rectangle) {
  const minX = Math.min(rect.x1, rect.x2)
  const maxX = Math.max(rect.x1, rect.x2)
  const minY = Math.min(rect.y1, rect.y2)
  const maxY = Math.max(rect.y1, rect.y2)

  // Fill interior
  if (rect.fillColor) {
    for (let y = minY + 1; y < maxY; y++) {
      for (let x = minX + 1; x < maxX; x++) {
        buffer.drawText(x, y, " ", {
          backgroundColor: rect.fillColor,
        })
      }
    }
  }

  // Draw border
  if (rect.strokeColor) {
    // Draw corners and edges
    // ... (see index.ts for full implementation)
  }
}
```

### Option 3: Use Tigma as a Component

If you want to embed Tigma's canvas functionality:

```typescript
import { CanvasApp } from "tigma"

// Note: You'd need to export CanvasApp from index.ts first
// This is not currently exported, so you'd need to modify the source
```

## Key Patterns to Learn From Tigma

### 1. **Tool Pattern**
```typescript
type Tool = "move" | "text" | "rectangle" | "line"

interface ToolInfo {
  name: string
  key: string
}

const TOOLS: Record<Tool, ToolInfo> = {
  move: { name: "Move", key: "M" },
  text: { name: "Text", key: "T" },
  // ...
}
```

### 2. **Rendering Pipeline**
```typescript
renderAfter(buffer: OptimizedBuffer) {
  // 1. Sort entities by z-index
  const allEntities = [...this.textBoxes, ...this.rectangles, ...this.lines]
    .sort((a, b) => a.zIndex - b.zIndex)

  // 2. Render each entity
  for (const entity of allEntities) {
    this.renderEntity(buffer, entity)
  }

  // 3. Render UI overlays (selection, toolbar, etc.)
  this.renderUI(buffer)
}
```

### 3. **State Snapshot for Undo/Redo**
```typescript
private history: HistorySnapshot[] = []
private historyIndex = -1

saveSnapshot() {
  const snapshot = {
    textBoxes: JSON.parse(JSON.stringify(this.textBoxes)),
    rectangles: JSON.parse(JSON.stringify(this.rectangles)),
    // ... other state
  }
  this.history.splice(this.historyIndex + 1)
  this.history.push(snapshot)
  this.historyIndex++
}

undo() {
  if (this.historyIndex > 0) {
    this.historyIndex--
    this.restoreSnapshot(this.history[this.historyIndex])
  }
}
```

### 4. **Mouse Interaction**
```typescript
handleMouse(event: MouseEvent) {
  if (event.type === "mousedown" && event.button === "left") {
    const clicked = this.findObjectAt(event.x, event.y)
    if (clicked) {
      this.selectedIds = new Set([clicked.id])
    }
  }

  if (event.type === "drag") {
    this.moveSelectedObjects(event.x - this.dragStartX, event.y - this.dragStartY)
  }
}
```

## Running Tigma

```bash
# Install dependencies
bun install

# Run directly
bun run index.ts

# Open an existing file
bun run index.ts mydesign.tigma

# Or use the published version
bunx tigma
```

## Building Your TUI App with These Concepts

1. **Install @opentui/core** as your TUI framework
2. **Create a CliRenderer** instance with your desired settings
3. **Design your data models** (similar to TextBox, Rectangle, Line)
4. **Implement event handlers** for mouse and keyboard
5. **Create a rendering function** that draws to the OptimizedBuffer
6. **Add state management** if you need undo/redo
7. **Implement file persistence** if you need to save/load state

## Example: Minimal TUI App Template

```typescript
import { createCliRenderer, RGBA, BoxRenderable } from "@opentui/core"

async function main() {
  // 1. Setup renderer
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 60,
    enableMouseMovement: true,
  })

  renderer.setBackgroundColor(RGBA.fromInts(0, 0, 0, 255))

  // 2. Create your state
  let message = "Click anywhere!"
  let clickCount = 0

  // 3. Create canvas
  const canvas = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    onMouse: (event) => {
      if (event.type === "mousedown") {
        clickCount++
        message = `Clicked ${clickCount} times at (${event.x}, ${event.y})`
        renderer.requestRender()
      }
    },
    renderAfter: (buffer) => {
      buffer.drawText(2, 2, message, {
        color: RGBA.fromInts(255, 255, 255, 255),
      })
    },
  })

  // 4. Handle keyboard
  renderer.onKey((key) => {
    if (key.name === "r") {
      clickCount = 0
      message = "Counter reset!"
      renderer.requestRender()
    }
  })

  // 5. Start
  renderer.start()
}

main()
```

## Conclusion

Tigma demonstrates professional TUI development patterns using @opentui/core. The key concepts you can learn and reuse are:

- Event-driven architecture with mouse and keyboard handlers
- Component-based rendering with BoxRenderable
- State management with snapshots for undo/redo
- Layered rendering with z-index
- File persistence with JSON serialization
- Color management with palettes
- Tool-based interaction patterns

You can either use @opentui/core directly in your project or extract specific patterns and components from Tigma's implementation.
