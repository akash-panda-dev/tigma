# Using Tigma Designs in Your TUI Application

This guide shows you how to create designs in Tigma and then import them into your TUI application.

## Workflow Overview

```
1. Design in Tigma (visual tool)
   ↓
2. Save as .tigma file
   ↓
3. Convert to usable format
   ↓
4. Import into your TUI app
```

## Step 1: Create Your Design

Run Tigma to create your TUI layout visually:

```bash
# Start Tigma
bun run index.ts

# Or if installed via npm
bunx tigma
```

**Design your TUI layout:**
- Press `R` for Rectangle tool - draw boxes for panels, borders, etc.
- Press `T` for Text tool - add labels, titles, menu items
- Press `L` for Line tool - draw separators, connections
- Press `M` for Move tool - select and reposition elements

**Save your design:**
- Press `Ctrl+S` to save
- Name it something like `dashboard.tigma` or `menu-layout.tigma`

## Step 2: Export Your Design

You have **3 options** for using your design:

### Option A: Export to ASCII Text (Simplest)

Convert your design to plain text that you can copy-paste:

```bash
bun tigma-to-ascii.ts dashboard.tigma
```

Output example:
```
┌─────────────────────────────┐
│     Application Title       │
├─────────────────────────────┤
│                             │
│  Main Content Area          │
│                             │
└─────────────────────────────┘
```

**Use it in your app:**
```typescript
const HEADER_DESIGN = `
┌─────────────────────────────┐
│     Application Title       │
└─────────────────────────────┘
`

// In your TUI app, just print it
console.log(HEADER_DESIGN)

// Or with @opentui/core
buffer.drawText(0, 0, HEADER_DESIGN)
```

### Option B: Load .tigma File Dynamically

Use the TigmaLoader class to load designs at runtime:

```typescript
import { TigmaLoader } from "./tigma-loader"

const loader = new TigmaLoader()

// Load the design
const design = loader.load("./designs/dashboard.tigma")

// Render to ASCII string
const ascii = loader.renderToAscii(design)
console.log(ascii)

// Or export as code constant
const code = loader.exportAsCode(design, "DASHBOARD")
console.log(code)
```

**Benefits:**
- Can modify designs without recompiling code
- Easy to swap between different layouts
- Can load user-created themes

### Option C: Export as Code Constants

Generate TypeScript/JavaScript constants from your design:

```typescript
import { TigmaLoader } from "./tigma-loader"

const loader = new TigmaLoader()
const design = loader.load("dashboard.tigma")
const code = loader.exportAsCode(design, "DASHBOARD_LAYOUT")

// Save to file
import * as fs from "fs"
fs.writeFileSync("layouts.ts", code)
```

This generates:
```typescript
export const DASHBOARD_LAYOUT = `
┌─────────────────────────────┐
│     Application Title       │
├─────────────────────────────┤
│                             │
│  Main Content Area          │
│                             │
└─────────────────────────────┘
`
```

**Use in your app:**
```typescript
import { DASHBOARD_LAYOUT } from "./layouts"

console.log(DASHBOARD_LAYOUT)
```

## Step 3: Integrate with Your TUI Framework

### With @opentui/core (Same framework as Tigma)

```typescript
import { createCliRenderer, RGBA, BoxRenderable } from "@opentui/core"
import { TigmaLoader } from "./tigma-loader"

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 60,
  })

  const loader = new TigmaLoader()
  const design = loader.load("./dashboard.tigma")

  const canvas = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    renderAfter: (buffer) => {
      // Render the Tigma design
      loader.renderToBuffer(design, buffer, 0, 0)

      // Add dynamic content on top
      buffer.drawText(10, 5, "Dynamic content here!", {
        color: RGBA.fromInts(255, 255, 255, 255),
      })
    },
  })

  renderer.start()
}

main()
```

### With Other TUI Frameworks (blessed, ink, etc.)

Just use the ASCII output:

```typescript
// With blessed
import blessed from "blessed"
import { TigmaLoader } from "./tigma-loader"

const screen = blessed.screen()
const loader = new TigmaLoader()
const design = loader.load("./menu.tigma")

const box = blessed.box({
  content: loader.renderToAscii(design),
  border: "none",
})

screen.append(box)
screen.render()
```

```typescript
// With ink (React for CLIs)
import React from "react"
import { render, Text } from "ink"
import { TigmaLoader } from "./tigma-loader"

const loader = new TigmaLoader()
const design = loader.load("./layout.tigma")

const App = () => (
  <Text>{loader.renderToAscii(design)}</Text>
)

render(<App />)
```

### With Plain Node.js/Console

```typescript
import { TigmaLoader } from "./tigma-loader"

const loader = new TigmaLoader()
const design = loader.load("./banner.tigma")

console.clear()
console.log(loader.renderToAscii(design))
```

## Example Use Cases

### 1. Static Headers/Banners

Create a fancy ASCII art header:

```bash
# In Tigma, design your banner
# Save as banner.tigma
# Export to ASCII

bun tigma-to-ascii.ts banner.tigma > banner.txt
```

```typescript
import * as fs from "fs"
const BANNER = fs.readFileSync("./banner.txt", "utf-8")

console.log(BANNER)
console.log("Welcome to MyApp!")
```

### 2. Menu Layouts

Design menu structures visually:

```typescript
const loader = new TigmaLoader()
const menuDesign = loader.load("./menu-layout.tigma")
const menuAscii = loader.renderToAscii(menuDesign)

// Replace placeholders with actual menu items
const menu = menuAscii
  .replace("Option 1", options[0])
  .replace("Option 2", options[1])

console.log(menu)
```

### 3. Dashboard Panels

Create complex dashboard layouts:

```typescript
// Load the dashboard template
const dashboard = loader.load("./dashboard.tigma")

// Render it with your TUI framework
// The design provides the structure
// Your code provides the dynamic data
```

### 4. Dialog Boxes

Design modal/dialog templates:

```typescript
const dialogs = {
  confirm: loader.load("./dialogs/confirm.tigma"),
  error: loader.load("./dialogs/error.tigma"),
  info: loader.load("./dialogs/info.tigma"),
}

function showDialog(type: keyof typeof dialogs, message: string) {
  const layout = loader.renderToAscii(dialogs[type])
  const withMessage = layout.replace("{{MESSAGE}}", message)
  console.log(withMessage)
}

showDialog("error", "File not found!")
```

## Advanced: Using Tigma as a Component

If you want full control, you can integrate Tigma's rendering engine directly:

```typescript
// Extract the rendering functions from index.ts
import { RGBA } from "@opentui/core"

// Copy the rectangle/line/text rendering logic
// from the Tigma source code and use it in your app

class DesignRenderer {
  renderRectangle(buffer, rect) {
    // Copy from index.ts renderRectangle method
  }

  renderText(buffer, textBox) {
    // Copy from index.ts renderTextBox method
  }

  // etc.
}
```

## Tips

1. **Keep designs modular** - Create separate .tigma files for different UI components (header.tigma, sidebar.tigma, footer.tigma)

2. **Use placeholders** - Put placeholder text like `{{TITLE}}` or `{{CONTENT}}` in your designs that you can replace with dynamic content

3. **Version control** - Commit .tigma files to git so your team can collaborate on UI designs

4. **Design tokens** - Use consistent spacing/sizing in Tigma that matches your TUI app's grid

5. **Test in terminal** - Your design will look different in different terminal sizes, test with:
   ```bash
   # Test in small terminal
   stty cols 80 rows 24
   bun tigma-to-ascii.ts design.tigma
   ```

## Complete Example: Building a TUI App

```typescript
// app.ts
import { createCliRenderer, RGBA, BoxRenderable } from "@opentui/core"
import { TigmaLoader } from "./tigma-loader"

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  })

  const loader = new TigmaLoader()

  // Load multiple designs
  const designs = {
    header: loader.load("./designs/header.tigma"),
    sidebar: loader.load("./designs/sidebar.tigma"),
    main: loader.load("./designs/main-panel.tigma"),
  }

  // Application state
  let currentView = "home"
  let messages = ["Welcome!", "System ready"]

  const canvas = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    renderAfter: (buffer) => {
      // Render header
      loader.renderToBuffer(designs.header, buffer, 0, 0)

      // Render sidebar
      loader.renderToBuffer(designs.sidebar, buffer, 0, 3)

      // Render main panel
      loader.renderToBuffer(designs.main, buffer, 20, 3)

      // Add dynamic content
      let y = 5
      for (const msg of messages) {
        buffer.drawText(22, y++, msg, {
          color: RGBA.fromInts(255, 255, 255, 255),
        })
      }
    },
  })

  // Handle keyboard input
  renderer.onKey((key) => {
    if (key.name === "space") {
      messages.push(`Key pressed at ${new Date().toLocaleTimeString()}`)
      renderer.requestRender()
    }
  })

  renderer.start()
}

main()
```

## File Structure Recommendation

```
my-tui-app/
├── designs/              # Your .tigma design files
│   ├── header.tigma
│   ├── sidebar.tigma
│   ├── main-panel.tigma
│   └── dialogs/
│       ├── confirm.tigma
│       └── error.tigma
├── src/
│   ├── app.ts           # Main application
│   ├── layouts.ts       # Generated code constants (if using Option C)
│   └── tigma-loader.ts  # Copy from this repo
├── package.json
└── README.md
```

## Summary

1. **Design visually** in Tigma (much easier than coding ASCII by hand!)
2. **Export** to ASCII text, code constants, or load dynamically
3. **Integrate** into your TUI app using your framework of choice
4. **Update** designs without touching code (if loading dynamically)

Tigma is your **visual design tool** for TUI layouts - like Figma is for web design, but for terminal interfaces!
