const rendered = new Map(); // 儲存 @export 渲染用的 <Card>、<Header>...
const exportMap = new Map(); // 備用用來追蹤 export 定義
const macroTemplates = new Map(); // 儲存 @macro 定義的區塊

const AtomicX = {
  // 解析屬性值，正確處理包含空格的 {...} 內容
  parseAttributeValue(value) {
    const result = [];
    let current = "";
    let inBraces = false;
    let i = 0;

    while (i < value.length) {
      const char = value[i];

      if (char === "{" && !inBraces) {
        // 開始文字內容
        if (current.trim()) {
          // 如果有前面的 class，先處理
          current
            .trim()
            .split(/\s+/)
            .forEach((cls) => {
              if (cls) result.push({ type: "class", content: cls });
            });
        }
        current = "";
        inBraces = true;
      } else if (char === "}" && inBraces) {
        // 結束文字內容
        result.push({ type: "text", content: current });
        current = "";
        inBraces = false;
      } else if (char === " " && !inBraces) {
        // 空格分隔 class
        if (current.trim()) {
          result.push({ type: "class", content: current.trim() });
          current = "";
        }
      } else {
        current += char;
      }

      i++;
    }

    // 處理最後剩餘的內容
    if (current.trim()) {
      if (inBraces) {
        result.push({ type: "text", content: current });
      } else {
        current
          .trim()
          .split(/\s+/)
          .forEach((cls) => {
            if (cls) result.push({ type: "class", content: cls });
          });
      }
    }

    return result;
  },

  async loadExports(url) {
    const res = await fetch(url);
    const html = await res.text();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const exportEls = temp.querySelectorAll("[class*='@export:']");
    exportEls.forEach((el) => {
      const match = el.className.match(/@export:(\w+)/);
      if (match) {
        const name = match[1].toLowerCase();
        rendered.set(name, el.cloneNode(true));
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const macros = new Map();
  const macroTemplates = [];
  const microMap = new Map();

  const exportMap = new Map();

  // 一次性收集所有需要處理的元素，避免重複查詢
  const allElements = document.querySelectorAll("*");

  // 收集 micro - 優化：一次遍歷完成
  allElements.forEach((el) => {
    const cls = el.getAttribute("class") || "";
    const microMatch = cls.match(/@micro:(\w+)/);
    if (microMatch) {
      const name = microMatch[1].toLowerCase();
      // 保存完整的元素，包括所有屬性
      const clonedEl = el.cloneNode(true);
      // 移除 @micro: 標記從 class 中
      const newClass = cls.replace(`@micro:${name}`, "").trim();
      if (newClass) {
        clonedEl.setAttribute("class", newClass);
      } else {
        clonedEl.removeAttribute("class");
      }
      microMap.set(name, clonedEl);
    }

    // 同時收集 macro - 避免再次遍歷
    const macroMatch = cls.match(/@macro:(\w+)/);
    if (macroMatch) {
      const name = macroMatch[1];
      macroTemplates.push({ name, el });
    }

    // 同時收集 export - 避免再次遍歷
    const exportMatch = cls.match(/@export:(\w+)/);
    if (exportMatch) {
      const name = exportMatch[1];
      exportMap.set(name.toLowerCase(), el.cloneNode(true));
    }
  });

  microMap.forEach((templateEl, tagName) => {
    document.querySelectorAll(tagName).forEach((el) => {
      // 克隆模板元素
      const clone = templateEl.cloneNode(true);

      // 將別名標籤的屬性合併到克隆的模板上
      for (const attr of el.getAttributeNames()) {
        const val = el.getAttribute(attr);
        // 合併 class 屬性，而不是直接覆蓋
        if (attr === "class") {
          const existingClasses = clone.getAttribute("class") || "";
          const newClasses = val || "";
          const combinedClasses = [existingClasses, newClasses]
            .filter(Boolean)
            .join(" ");
          clone.setAttribute("class", combinedClasses);
        } else {
          // 如果別名標籤有屬性，則覆蓋模板中的相同屬性
          clone.setAttribute(attr, val);
        }
      }

      // 用處理後的克隆替換別名標籤
      el.replaceWith(clone);
    });
  });

  function expandMacro(name) {
    if (rendered.has(name)) return rendered.get(name).cloneNode(true);
    const macro = macroTemplates.find((m) => m.name === name);
    if (!macro) return null;

    const original = macro.el.cloneNode(true);

    original.querySelectorAll("*").forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (rendered.has(tag)) {
        const expanded = rendered.get(tag).cloneNode(true);
        el.replaceWith(expanded);
      }
    });

    rendered.set(name, original.cloneNode(true));
    return original.cloneNode(true);
  }

  // 收集 macro
  macroTemplates.forEach(({ name }) => expandMacro(name));

  rendered.forEach((template, tagName) => {
    // 優化：一次查詢，緩存結果
    const targetElements = document.querySelectorAll(tagName);
    if (targetElements.length === 0) return;

    targetElements.forEach((el) => {
      const clone = template.cloneNode(true);
      const extraClass = el.getAttribute("class") || "";

      // 提前處理 class 屬性 - 只應用到最外層容器
      if (extraClass.trim()) {
        const classList = extraClass.trim().split(/\s+/);
        classList.forEach((cls) => {
          // 排除 @macro: 標記，其他 class 直接添加到最外層 clone
          if (cls && !cls.startsWith("@")) {
            clone.classList.add(cls);
          }
        });
      }

      // 優化：緩存屬性名稱列表
      const attributeNames = el.getAttributeNames();
      const allChildren = [clone, ...clone.querySelectorAll("*")];

      // 動態按鈕創建邏輯 - 優化：減少重複查詢
      const buttonAttributes = ["button-1", "button-2", "button-3"];
      const providedButtons = attributeNames.filter((attr) =>
        buttonAttributes.includes(attr)
      );

      // 如果用戶提供了 button-3，但模板中沒有 button-3 元素
      if (providedButtons.includes("button-3")) {
        const existingButtons = clone.querySelectorAll(
          "[button-1], [button-2], [button-3]"
        );
        if (existingButtons.length < 3) {
          // 找到按鈕容器（包含按鈕的父元素）
          const buttonContainer = existingButtons[0]?.parentElement;
          if (buttonContainer && existingButtons.length > 0) {
            // 複製最後一個按鈕作為模板
            const templateButton = existingButtons[existingButtons.length - 1];
            const newButton = templateButton.cloneNode(true);

            // 移除舊的屬性標識，添加新的
            newButton.removeAttribute("button-1");
            newButton.removeAttribute("button-2");
            newButton.setAttribute("button-3", "");

            // 添加到容器中
            buttonContainer.appendChild(newButton);
          }
        }
      }

      // 動態段落創建邏輯 - 優化：減少重複查詢
      const paragraphAttributes = ["p-1", "p-2", "p-3"];
      const providedParagraphs = attributeNames.filter((attr) =>
        paragraphAttributes.includes(attr)
      );

      // 如果用戶提供了 p-2，但模板中沒有 p-2 元素
      if (providedParagraphs.includes("p-2")) {
        const existingParagraphs = clone.querySelectorAll("[p-1], [p-2]");
        if (existingParagraphs.length < 2) {
          // 找到段落容器
          const existingP1 = clone.querySelector("[p-1]");
          if (existingP1) {
            const paragraphContainer = existingP1.parentElement;
            // 複製第一個段落作為模板
            const newParagraph = existingP1.cloneNode(true);

            // 移除舊的屬性標識，添加新的
            newParagraph.removeAttribute("p-1");
            newParagraph.setAttribute("p-2", "");

            // 添加到容器中
            paragraphContainer.appendChild(newParagraph);
          }
        }
      }

      // 如果用戶提供了 p-3，但模板中沒有 p-3 元素
      if (providedParagraphs.includes("p-3")) {
        const existingParagraphs = clone.querySelectorAll(
          "[p-1], [p-2], [p-3]"
        );
        if (existingParagraphs.length < 3) {
          // 找到最後一個段落
          const lastParagraph =
            existingParagraphs[existingParagraphs.length - 1];
          if (lastParagraph) {
            const paragraphContainer = lastParagraph.parentElement;
            // 複製最後一個段落作為模板
            const newParagraph = lastParagraph.cloneNode(true);

            // 移除舊的屬性標識，添加新的
            newParagraph.removeAttribute("p-1");
            newParagraph.removeAttribute("p-2");
            newParagraph.setAttribute("p-3", "");

            // 添加到容器中
            paragraphContainer.appendChild(newParagraph);
          }
        }
      }

      // 重新收集所有子元素，包含動態創建的按鈕
      allChildren.length = 0;
      allChildren.push(clone, ...clone.querySelectorAll("*"));

      // 優化：預先建立標籤查詢緩存
      const tagQueryCache = {};
      const tagAttributes = [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "a",
        "span",
        "div",
        "button",
        "img",
      ];

      for (const attr of attributeNames) {
        const val = el.getAttribute(attr);

        // 跳過 class 屬性，因為已經在前面處理過了
        if (attr === "class") {
          continue;
        }

        const elMatch = attr.match(/^el-(\d+)$/);
        if (elMatch) {
          const idx = parseInt(elMatch[1]);
          if (val === "*") {
            if (allChildren[idx]) allChildren[idx].remove();
          } else if (allChildren[idx]) {
            // 使用新的解析方法處理 el-N 屬性值
            const parsedValues = AtomicX.parseAttributeValue(val.trim());

            parsedValues.forEach((item) => {
              if (item.type === "text") {
                // 處理文字內容
                const target = allChildren[idx];
                if (target.tagName.toLowerCase() === "img") {
                  target.setAttribute("src", item.content);
                } else {
                  target.textContent = item.content;
                }
              } else if (item.type === "class") {
                // 處理 CSS class
                allChildren[idx].classList.add("!" + item.content);
              }
            });
          }
          continue;
        }

        // 優化：使用緩存的查詢結果
        let targets = clone.querySelectorAll(`[${attr}]`);
        if (targets.length > 0) {
          targets.forEach((target) => {
            // 解析屬性值，正確處理包含空格的 {...} 內容
            const parsedValues = AtomicX.parseAttributeValue(val.trim());

            parsedValues.forEach((item) => {
              if (item.type === "text") {
                // 處理文字內容
                if (target.tagName.toLowerCase() === "img") {
                  target.setAttribute("src", item.content);
                } else {
                  target.textContent = item.content;
                }
              } else if (item.type === "class") {
                // 處理 CSS class，加上 !important 確保優先級
                target.classList.add("!" + item.content);
              }
            });
          });
        }

        // 處理標籤名稱屬性 (h1, h2, h3, h4, h5, h6, p, a, span, div 等)
        if (tagAttributes.includes(attr)) {
          if (attr === "button") {
            // 特殊處理：button 屬性應用到所有 button-1, button-2, button-3 等
            if (!tagQueryCache.allButtons) {
              tagQueryCache.allButtons = clone.querySelectorAll(
                "[button-1], [button-2], [button-3]"
              );
            }
            tagQueryCache.allButtons.forEach((target) => {
              const parsedValues = AtomicX.parseAttributeValue(val.trim());
              parsedValues.forEach((item) => {
                if (item.type === "class") {
                  target.classList.add("!" + item.content);
                }
              });
            });
          } else {
            // 一般標籤處理 - 使用緩存
            if (!tagQueryCache[attr]) {
              tagQueryCache[attr] = clone.querySelectorAll(attr);
            }

            if (tagQueryCache[attr].length > 0) {
              const target = tagQueryCache[attr][0]; // 取第一個匹配的標籤
              const parsedValues = AtomicX.parseAttributeValue(val.trim());

              parsedValues.forEach((item) => {
                if (item.type === "text") {
                  // 處理文字內容
                  if (target.tagName.toLowerCase() === "img") {
                    target.setAttribute("src", item.content);
                  } else {
                    target.textContent = item.content;
                  }
                } else if (item.type === "class") {
                  // 處理 CSS class，加上 !important 確保優先級
                  target.classList.add("!" + item.content);
                }
              });
            }
          }
        }
      }

      el.replaceWith(clone);
    });
  });

  // 處理 export - 優化：使用之前收集的結果
  exportMap.forEach((template, tagName) => {
    const targetElements = document.querySelectorAll(tagName);
    targetElements.forEach((el) => {
      const clone = template.cloneNode(true);
      el.replaceWith(clone);
    });
  });
});

// === export 擴充功能：允許外部匯入 export ===
window.atomicX = {
  useCache: true,

  from(urls) {
    const list = Array.isArray(urls) ? urls : [urls];
    return Promise.all(
      list.map(async (url) => {
        console.log("準備 fetch:", url);
        const key = `atomicX:export:${url}`;
        let html;

        if (this.useCache && localStorage.getItem(key)) {
          html = localStorage.getItem(key);
        } else {
          const res = await fetch(url);
          html = await res.text();
          if (this.useCache) localStorage.setItem(key, html);
        }

        const temp = document.createElement("div");
        temp.innerHTML = html;

        // 處理 @export
        const exportEls = temp.querySelectorAll("[class*='@export:']");
        exportEls.forEach((el) => {
          const match = el.className.match(/@export:(\w+)/);
          if (match) {
            const name = match[1].toLowerCase();
            exportMap.set(name, el.cloneNode(true));
            rendered.set(name, el.cloneNode(true));
          }
        });

        // 順手處理 @macro（如果你之後要用）
        const macroEls = temp.querySelectorAll("[class*='@macro:']");
        macroEls.forEach((el) => {
          const match = el.className.match(/@macro:(\w+)/);
          if (match) {
            const name = match[1].toLowerCase();
            macroTemplates.set(name, el.cloneNode(true));
          }
        });
      })
    ).then(() => {
      // 套用 export 的渲染
      rendered.forEach((template, tagName) => {
        const targetElements = document.querySelectorAll(tagName);
        targetElements.forEach((el) => {
          const clone = template.cloneNode(true);
          if (el.hasAttribute("class")) {
            clone.classList.add(...el.classList); // 保留原 class
          }
          el.replaceWith(clone);
        });
      });
    });
  },
  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("atomicX:export:"))
      .forEach((k) => localStorage.removeItem(k));
  },

  auto() {
    document.querySelectorAll("script[data-export]").forEach((el) => {
      const urls = el
        .getAttribute("data-export")
        .split(",")
        .map((s) => s.trim());
      this.from(urls);
    });
  },
};
