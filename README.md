
<p align="center">
  <img src="https://placehold.co/1200x400/4f46e5/white?text=AtomicX" alt="AtomicX Logo" width="600">
</p>

<h1 align="center">AtomicX</h1>
<p align="center">
  <strong>Componentize HTML with Atomic CSS Semantics</strong><br>
  Zero-runtime · No build step · Pure HTML/CSS templating
</p>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Jeffrey0117/atomicX.svg)](https://github.com/Jeffrey0117/atomicX/stargazers)
[![Minified Size](https://img.shields.io/bundlephobia/min/atomicx)](https://github.com/Jeffrey0117/atomicX)

</div>

## ✨ Features

- **Macro Components** - Define reusable templates with `@macro:` syntax
- **Attribute Injection** - Dynamically inject content into slots using `{curly_braces}`
- **Micro Aliasing** - Create component variants with `@micro:` directives
- **Zero Dependencies** - Works with pure HTML/CSS (No JSX, no Virtual DOM)
- **Atomic CSS Ready** - Perfect companion for Tailwind/UnoCSS workflows
- **Debugging Tools** - Built-in utilities for template inspection

---
## 🔗 Demo

👉 [index.html](https://jeffrey0117.github.io/atomicX/)

👉 [Source code](https://github.com/Jeffrey0117/atomicX/blob/main/docs/index.html)


## 🚀 Quick Start

### CDN Installation
```html
<script src="https://cdn.jsdelivr.net/gh/Jeffrey0117/atomicX@latest/dist/atomicx.min.js"></script>
```

### Local Setup
1. Download [atomicx.js](https://github.com/Jeffrey0117/atomicX/blob/main/atomicx.js)
2. Add to your HTML:
```html
<script src="./atomicx.js"></script>
```

## 💡 Core Concepts

### 1. Macro Components
Define reusable templates directly in HTML:
```html
<!-- Copy the original element (which will still be rendered)-->
<div class="@macro:Card bg-white p-4 rounded-lg shadow">
  <h3 class="text-xl">{title}</h3>
  <p class="text-gray-600">{content}</p>
</div>

<!-- Usage -->
<Card title="Hello" content="World"></Card>
```

### 2. Attribute Injection
AtomicX supports three content injection modes:
```html
<Component 
  img="{logo.png}"        <!-- Injects src for <img> -->
  a="{https://example} text-[24px] text-red-500"   <!-- Injects href for <a> -->
  p="{Dynamic content} text-[18px] text-white"   <!-- Injects textContent for others -->
/>
```

### 3. Element Targeting
Style specific child elements using `el-[index]`:
```html
<Card 
  el-1="text-blue-500"    <!-- Styles first child -->
  el-2="bg-gray-100"      <!-- Styles second child -->
/>
```

## 📚 Documentation

| Section | Description |
|---------|-------------|
| [Core Syntax](docs/syntax.md) | Complete reference of @macro/@micro syntax |
| [Use Cases](docs/use-cases.md) | Common patterns and best practices |
| [Debugging](docs/debugging.md) | Troubleshooting templates |

## 🔍 Examples

### Card Component
```html
<!-- Define -->
<div class="@macro:ProfileCard flex gap-4 items-center">
  <img class="w-12 h-12 rounded-full" src="{avatar}">
  <div>
    <h4 class="font-bold">{name}</h4>
    <p class="text-sm">{role}</p>
  </div>
</div>

<!-- Use -->
<ProfileCard 
  avatar="user.jpg" 
  name="Jane Doe" 
  role="Frontend Developer"
/>
```

### Button Variants
```html
<!-- Base Button -->
<button class="@macro:Btn px-4 py-2 rounded @micro:PrimaryBtn bg-blue-500 text-white">
  {children}
</button>

<!-- Variants -->
<Btn>Default</Btn>
<PrimaryBtn>Primary</PrimaryBtn>
```

## 🛠️ Debugging

```javascript
// Show all processed components
atomicX.debug.showProcessedElements();

// Check specific component state
atomicX.debug.inspect('Card');
```

## 🌈 Why AtomicX?

| Scenario | Traditional HTML | With AtomicX |
|----------|------------------|--------------|
| Reusable Cards | Copy-paste div structures | `<Card h1="..."/>` |
| Style Variations | Multiple CSS classes | `@micro:Variant` |
| Content Slots | Repeated markup | `{slot_name}` syntax |
| Team Collaboration | Template fragmentation | Centralized macros |


## 🏗️ Roadmap

- [ ] VS Code extension
- [ ] CLI tool for static generation
- [ ] Interactive playground

## 🤝 Contributing

We welcome contributions! 

## 📜 License

MIT © [Jeffrey0117](https://github.com/Jeffrey0117)
