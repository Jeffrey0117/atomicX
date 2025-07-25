# 📘 AtomicX — 語法準則手冊

### ✅ 元件定義方式（macro/micro/export）

- `@macro:Card`：定義可複用的主元件，並保留畫面。
- `@micro:Test`：定義原生元件，會被 clone 並可被其他元件繼承。
- `@export:FooterBlock`：輸出元件供外部載入，並保留畫面。

---

### ✅ Slot 語法（屬性為 slot 的 mapping）

- 格式為：`tagName="{文字內容} 額外 class"`
- 支援空格、多組 class，需自動 split 並加到原始 micro 元件 class 中。
- 原 micro 的 class **不被覆蓋**，而是與 slot 中 class 合併（**繼承**概念）。

---

### ✅ 屬性 slot 特殊語法（img/src、文字等）

- `<img>` 元素若被指定 `{xxx.png}`，轉為 `src="xxx.png"`
- 一般 tag 則為 `textContent = xxx`

---

### ✅ Slot 元素刪除（el-N）

- `el-2="*"`：代表刪除 micro 元件中的第 2 個子元素。
