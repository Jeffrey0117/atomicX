
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

## Features

- **Macro Components** - Define reusable templates with `@macro:` syntax
- **Attribute Injection** - Dynamically inject content into slots using `{curly_braces}`
- **Micro Aliasing** - Create component variants with `@micro:` directives
- **Zero Dependencies** - Works with pure HTML/CSS (No JSX, no Virtual DOM)
- **Atomic CSS Ready** - Perfect companion for Tailwind/UnoCSS workflows
- **Debugging Tools** - Built-in utilities for template inspection

## Why AtomicX?

| Scenario | Traditional HTML | With AtomicX |
|----------|------------------|--------------|
| Reusable Cards | Copy-paste div structures | `<Card h1="..."/>` |
| Style Variations | Multiple CSS classes | `@micro:Variant` |
| Content Slots | Repeated markup | `{slot_name}` syntax |
| Team Collaboration | Template fragmentation | Centralized macros |

---
## Demo

👉 [index.html](https://jeffrey0117.github.io/atomicX/)

👉 [Source code](https://github.com/Jeffrey0117/atomicX/blob/main/docs/index.html)


## Quick Start

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

## Core Concepts

### 1. Macro Components
Define reusable templates directly in HTML:
```html
<!-- Copy the original element (which will still be rendered)-->
<div class="@macro:Card bg-white p-4 rounded-lg shadow">
  <h3 class="text-xl">The first Product</h3>
  <p class="text-gray-600">something about this stuff</p>
</div>

<!-- Usage -->
<Card h3="{The second Prodcut}" p="{here is NEW stuff}"></Card>
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
### 4. Export Component

#### page1.html
``` 
    <div class="@export:Card max-w-[1460px] mx-auto py-[55px] ">  <!-- Make this UI reuseable -->
        <h1 class="text-6xl font-bold text-gray-800">News</h1>
        <p class="text-[20px] mt-3">Choose your country, Please select your region to find the contact closest to you.</p>
    </div>
```

#### new.html
```
 <Card> </Card>  <!-- This is the component which you had export from page1.html -->
 <Card h1="{GOODS}" p="text-[32px] mt-5"> </Card>

  <script>
    atomicX.clear(); <!-- Clear the cache -->
    atomicX.from("page1.html");   <!-- Get your components from page1.html-->
  </script>
```
## Documentation

| Section | Description |
|---------|-------------|
| [Core Syntax](docs/syntax.md) | Complete reference of @macro/@micro syntax |
| [Use Cases](docs/use-cases.md) | Common patterns and best practices |
| [Debugging](docs/debugging.md) | Troubleshooting templates |


## Debugging

```javascript
// Show all processed components
atomicX.debug.showProcessedElements();

// Check specific component state
atomicX.debug.inspect('Card');
```


## 🏗Roadmap

- [ ] VS Code extension
- [ ] CLI tool for static generation
- [ ] Interactive playground

## Contributing

We welcome contributions! 

## License

MIT © [Jeffrey0117](https://github.com/Jeffrey0117)


