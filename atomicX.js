const rendered = new Map(); // 儲存 @export 渲染用的 <Card>、<Header>...
const exportMap = new Map(); // 備用用來追蹤 export 定義
const macroTemplates = new Map(); // 儲存 @macro 定義的區塊
const processedTagTypes = new Set(); // 只追蹤標籤類型的定義是否已加載，不阻止實例渲染

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

  // 統一的渲染函數 - 修复版本
  renderTemplate(tagName, template, forceRender = false) {
    const normalizedTagName = tagName.toLowerCase();

    // 使用大小寫不敏感的選擇器，但排除嵌套元素
    const allTargetElements = document.querySelectorAll(
      tagName + ", " + tagName.toUpperCase() + ", " + tagName.toLowerCase()
    );

    // 过滤掉嵌套在同类型元素内的元素（只处理顶层元素）
    const targetElements = Array.from(allTargetElements).filter((el) => {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName.toLowerCase() === normalizedTagName) {
          return false; // 这是一个嵌套元素，跳过
        }
        parent = parent.parentElement;
      }
      return true; // 这是一个顶层元素
    });

    if (targetElements.length === 0) {
      console.log(`没有找到顶层的 ${tagName} 元素`);
      return;
    }

    console.log(
      `處理標籤 ${tagName}，找到 ${allTargetElements.length} 個元素，其中 ${targetElements.length} 個是顶层元素`
    );

    // 修复：不再使用全局的 processedTags 来阻止同类型元素的重复渲染
    // 只过滤掉已经被处理过的具体元素实例
    const unprocessedElements = targetElements.filter(
      (el) => !el.hasAttribute("data-atomicx-processed")
    );

    if (unprocessedElements.length === 0 && !forceRender) {
      console.log(`所有顶层 ${tagName} 元素都已處理過`);
      return;
    }

    const elementsToProcess = forceRender
      ? targetElements
      : unprocessedElements;

    elementsToProcess.forEach((el, index) => {
      // 如果是强制渲染，先移除已处理标记
      if (forceRender) {
        el.removeAttribute("data-atomicx-processed");
      }

      // 跳过已经处理过的元素（除非强制渲染）
      if (!forceRender && el.hasAttribute("data-atomicx-processed")) {
        return;
      }

      // 立即標記元素為已處理
      el.setAttribute("data-atomicx-processed", "true");

      const clone = template.cloneNode(true);
      const extraClass = el.getAttribute("class") || "";

      console.log(
        `處理第 ${index + 1} 個 ${tagName} 元素，class: "${extraClass}"`
      );

      // 提前處理 class 屬性 - 只應用到最外層容器
      if (extraClass.trim()) {
        const classList = extraClass.trim().split(/\s+/);
        classList.forEach((cls) => {
          // 排除 @macro: 和 @export: 標記，其他 class 直接添加到最外層 clone
          if (cls && !cls.startsWith("@")) {
            clone.classList.add(cls);
          }
        });
      }

      // 優化：緩存屬性名稱列表
      const attributeNames = el.getAttributeNames();
      const allChildren = [clone, ...clone.querySelectorAll("*")];

      // 動態按鈕創建邏輯
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

      // 動態段落創建邏輯
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

    console.log(
      `完成處理 ${tagName}，處理了 ${elementsToProcess.length} 個元素`
    );
  },
};

// 在 DOMContentLoaded 之前先修正 HTML 結構
function fixCustomTagsStructure() {
  // 定義所有需要處理的自定義標籤
  const customTags = ["header", "footer", "acard", "card", "nav", "sidebar"];

  // 修正嵌套问题：移除同类型标签的嵌套
  customTags.forEach((tagName) => {
    const selector = [tagName, tagName.toUpperCase(), tagName.toLowerCase()]
      .map((t) => t)
      .join(", ");

    const tags = document.querySelectorAll(selector);
    tags.forEach((tag) => {
      // 检查是否被嵌套在同类型元素中
      let parent = tag.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName.toLowerCase() === tagName.toLowerCase()) {
          console.log(
            `修正嵌套: 將 ${tag.tagName} 從 ${parent.tagName} 中移出`
          );
          // 将嵌套的标签移到与父标签同级
          parent.parentElement.insertBefore(tag, parent.nextSibling);
          break;
        }
        parent = parent.parentElement;
      }

      // 特別處理 Footer 和其他應該是兄弟元素的標籤
      if (
        tag.tagName.toLowerCase() === "footer" ||
        tag.tagName.toLowerCase() === "header"
      ) {
        let current = tag;

        // 向上查找，如果發現被包在其他自定義標籤中
        while (
          current.parentElement &&
          current.parentElement.tagName !== "BODY"
        ) {
          const parentEl = current.parentElement;
          const parentTagName = parentEl.tagName.toLowerCase();

          // 如果父元素是自定義標籤（除了合理的容器）
          if (
            customTags.includes(parentTagName) &&
            parentTagName !== "body" &&
            parentTagName !== "html" &&
            parentTagName !== "main"
          ) {
            console.log(
              `修正結構: 將 ${tag.tagName} 從 ${parentEl.tagName} 中移出`
            );

            // 將標籤移到最外層容器後面
            const bodyOrContainer = document.body || document.documentElement;
            bodyOrContainer.appendChild(tag);
            break;
          }
          current = parentEl;
        }
      }
    });
  });

  // 額外檢查：確保 Footer 是最後一個元素
  const footers = document.querySelectorAll("footer, Footer, FOOTER");
  footers.forEach((footer) => {
    if (footer.parentElement && footer.parentElement.tagName === "BODY") {
      // 確保 footer 是 body 的最後一個子元素
      document.body.appendChild(footer);
    }
  });
}

// 如果 DOM 已經載入，立即執行
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fixCustomTagsStructure);
} else {
  fixCustomTagsStructure();
}

document.addEventListener("DOMContentLoaded", () => {
  const macros = new Map();
  const macroTemplates = [];
  const microMap = new Map();

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

  // 處理 micro
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

  // 初始渲染所有模板
  console.log("開始初始渲染，rendered 中的模板:", Array.from(rendered.keys()));
  rendered.forEach((template, tagName) => {
    console.log(`開始渲染模板: ${tagName}`);
    AtomicX.renderTemplate(tagName, template);
  });

  // 處理 export - 渲染所有export定义的模板
  console.log(
    "開始處理 export，exportMap 中的模板:",
    Array.from(exportMap.keys())
  );
  exportMap.forEach((template, tagName) => {
    console.log(`處理 export: ${tagName}`);
    AtomicX.renderTemplate(tagName, template);
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

        // 收集新的 export 和 macro 標籤名稱
        const newTagNames = new Set();

        // 處理 @export
        const exportEls = temp.querySelectorAll("[class*='@export:']");
        exportEls.forEach((el) => {
          const match = el.className.match(/@export:(\w+)/);
          if (match) {
            const name = match[1].toLowerCase();
            const template = el.cloneNode(true);
            exportMap.set(name, template);
            rendered.set(name, template);
            newTagNames.add(name);
          }
        });

        // 處理 @macro
        const macroEls = temp.querySelectorAll("[class*='@macro:']");
        macroEls.forEach((el) => {
          const match = el.className.match(/@macro:(\w+)/);
          if (match) {
            const name = match[1].toLowerCase();
            const template = el.cloneNode(true);
            macroTemplates.set(name, template);

            // 展開 macro
            const expanded = template.cloneNode(true);
            expanded.querySelectorAll("*").forEach((childEl) => {
              const tag = childEl.tagName.toLowerCase();
              if (rendered.has(tag)) {
                const expandedEl = rendered.get(tag).cloneNode(true);
                childEl.replaceWith(expandedEl);
              }
            });

            rendered.set(name, expanded);
            newTagNames.add(name);
          }
        });

        return newTagNames;
      })
    ).then((results) => {
      // 收集所有新的標籤名稱
      const allNewTagNames = new Set();
      results.forEach((tagNames) => {
        tagNames.forEach((name) => allNewTagNames.add(name));
      });

      // 渲染新導入的標籤
      allNewTagNames.forEach((tagName) => {
        if (rendered.has(tagName)) {
          console.log(`from() 方法渲染新標籤: ${tagName}`);
          AtomicX.renderTemplate(tagName, rendered.get(tagName), true);
        }
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

  // 手动重新渲染所有元素（用于调试）
  rerender(tagName = null) {
    if (tagName) {
      // 重新渲染特定标签
      if (
        rendered.has(tagName.toLowerCase()) ||
        exportMap.has(tagName.toLowerCase())
      ) {
        const template =
          rendered.get(tagName.toLowerCase()) ||
          exportMap.get(tagName.toLowerCase());
        console.log(`手动重新渲染: ${tagName}`);
        AtomicX.renderTemplate(tagName, template, true);
      }
    } else {
      // 重新渲染所有
      console.log("手动重新渲染所有模板");
      // 先清除所有处理标记
      document.querySelectorAll("[data-atomicx-processed]").forEach((el) => {
        el.removeAttribute("data-atomicx-processed");
      });

      // 重新渲染 rendered 中的模板
      rendered.forEach((template, tagName) => {
        AtomicX.renderTemplate(tagName, template, true);
      });

      // 重新渲染 exportMap 中的模板
      exportMap.forEach((template, tagName) => {
        AtomicX.renderTemplate(tagName, template, true);
      });
    }
  },

  // Debug 工具函數
  debug: {
    showProcessedElements() {
      const processed = document.querySelectorAll("[data-atomicx-processed]");
      console.log("已處理的元素:", processed.length, "個");
      processed.forEach((el, i) => {
        console.log(`${i + 1}. ${el.tagName}`, el.className);
      });
    },
    showRenderedTags() {
      console.log("rendered 中的標籤:", Array.from(rendered.keys()));
    },
    showExportTags() {
      console.log("exportMap 中的標籤:", Array.from(exportMap.keys()));
    },
    resetProcessed() {
      // 移除所有處理標記
      document.querySelectorAll("[data-atomicx-processed]").forEach((el) => {
        el.removeAttribute("data-atomicx-processed");
      });
      console.log("已重置所有處理狀態");
    },
    checkElements(tagName) {
      const allElements = document.querySelectorAll(
        tagName + ", " + tagName.toUpperCase() + ", " + tagName.toLowerCase()
      );

      // 分离顶层元素和嵌套元素
      const topLevelElements = [];
      const nestedElements = [];

      Array.from(allElements).forEach((el) => {
        let parent = el.parentElement;
        let isNested = false;
        while (parent && parent !== document.body) {
          if (parent.tagName.toLowerCase() === tagName.toLowerCase()) {
            isNested = true;
            break;
          }
          parent = parent.parentElement;
        }

        if (isNested) {
          nestedElements.push(el);
        } else {
          topLevelElements.push(el);
        }
      });

      console.log(`=== ${tagName.toUpperCase()} 元素檢查 ===`);
      console.log(
        `找到 ${allElements.length} 個元素 (${topLevelElements.length} 個顶层, ${nestedElements.length} 個嵌套)`
      );

      console.log("顶层元素:");
      topLevelElements.forEach((el, index) => {
        const processed = el.hasAttribute("data-atomicx-processed");
        const parent = el.parentElement;
        console.log(
          `  ${index + 1}. 已處理: ${processed}, 父元素: ${
            parent ? parent.tagName : "null"
          }, class: "${el.className}"`
        );
      });

      if (nestedElements.length > 0) {
        console.log("嵌套元素 (会被跳过):");
        nestedElements.forEach((el, index) => {
          const processed = el.hasAttribute("data-atomicx-processed");
          const parent = el.parentElement;
          console.log(
            `  ${index + 1}. 已處理: ${processed}, 父元素: ${
              parent ? parent.tagName : "null"
            }, class: "${el.className}"`
          );
        });
      }
    },
    checkStructure() {
      console.log("=== DOM 結構檢查 ===");
      const customTags = ["header", "footer", "acard", "card"];
      customTags.forEach((tagName) => {
        this.checkElements(tagName);
      });
    },
  },
};
