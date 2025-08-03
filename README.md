# AtomicX

AtomicX 是一個簡單直觀的工具，旨在讓動態 HTML +CSS渲染變得更加輕鬆。

## 只是想要切一個靜態頁嗎？
**AtomiX** 是一個基於原子化 CSS 思維的實驗性 UI 組件框架，目的是讓前端開發者可以：

- **以最少的 HTML 結構與語意性標籤實作樣板**
- **使用客製化的 `macro` / `micro` 語法**，動態展開 UI 元件
- **快速搭建乾淨、可重用的組件模板**

它結合了像是 `Tailwind CSS`、`UnoCSS` 的設計思路，讓 HTML 在保持結構乾淨的同時，還能靈活表達樣式與內容。

---


## 💡 就只是切個版，何必上框架？

在開發過程中，重複撰寫冗長的 Tailwind CSS 樣式是一件令人疲憊的事情。有時候想共用元件，但又沒有要寫JS互動。

因此，我創建了一個零依賴的系統，讓你可以撰寫自定義 HTML 標籤，並將其展開為可重用的 UI。

能使用 `<Card>` 或 `<Footer>` ，快速重用並且自由更改樣式，卻完全不需要使用React或Vue或其他庫。

**這就是 AtomicX替你辦到的事情。**


---

## ✨ Atomic可以做什麼？

### 1. `@macro:` 樣板註冊與展開
使用 `@macro:` 語法定義模板，並在 HTML 中重用它。

範例：
```html
<div class="@macro:Card border p-4 rounded">
  <h5>標題</h5>
  <p>描述文字</p>
</div>

<!-- 使用 -->
<Card h5="{我的標題}" p="{這是描述文字}"></Card>
```

🔧 **展開後，`Card` 會被替換成原始結構，並將 `h5` 和 `p` 的屬性插入對應的標籤中。**

---

### 2. **屬性插入：`el-0`, `el-1`**
你可以針對 Macro 展開後的子元素，加入自定義樣式或屬性。

範例：
```html
<Card el-2="bg-red-100"></Card>
```

---

### 3. **內容插入：`{}` 語法**
使用 `{}` 語法插入文字、連結或圖片。

範例：
```html
<Card h5="{標題文字}" a="{https://example.com}" img="{image.png} p-2"></Card>
```

- 若標籤是 `<img>` → 插入 `src`
- 若標籤是 `<a>` → 插入 `href`
- 其他 → 插入 `textContent`

---

### 4. **@micro:** 二次註冊
允許將 `<Test>` 替換成 `<Card>` 或其他 Macro 結構。

範例：
```html
<Card class="@micro:Test bg-white" h5="{標題}" p="{內文}"></Card>

<!-- 使用別名 -->
<Test></Test>
<Test h5="{替換的標題}" p="{替換的內文}"></Test>
```

⏩ 所有 `<Test>` 會展開為 `<Card>`，並覆蓋指定屬性（例如 `h5` 和 `p`）。

---

## ✅ 使用方式

### 1. 定義 Macro 原生元素
在 HTML 中使用 `@macro:` 定義模板：
```html
<div class="@macro:Card bg-gray-100 p-4 rounded">
  <h5>標題</h5>
  <p>描述文字</p>
</div>
```

### 2. 使用自定義復用元素
在 HTML 中使用自定義標籤：
```html
<Card h5="{我的標題}" p="{這是描述文字}"></Card>
```

### 3. 外部共用元素(export專用)
在 JavaScript 中模組化 AtomicX：
```html
<script src="atomicX.js"></script>
<script>
  atomicX.clear();
  atomicX.from("my.html");
</script>
```
意思是你要從my.html拿到你想共用的元素，通常可能是header或footer。

---
## 🔗 Demo

👉 [可以看 index.html 怎麼寫的](https://jeffrey0117.github.io/atomicX/)

---
## 文章教學

[為什麼 atomiX 要存在？](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-why.md)
[什麼場景下你需要用到它？](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-when.md)
[這不是模板語言](https://github.com/Jeffrey0117/atomicX/blob/main/articles/atomic-not-a-template.md)

---

## 📦 安裝方式

### 1. 使用 CDN
即將推出。

### 2. 本地安裝
直接下載 atomicX.js，並在 HTML 中引入：
```html
<script src="atomicX.js"></script>
```

---

## 🛠️ 調試工具

AtomicX 提供多種調試工具，幫助你檢查渲染過程：

```javascript
atomicX.debug.showProcessedElements(); // 顯示已處理的元素
atomicX.debug.showRenderedTags();      // 顯示已渲染的標籤
atomicX.debug.checkElements('Card');  // 檢查指定標籤的渲染狀態
```

---

## 🚀 未來計劃

- **官方網站**：提供完整的文件與範例。
- **元件庫**：預定義常用的 UI 元件模板。
- **進階功能**：支援嵌套 Macro 與條件渲染。

---

## 🧭 AtomiX 不是「再造 HTML」，是「讓 HTML 活起來」。
這個點子一開始不是為了創造什麼新框架，也不是為了「炫技」——
而是因為受夠了那些重複的、沒意義的、只能複製貼上的 HTML 結構。

> 「就像 React 一樣可以 component 化，為什麼 HTML 不行？」
> 「這些卡片、欄位、按鈕樣板我每天都在貼，為什麼不能一行搞定？」
> 「我不想再複製貼上三次 `<div class="Card">，我只想要寫 <Card>`，結束。」
「Tailwind 很強，但還不夠。我想自己定義語意，像在講我自己的話。」

從這個初衷出發，設計一種機制，
它不是要取代框架，而是釋放原始 HTML 的力量，讓靜態頁面也能用最小的學習成本、最直覺的語法達成元件重用、動態覆蓋與批次展開。

我說過一段我自己都很震驚的話：

「就像是 HTML 版的虛擬 DOM，我想先排好語意跟順序，最後一層層展開。React 要編譯，我這是純 JS 執行，沒包裝、無痛學習，一般人也看得懂。」

這些話現在回想起來，已經不是靈感，是宣言了。


