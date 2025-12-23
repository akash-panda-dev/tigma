# Quick Start: Using Tigma Designs in Your App

## 3-Step Process

### 1. Create Your Design

```bash
bun run index.ts
```

- Use `R` for rectangles, `T` for text, `L` for lines
- Press `Ctrl+S` to save as `mydesign.tigma`

### 2. Convert to ASCII

```bash
bun tigma-to-ascii.ts mydesign.tigma
```

Copy the output!

### 3. Use in Your App

```typescript
const LAYOUT = `
[paste ASCII output here]
`

console.log(LAYOUT)
```

## That's it!

Your TUI design is now code you can use anywhere.

---

## Use Cases

**Static Headers/Banners**
```typescript
const BANNER = `...` // from Tigma
console.log(BANNER)
```

**Menu Templates**
```typescript
const MENU = loader.renderToAscii(design)
const filled = MENU.replace("{{TITLE}}", "My App")
```

**Dashboard Layouts**
```typescript
// Design the structure in Tigma
// Fill with data in your code
loader.renderToBuffer(dashboardDesign, buffer, 0, 0)
```

**Dialog Boxes**
```typescript
const dialogs = {
  error: loader.load("./dialogs/error.tigma"),
  confirm: loader.load("./dialogs/confirm.tigma"),
}
```

---

## Tools Provided

| File | Purpose |
|------|---------|
| `tigma-to-ascii.ts` | Convert .tigma → ASCII text |
| `tigma-loader.ts` | Load .tigma files in your app |
| `example-app.ts` | Full working example |
| `USAGE_GUIDE.md` | Complete documentation |

---

## Why Use Tigma?

✅ Design TUIs **visually** instead of coding ASCII by hand
✅ See exactly what your layout looks like
✅ Iterate quickly with mouse and keyboard
✅ Export to any TUI framework
✅ Version control your designs

**Tigma is to TUIs what Figma is to web apps!**
