## ✨ 專案介紹 (AtomicX=AtomiX)

**AtomiX** 是一個基於原子化 CSS 思維的實驗性 UI 組件框架，目的是讓前端開發者可以：

- **以最少的 HTML 結構與語意性標籤實作樣板**
- **使用客製化的 `macro` / `micro` 語法**，動態展開 UI 元件
- **快速搭建乾淨、可重用的組件模板**

它結合了像是 `Tailwind CSS`、`UnoCSS` 的設計思路，讓 HTML 在保持結構乾淨的同時，還能靈活表達樣式與內容。

---

## ✅ 目前功能

### 1. `@macro:` 樣板註冊與展開

在任何元素中加入 `@macro:Name` 的 class，即可註冊該元素為 `macro` 模板：

```html
<div class="@macro:Card bg-white p-4">
  <h5>Title</h5>
  <p>Description</p>
</div>

<!-- 使用 -->
<Card h5="{My Title}" p="{Some description}"></Card>
```

🔧 **展開後會自動將 `Card` 替換成原始結構，並將 `h5`, `p` 等屬性插入對應標籤中。**

---

### 2. `el-0`, `el-1`：自定 index 層級插入 class

你可以針對某個 macro 展開後的第幾層子元素，加入 class：

```html
<Card el-2="bg-red-100"></Card>
```

---

### 3. `{}` 語法：插入文字、連結、圖片

```html
<Card h5="{Title Text}" a="{https://example.com}" img="{image.png} p-2"></Card>
```

- 若標籤是 `<img>` → 插入 `src`
- 若標籤是 `<a>` → 插入 `href`
- 其他 → 插入 `textContent`

---

### 4. `@micro:`：語意標籤別名（Macro Alias）

允許將 `<Test>` 替換成 `<Card>`（或其他 macro 結構）：

```html
<Card class="@micro:Test bg-white" h5="{標題} text-black" p="{內文}"></Card>

<!-- 使用別名 -->
<Test></Test>
<Test h5="{替換的標題} text-red-500"></Test>
```

⏩ 所有 `<Test>` 會展開為一個 `<Card>`，可覆蓋指定屬性（例如 `h5`、`p` 等）。

## 🔗 Demo

👉 [可以看 index.html 怎麼寫的](https://jeffrey0117.github.io/atomicX/)

## 文章教學

[為什麼 atomiX 要存在？](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-why.md)
[什麼場景下你需要用到它？](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-when.md)
[這不是模板語言](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-not-a-template.md)

---

# AtomicX

> A macro-based atomic CSS system designed to simplify UI development in static HTML environments.

## 💡 Why AtomicX?

I was tired of copy-pasting long Tailwind classes across pages.  
I wanted to reuse UI chunks like `<Card>` or `<FooterItem>` **without React, Vue, or build tools**.  
So I built AtomicX: a zero-dependency, compiler-style system that lets you write custom HTML tags that get expanded into reusable UI blocks.

## ✨ Features

- @macro: Define component-style HTML blocks
- Slot-like content insertion
- Responsive syntax like `pt[10px|1em|2em]`
- No bundler, no framework required
- Great for prototyping, CMS-based sites, and static HTML projects

## 🚀 Quick Start

```html
@macro:Card border p-4 rounded
<div class="Card">...</div>
```

Include the script:

```html
<script src="atomicX.js"></script>
```

## 📦 Installation

Just include atomicx.js via CDN or local script tag.

CDN (coming soon)

## 🔗 Demo

👉 [Live Demo here](https://jeffrey0117.github.io/atomicX/)
