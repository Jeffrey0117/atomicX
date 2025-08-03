const rendered = new Map();
const exportMap = new Map();
const macroTemplates = new Map();
const processedTagTypes = new Set();

const AtomicX = {
  // Parses attribute values, correctly handling content with spaces inside {...}
  parseAttributeValue(value) {
    const result = [];
    let current = "";
    let inBraces = false;
    let i = 0;

    while (i < value.length) {
      const char = value[i];

      if (char === "{" && !inBraces) {
        if (current.trim()) {
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
        result.push({ type: "text", content: current });
        current = "";
        inBraces = false;
      } else if (char === " " && !inBraces) {
        if (current.trim()) {
          result.push({ type: "class", content: current.trim() });
          current = "";
        }
      } else {
        current += char;
      }

      i++;
    }

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

  // The unified rendering function
  renderTemplate(tagName, template, forceRender = false) {
    const normalizedTagName = tagName.toLowerCase();

    // 查詢所有可能的大小寫變體
    const selectors = [
      tagName,
      tagName.toUpperCase(),
      tagName.toLowerCase(),
      tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase(),
    ];

    let allTargetElements = [];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!allTargetElements.includes(el)) {
          allTargetElements.push(el);
        }
      });
    });

    console.log(
      `Querying for tagName: ${tagName}, found: ${allTargetElements.length} elements`
    );

    // 列印找到的元素用於調試
    allTargetElements.forEach((el, i) => {
      console.log(`  Element ${i}: ${el.outerHTML}`);
    });

    const targetElements = Array.from(allTargetElements).filter((el) => {
      // 排除有 @export: 或 @macro: 的模板定義元素
      const className = el.getAttribute("class") || "";
      if (className.includes("@export:") || className.includes("@macro:")) {
        console.log(`  Skipping template definition: ${el.outerHTML}`);
        return false;
      }

      // 如果不是強制渲染，排除已經處理過的元素
      if (!forceRender && el.hasAttribute("data-atomicx-processed")) {
        console.log(`  Skipping already processed: ${el.outerHTML}`);
        return false;
      }

      // 排除嵌套的同名標籤
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        if (parent.tagName.toLowerCase() === normalizedTagName) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });

    if (targetElements.length === 0) {
      console.log(`No valid ${tagName} elements found to process.`);
      return;
    }

    console.log(
      `Processing tag ${tagName}, found ${allTargetElements.length} total elements, ${targetElements.length} valid for processing.`
    );

    const elementsToProcess = forceRender
      ? targetElements
      : targetElements.filter(
          (el) => !el.hasAttribute("data-atomicx-processed")
        );

    if (elementsToProcess.length === 0 && !forceRender) {
      console.log(
        `All top-level ${tagName} elements have already been processed.`
      );
      return;
    }

    elementsToProcess.forEach((el, index) => {
      if (forceRender) {
        el.removeAttribute("data-atomicx-processed");
      }

      if (!forceRender && el.hasAttribute("data-atomicx-processed")) {
        return;
      }

      el.setAttribute("data-atomicx-processed", "true");

      const clone = template.cloneNode(true);
      const extraClass = el.getAttribute("class") || "";

      console.log(
        `Processing element ${index + 1} of ${tagName}, class: "${extraClass}"`
      );
      console.log(`  Original element:`, el.outerHTML);
      console.log(
        `  Template clone:`,
        clone.outerHTML.substring(0, 200) + "..."
      );

      if (extraClass.trim()) {
        const classList = extraClass.trim().split(/\s+/);
        classList.forEach((cls) => {
          if (cls && !cls.startsWith("@")) {
            // 如果是背景色類，先移除所有現有的背景色類
            if (cls.startsWith("bg-")) {
              // 移除現有的背景色類
              const existingClasses = Array.from(clone.classList);
              existingClasses.forEach((existingClass) => {
                if (existingClass.startsWith("bg-")) {
                  clone.classList.remove(existingClass);
                }
              });
            }
            clone.classList.add(cls);
          }
        });
      }

      const attributeNames = el.getAttributeNames();
      let allChildren = [clone, ...clone.querySelectorAll("*")];

      const buttonAttributes = ["button-1", "button-2", "button-3"];
      const providedButtons = attributeNames.filter((attr) =>
        buttonAttributes.includes(attr)
      );

      if (providedButtons.includes("button-3")) {
        const existingButtons = clone.querySelectorAll(
          "[button-1], [button-2], [button-3]"
        );
        if (existingButtons.length < 3) {
          const buttonContainer = existingButtons[0]?.parentElement;
          if (buttonContainer && existingButtons.length > 0) {
            const templateButton = existingButtons[existingButtons.length - 1];
            const newButton = templateButton.cloneNode(true);
            newButton.removeAttribute("button-1");
            newButton.removeAttribute("button-2");
            newButton.setAttribute("button-3", "");
            buttonContainer.appendChild(newButton);
          }
        }
      }

      const paragraphAttributes = ["p-1", "p-2", "p-3"];
      const providedParagraphs = attributeNames.filter((attr) =>
        paragraphAttributes.includes(attr)
      );

      if (providedParagraphs.includes("p-2")) {
        const existingParagraphs = clone.querySelectorAll("[p-1], [p-2]");
        if (existingParagraphs.length < 2) {
          const existingP1 = clone.querySelector("[p-1]");
          if (existingP1) {
            const paragraphContainer = existingP1.parentElement;
            const newParagraph = existingP1.cloneNode(true);
            newParagraph.removeAttribute("p-1");
            newParagraph.setAttribute("p-2", "");
            paragraphContainer.appendChild(newParagraph);
          }
        }
      }

      if (providedParagraphs.includes("p-3")) {
        const existingParagraphs = clone.querySelectorAll(
          "[p-1], [p-2], [p-3]"
        );
        if (existingParagraphs.length < 3) {
          const lastParagraph =
            existingParagraphs[existingParagraphs.length - 1];
          if (lastParagraph) {
            const paragraphContainer = lastParagraph.parentElement;
            const newParagraph = lastParagraph.cloneNode(true);
            newParagraph.removeAttribute("p-1");
            newParagraph.removeAttribute("p-2");
            newParagraph.setAttribute("p-3", "");
            paragraphContainer.appendChild(newParagraph);
          }
        }
      }

      allChildren = [clone, ...clone.querySelectorAll("*")];

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

        if (attr === "class") {
          continue;
        }

        const elMatch = attr.match(/^el-(\d+)$/);
        if (elMatch) {
          const idx = parseInt(elMatch[1]);
          if (val === "*") {
            if (allChildren[idx]) allChildren[idx].remove();
          } else if (allChildren[idx]) {
            const parsedValues = AtomicX.parseAttributeValue(val.trim());
            parsedValues.forEach((item) => {
              if (item.type === "text") {
                const target = allChildren[idx];
                if (target.tagName.toLowerCase() === "img") {
                  target.setAttribute("src", item.content);
                } else {
                  target.textContent = item.content;
                }
              } else if (item.type === "class") {
                allChildren[idx].classList.add("!" + item.content);
              }
            });
          }
          continue;
        }

        let targets = clone.querySelectorAll(`[${attr}]`);
        if (targets.length > 0) {
          targets.forEach((target) => {
            const parsedValues = AtomicX.parseAttributeValue(val.trim());
            parsedValues.forEach((item) => {
              if (item.type === "text") {
                if (target.tagName.toLowerCase() === "img") {
                  target.setAttribute("src", item.content);
                } else {
                  target.textContent = item.content;
                }
              } else if (item.type === "class") {
                target.classList.add("!" + item.content);
              }
            });
          });
        }

        if (tagAttributes.includes(attr)) {
          if (attr === "button") {
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
            if (!tagQueryCache[attr]) {
              tagQueryCache[attr] = clone.querySelectorAll(attr);
            }

            if (tagQueryCache[attr].length > 0) {
              const target = tagQueryCache[attr][0];
              const parsedValues = AtomicX.parseAttributeValue(val.trim());
              parsedValues.forEach((item) => {
                if (item.type === "text") {
                  if (target.tagName.toLowerCase() === "img") {
                    target.setAttribute("src", item.content);
                  } else {
                    target.textContent = item.content;
                  }
                } else if (item.type === "class") {
                  target.classList.add("!" + item.content);
                }
              });
            }
          }
        }
      }

      console.log(
        `  About to replace element with:`,
        clone.outerHTML.substring(0, 200) + "..."
      );
      el.replaceWith(clone);
      console.log(`  Element replaced successfully`);
    });

    console.log(
      `Finished processing ${tagName}, processed ${elementsToProcess.length} elements.`
    );
  },
};

// Fixes HTML structure before DOMContentLoaded - DISABLED
function fixCustomTagsStructure() {
  // 暫時關閉這個函數，因為它會造成重複元素
  console.log("fixCustomTagsStructure is disabled");
  return;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fixCustomTagsStructure);
} else {
  fixCustomTagsStructure();
}

document.addEventListener("DOMContentLoaded", () => {
  const microMap = new Map();
  const macroTemplatesArray = [];

  const allElements = document.querySelectorAll("*");

  allElements.forEach((el) => {
    const cls = el.getAttribute("class") || "";
    const microMatch = cls.match(/@micro:(\w+)/);
    if (microMatch) {
      const name = microMatch[1].toLowerCase();
      const clonedEl = el.cloneNode(true);
      const newClass = cls.replace(`@micro:${name}`, "").trim();
      if (newClass) {
        clonedEl.setAttribute("class", newClass);
      } else {
        clonedEl.removeAttribute("class");
      }
      microMap.set(name, clonedEl);
    }

    const macroMatch = cls.match(/@macro:(\w+)/);
    if (macroMatch) {
      const name = macroMatch[1];
      macroTemplatesArray.push({ name, el });
    }

    const exportMatch = cls.match(/@export:(\w+)/);
    if (exportMatch) {
      const name = exportMatch[1];
      exportMap.set(name.toLowerCase(), el.cloneNode(true));
    }
  });

  microMap.forEach((templateEl, tagName) => {
    document.querySelectorAll(tagName).forEach((el) => {
      const clone = templateEl.cloneNode(true);
      for (const attr of el.getAttributeNames()) {
        const val = el.getAttribute(attr);
        if (attr === "class") {
          const existingClasses = clone.getAttribute("class") || "";
          const newClasses = val || "";
          const combinedClasses = [existingClasses, newClasses]
            .filter(Boolean)
            .join(" ");
          clone.setAttribute("class", combinedClasses);
        } else {
          clone.setAttribute(attr, val);
        }
      }
      el.replaceWith(clone);
    });
  });

  function expandMacro(name) {
    if (rendered.has(name)) return rendered.get(name).cloneNode(true);
    const macro = macroTemplatesArray.find((m) => m.name === name);
    if (!macro) return null;

    const original = macro.el.cloneNode(true);

    // 清理模板元素的 @macro: 類名
    const className = original.getAttribute("class") || "";
    const cleanedClassName = className.replace(/@macro:\w+/g, "").trim();
    if (cleanedClassName) {
      original.setAttribute("class", cleanedClassName);
    } else {
      original.removeAttribute("class");
    }

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

  macroTemplatesArray.forEach(({ name }) => expandMacro(name));

  console.log(
    "Starting initial render, templates in rendered:",
    Array.from(rendered.keys())
  );
  rendered.forEach((template, tagName) => {
    console.log(`Starting to render template: ${tagName}`);
    // 使用原本的 tagName，不強制轉換大小寫
    AtomicX.renderTemplate(tagName, template);
  });

  console.log(
    "Starting to process exports, templates in exportMap:",
    Array.from(exportMap.keys())
  );
  exportMap.forEach((template, tagName) => {
    console.log(`Processing export: ${tagName}`);
    AtomicX.renderTemplate(tagName, template);
  });
});

window.atomicX = {
  useCache: true,

  from(urls) {
    const list = Array.isArray(urls) ? urls : [urls];
    return Promise.all(
      list.map(async (url) => {
        console.log("Fetching:", url);
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
        const newTagNames = new Set();

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

        const macroEls = temp.querySelectorAll("[class*='@macro:']");
        macroEls.forEach((el) => {
          const match = el.className.match(/@macro:(\w+)/);
          if (match) {
            const name = match[1].toLowerCase();
            const template = el.cloneNode(true);
            macroTemplates.set(name, template);

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
      const allNewTagNames = new Set();
      results.forEach((tagNames) =>
        tagNames.forEach((name) => allNewTagNames.add(name))
      );

      allNewTagNames.forEach((tagName) => {
        if (rendered.has(tagName)) {
          console.log(`Rendering new tag from from(): ${tagName}`);
          AtomicX.renderTemplate(tagName, rendered.get(tagName), false);
        }
      });

      // 自動清理多餘的元素
      this.autoCleanup();
    });
  },

  // 自動清理邏輯
  autoCleanup() {
    // 只移除未處理的自定義標籤（小寫的原始標籤）
    const customTags = ["acard"]; // 只清理 acard，不要清理 header 和 footer
    customTags.forEach((tagName) => {
      const elements = document.querySelectorAll(tagName);
      if (elements.length > 0) {
        console.log(
          `Removing ${elements.length} remaining ${tagName} elements`
        );
        elements.forEach((el) => el.remove());
      }
    });

    // 對於 footer，確保只有一個（但不要移除已渲染的）
    const footers = document.querySelectorAll("footer");
    if (footers.length > 1) {
      console.log(`Found ${footers.length} footers, keeping only the last one`);
      for (let i = 0; i < footers.length - 1; i++) {
        footers[i].remove();
      }
    }
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

  rerender(tagName = null) {
    if (tagName) {
      const template =
        rendered.get(tagName.toLowerCase()) ||
        exportMap.get(tagName.toLowerCase());
      if (template) {
        console.log(`Manually re-rendering: ${tagName}`);
        AtomicX.renderTemplate(tagName, template, true);
      }
    } else {
      console.log("Manually re-rendering all templates.");
      document.querySelectorAll("[data-atomicx-processed]").forEach((el) => {
        el.removeAttribute("data-atomicx-processed");
      });

      rendered.forEach((template, tagName) => {
        AtomicX.renderTemplate(tagName, template, true);
      });

      exportMap.forEach((template, tagName) => {
        AtomicX.renderTemplate(tagName, template, true);
      });
    }
  },

  debug: {
    showProcessedElements() {
      const processed = document.querySelectorAll("[data-atomicx-processed]");
      console.log(`Processed elements: ${processed.length} found.`);
      processed.forEach((el, i) => {
        console.log(`${i + 1}. ${el.tagName}`, el.className);
      });
    },
    showRenderedTags() {
      console.log("Tags in 'rendered':", Array.from(rendered.keys()));
    },
    showExportTags() {
      console.log("Tags in 'exportMap':", Array.from(exportMap.keys()));
    },
    resetProcessed() {
      document.querySelectorAll("[data-atomicx-processed]").forEach((el) => {
        el.removeAttribute("data-atomicx-processed");
      });
      console.log("All processed states have been reset.");
    },
    checkElements(tagName) {
      // 支援大小寫混合的標籤查詢
      const selectors = [
        tagName,
        tagName.toUpperCase(),
        tagName.toLowerCase(),
        tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase(),
      ];

      const allElements = document.querySelectorAll(selectors.join(", "));
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

      console.log(`=== ${tagName.toUpperCase()} Element Check ===`);
      console.log(
        `Found ${allElements.length} elements (${topLevelElements.length} top-level, ${nestedElements.length} nested)`
      );

      console.log("Top-level elements:");
      topLevelElements.forEach((el, index) => {
        const processed = el.hasAttribute("data-atomicx-processed");
        const parent = el.parentElement;
        console.log(
          `  ${index + 1}. Processed: ${processed}, Parent: ${
            parent ? parent.tagName : "null"
          }, class: "${el.className}"`
        );
      });

      if (nestedElements.length > 0) {
        console.log("Nested elements (will be skipped):");
        nestedElements.forEach((el, index) => {
          const processed = el.hasAttribute("data-atomicx-processed");
          const parent = el.parentElement;
          console.log(
            `  ${index + 1}. Processed: ${processed}, Parent: ${
              parent ? parent.tagName : "null"
            }, class: "${el.className}"`
          );
        });
      }
    },
    checkStructure() {
      console.log("=== DOM Structure Check ===");
      const customTags = [
        "header",
        "footer",
        "acard",
        "card",
        "Acard",
        "Header",
        "Footer",
        "Card",
      ];
      customTags.forEach((tagName) => {
        this.checkElements(tagName);
      });
    },
  },
};
