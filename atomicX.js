// --- Pre-bootstrap stub so user can call atomicX.from()/clear() before DOMContentLoaded ---
(function (g) {
  if (!g.atomicX) {
      const q = [];
      g.atomicX = {
          _q: q,
          from() { q.push(['from', Array.from(arguments)]); return Promise.resolve(); },
          clear() { q.push(['clear', []]); },
          use(urls, opts = {}) { if (opts.clear) q.push(['clear', []]); q.push(['from', [urls]]); },
          ready(cb) { q.push(['__ready', [cb]]); }
      };
  }
})(window);

// === AtomicX v1.1 (Step1 refactor: logging + cache version + attr index) ===
const rendered = new Map();          // tagName -> expanded template Element
const exportMap = new Map();          // tagName -> raw export template Element (backward compat)
const macroTemplates = new Map();     // tagName -> raw macro template Element

// 新增：統一 registry（目前僅標记類型，後續 Step2 可完全取代上面三個 Map）
const registry = new Map(); // tagName -> { type: 'export'|'macro'|'micro', raw:Element, expanded?:Element }

// 版本化快取控制
const ATOMICX_VERSION = '1';

// 模板屬性索引快取 (WeakMap: templateElement -> { attrTargets: Map<attr,[nodes]>, tagCache: Map<tag,[nodes]> })
const templateIndexCache = new WeakMap();

// 輔助：建立 attr / tag 索引（一次 DFS）
function buildTemplateIndex(template) {
  if (templateIndexCache.has(template)) return templateIndexCache.get(template);
  const attrTargets = new Map();
  const tagCache = new Map();
  const all = [template, ...template.querySelectorAll('*')];
  all.forEach(node => {
      // tag 索引（只存第一個即可符合原行為）
      const tag = node.tagName.toLowerCase();
      if (!tagCache.has(tag)) tagCache.set(tag, []);
      tagCache.get(tag).push(node);
      // attribute 索引
      for (const attr of node.getAttributeNames()) {
          if (!attrTargets.has(attr)) attrTargets.set(attr, []);
          attrTargets.get(attr).push(node);
      }
  });
  const index = { attrTargets, tagCache };
  templateIndexCache.set(template, index);
  return index;
}

// 輔助：日誌包裝
function dbg(enabled, ...args) { if (enabled) console.log('[AtomicX]', ...args); }

// --- Main AtomicX Object Definition ---
const AtomicX = {
  config: {
      debug: true,
      cacheVersion: ATOMICX_VERSION,
      logRender: true,
  },

  /**
   * Parses an attribute value, handling spaces and {...} syntax.
   */
  parseAttributeValue(value) {
      const result = [];
      let current = '', inBraces = false, i = 0;
      while (i < value.length) {
          const char = value[i];
          if (char === '{' && !inBraces) {
              if (current.trim()) current.trim().split(/\s+/).forEach(cls => cls && result.push({ type: 'class', content: cls }));
              current = ''; inBraces = true;
          } else if (char === '}' && inBraces) {
              result.push({ type: 'text', content: current });
              current = ''; inBraces = false;
          } else if (char === ' ' && !inBraces) {
              if (current.trim()) { result.push({ type: 'class', content: current.trim() }); current=''; }
          } else {
              current += char;
          }
          i++;
      }
      if (current.trim()) {
          if (inBraces) result.push({ type: 'text', content: current });
          else current.trim().split(/\s+/).forEach(cls => cls && result.push({ type: 'class', content: cls }));
      }
      return result;
  },

  /**
   * 精簡後：直接用 getElementsByTagName (自訂標籤大小寫一律 lower) + 額外嘗試原大小寫一次
   */
  findElements(tagName) {
      const lower = tagName.toLowerCase();
      const set = new Set();
      const list = document.getElementsByTagName(lower);
      Array.from(list).forEach(el => set.add(el));
      if (tagName !== lower) {
          document.querySelectorAll(tagName).forEach(el => set.add(el));
      }
      return Array.from(set);
  },

  filterValidElements(elements, normalizedTagName, forceRender) {
      return elements.filter(el => {
          const className = el.getAttribute('class') || '';
          if (className.includes('@export:') || className.includes('@macro:')) return false;
          if (!forceRender && el.hasAttribute('data-atomicx-processed')) return false;
          let parent = el.parentElement;
          while (parent && parent !== document.body) {
              if (parent.tagName.toLowerCase() === normalizedTagName) return false;
              if (parent.hasAttribute('data-atomicx-processed')) {
                  const tag = (parent.getAttribute('data-atomicx-tag') || '').toLowerCase();
                  if (tag && tag !== normalizedTagName) return false;
              }
              parent = parent.parentElement;
          }
          return true;
      });
  },

  applyExtraClasses(clone, extraClass) {
      if (!extraClass || !extraClass.trim()) return;
      extraClass.trim().split(/\s+/).forEach(cls => {
          if (!cls || cls.startsWith('@')) return;
          if (cls.startsWith('bg-')) {
              Array.from(clone.classList).forEach(ec => ec.startsWith('bg-') && clone.classList.remove(ec));
          }
          clone.classList.add(cls);
      });
  },

  handleDynamicButtons(clone, attributeNames) {
      const attrs = attributeNames.filter(a => /^button-[123]$/.test(a));
      if (attrs.includes('button-3')) {
          const existing = clone.querySelectorAll('[button-1],[button-2],[button-3]');
          if (existing.length < 3 && existing.length) {
              const tpl = existing[existing.length - 1];
              const newBtn = tpl.cloneNode(true);
              newBtn.removeAttribute('button-1');
              newBtn.removeAttribute('button-2');
              newBtn.setAttribute('button-3','');
              tpl.parentElement.appendChild(newBtn);
          }
      }
  },

  handleDynamicParagraphs(clone, attributeNames) {
      const attrs = attributeNames.filter(a => /^p-[123]$/.test(a));
      const ensure = (want) => {
          let list = clone.querySelectorAll('[p-1],[p-2],[p-3]');
          while (list.length < want) {
              const last = list[list.length - 1];
              if (!last) break;
              const np = last.cloneNode(true);
              np.removeAttribute('p-1');
              if (want === 2) { np.setAttribute('p-2',''); }
              else if (want === 3) { np.removeAttribute('p-2'); np.setAttribute('p-3',''); }
              last.parentElement.appendChild(np);
              list = clone.querySelectorAll('[p-1],[p-2],[p-3]');
          }
      };
      if (attrs.includes('p-2')) ensure(2);
      if (attrs.includes('p-3')) ensure(3);
  },

  /**
   * 套屬性：使用預建索引 attrTargets / tagCache 減少 querySelectorAll
   */
  applyAttributes(clone, el) {
      const { attrTargets, tagCache } = buildTemplateIndex(clone);
      const attributeNames = el.getAttributeNames();
      const allChildren = [clone, ...clone.querySelectorAll('*')];
      const tagAttributes = ['h1','h2','h3','h4','h5','h6','p','a','span','div','button','img'];

      for (const attr of attributeNames) {
          if (attr === 'class') continue;
          const val = el.getAttribute(attr);
          const parsed = this.parseAttributeValue((val||'').trim());

          // el-index 語法
          const elMatch = attr.match(/^el-(\d+)$/);
          if (elMatch) {
              const idx = parseInt(elMatch[1]);
              const target = allChildren[idx];
              if (!target) continue;
              if (val === '*') { target.remove(); continue; }
              parsed.forEach(item => {
                  if (item.type === 'text') {
                      (target.tagName.toLowerCase() === 'img') ? target.setAttribute('src', item.content) : target.textContent = item.content;
                  } else if (item.type === 'class') target.classList.add('!' + item.content);
              });
              continue;
          }

          // 先找具有同名屬性的節點
          const targets = attrTargets.get(attr) || [];
          if (targets.length) {
              targets.forEach(target => {
                  parsed.forEach(item => {
                      if (item.type === 'text') {
                          (target.tagName.toLowerCase() === 'img') ? target.setAttribute('src', item.content) : target.textContent = item.content;
                      } else if (item.type === 'class') target.classList.add('!' + item.content);
                  });
              });
          }

          // tag shortcut
          if (tagAttributes.includes(attr) && attr !== 'button') {
              const tagNodes = tagCache.get(attr) || [];
              const target = tagNodes[0];
              if (target) {
                  parsed.forEach(item => {
                      if (item.type === 'text') {
                        (target.tagName.toLowerCase() === 'img') ? target.setAttribute('src', item.content) : target.textContent = item.content;
                      } else if (item.type === 'class') target.classList.add('!' + item.content);
                  });
              }
          } else if (attr === 'button') {
              // 所有 button-x
              const btns = clone.querySelectorAll('[button-1],[button-2],[button-3]');
              btns.forEach(b => parsed.forEach(item => item.type === 'class' && b.classList.add('!' + item.content)));
          }
      }
  },

  renderTemplate(tagName, template, forceRender = false) {
      const normalizedTagName = tagName.toLowerCase();
      dbg(this.config.logRender, `Render <${normalizedTagName}> start`);
      if (!template) { dbg(this.config.debug, 'No template for', tagName); return; }

      const allTargetElements = this.findElements(normalizedTagName);
      const targetElements = this.filterValidElements(allTargetElements, normalizedTagName, forceRender);
      if (!targetElements.length) { dbg(this.config.logRender, `No targets for <${normalizedTagName}>`); return; }

      const elementsToProcess = forceRender ? targetElements : targetElements.filter(el => !el.hasAttribute('data-atomicx-processed'));
      if (!elementsToProcess.length && !forceRender) return;

      // 預建索引以供下方 clone 使用（複製時 index 會失效，因此在每個 clone 上 rebuild；若模板很大可延遲）
      elementsToProcess.forEach((el, i) => {
          if (forceRender) el.removeAttribute('data-atomicx-processed');
          el.setAttribute('data-atomicx-processed','true');
          el.setAttribute('data-atomicx-tag', normalizedTagName);
          const clone = template.cloneNode(true);
          this.applyExtraClasses(clone, el.getAttribute('class') || '');
          this.handleDynamicButtons(clone, el.getAttributeNames());
          this.handleDynamicParagraphs(clone, el.getAttributeNames());
          this.applyAttributes(clone, el);
          el.replaceWith(clone);
          dbg(this.config.logRender, `<${normalizedTagName}> item ${i+1} replaced`);
      });
      dbg(this.config.logRender, `Render <${normalizedTagName}> done (${elementsToProcess.length})`);
  },
};

// --- Standalone Functions (部分加速 + 保留外部 API) ---
function injectTailwind() {
  if (document.getElementById('atomicx-tailwind-cdn')) return;
  const existing = document.querySelector('script[src*="tailwindcss"],link[href*="tailwindcss"]');
  if (existing) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.tailwindcss.com';
  s.id = 'atomicx-tailwind-cdn';
  document.head.appendChild(s);
}

function discoverComponents() {
  const microMap = new Map();
  const macroTemplatesArray = [];
  document.querySelectorAll('[class*="@micro:"],[class*="@macro:"],[class*="@export:"]').forEach(el => {
      const cls = el.getAttribute('class') || '';
      const microMatch = cls.match(/@micro:(\w+)/);
      if (microMatch) {
          const name = microMatch[1].toLowerCase();
          const clonedEl = el.cloneNode(true);
          const newClass = cls.replace(`@micro:${microMatch[1]}`, '').trim();
          newClass ? clonedEl.setAttribute('class', newClass) : clonedEl.removeAttribute('class');
          microMap.set(name, clonedEl);
          registry.set(name, { type: 'micro', raw: clonedEl });
      }
      const macroMatch = cls.match(/@macro:(\w+)/);
      if (macroMatch) {
          const name = macroMatch[1].toLowerCase();
          macroTemplatesArray.push({ name, el });
          registry.set(name, { type: 'macro', raw: el });
      }
      const exportMatch = cls.match(/@export:(\w+)/);
      if (exportMatch) {
          const name = exportMatch[1].toLowerCase();
          exportMap.set(name, el.cloneNode(true));
          rendered.set(name, el.cloneNode(true));
          registry.set(name, { type: 'export', raw: el.cloneNode(true), expanded: el.cloneNode(true) });
      }
  });
  return { microMap, macroTemplatesArray };
}

function processMicroComponents(microMap) {
  microMap.forEach((templateEl, tagName) => {
      document.querySelectorAll(tagName).forEach(el => {
          const clone = templateEl.cloneNode(true);
          for (const attr of el.getAttributeNames()) {
              if (attr === 'class') {
                  const combined = [clone.getAttribute('class')||'', el.getAttribute('class')||''].filter(Boolean).join(' ');
                  combined ? clone.setAttribute('class', combined) : clone.removeAttribute('class');
              } else clone.setAttribute(attr, el.getAttribute(attr));
          }
          el.replaceWith(clone);
      });
  });
}

function expandMacros(macroTemplatesArray) {
  function expandMacro(name) {
      if (rendered.has(name)) return rendered.get(name).cloneNode(true);
      const macro = macroTemplatesArray.find(m => m.name === name);
      if (!macro) return null;
      const original = macro.el.cloneNode(true);
      const cls = original.getAttribute('class') || '';
      const cleaned = cls.replace(/@macro:\w+/g,'').trim();
      cleaned ? original.setAttribute('class', cleaned) : original.removeAttribute('class');
      original.querySelectorAll('*').forEach(el => {
          const tag = el.tagName.toLowerCase();
          if (rendered.has(tag)) el.replaceWith(rendered.get(tag).cloneNode(true));
      });
      rendered.set(name, original.cloneNode(true));
      const reg = registry.get(name); if (reg) reg.expanded = original.cloneNode(true);
      return original.cloneNode(true);
  }
  macroTemplatesArray.forEach(({ name }) => expandMacro(name));
}

function initialRender() {
  rendered.forEach((template, tagName) => AtomicX.renderTemplate(tagName, template));
  exportMap.forEach((template, tagName) => AtomicX.renderTemplate(tagName, template));
}

function extendAtomicX() {
  const pending = (window.atomicX && window.atomicX._q) ? window.atomicX._q.slice() : [];
  window.atomicX = {
      ...AtomicX,
      useCache: true,

      cacheKey(url) { return `atomicX:v${this.config.cacheVersion}:export:${url}`; },

      clearLegacyCache() {
          Object.keys(localStorage).forEach(k => {
              if (k.startsWith('atomicX:export:')) localStorage.removeItem(k);
          });
      },

      async from(urls) {
          const list = Array.isArray(urls) ? urls : [urls];
          const newTagNamesAll = new Set();
          for (const url of list) {
              let html; const key = this.cacheKey(url);
              try {
                  if (this.useCache && localStorage.getItem(key)) html = localStorage.getItem(key);
                  else {
                      const res = await fetch(url);
                      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
                      html = await res.text();
                      if (this.useCache) localStorage.setItem(key, html);
                  }
              } catch (e) {
                  console.error('[AtomicX] fetch fail', url, e); continue;
              }
              const temp = document.createElement('div');
              temp.innerHTML = html;
              temp.querySelectorAll('[class*="@export:"],[class*="@macro:"]').forEach(el => {
                  const cls = el.className || '';
                  const exp = cls.match(/@export:(\w+)/);
                  const mac = cls.match(/@macro:(\w+)/);
                  if (exp) {
                      const name = exp[1].toLowerCase();
                      const template = el.cloneNode(true);
                      exportMap.set(name, template);
                      rendered.set(name, template);
                      registry.set(name, { type: 'export', raw: template, expanded: template });
                      newTagNamesAll.add(name);
                  } else if (mac) {
                      const name = mac[1].toLowerCase();
                      const template = el.cloneNode(true);
                      macroTemplates.set(name, template);
                      // 展開嵌套
                      const expanded = template.cloneNode(true);
                      expanded.querySelectorAll('*').forEach(child => {
                          const tag = child.tagName.toLowerCase();
                          if (rendered.has(tag)) child.replaceWith(rendered.get(tag).cloneNode(true));
                      });
                      rendered.set(name, expanded);
                      registry.set(name, { type: 'macro', raw: template, expanded });
                      newTagNamesAll.add(name);
                  }
              });
          }
          const renderedOnce = new Set();
          newTagNamesAll.forEach(tagName => {
              if (rendered.has(tagName) && !renderedOnce.has(tagName)) {
                  renderedOnce.add(tagName);
                  AtomicX.renderTemplate(tagName, rendered.get(tagName), false);
              }
          });
          // 新增：遠端載入後重新套用 alias（來源可能剛被引入）
          if (typeof simpleUseAliases === 'function') {
              simpleUseAliases();
          }
      },

      use(urls, opts = {}) { if (opts.clear) this.clear(); return this.from(urls); },

      auto() {
          document.querySelectorAll('script[data-export]').forEach(el => {
              const urls = el.getAttribute('data-export').split(',').map(s => s.trim()).filter(Boolean);
              this.from(urls);
          });
      },

      clear() {
          Object.keys(localStorage).forEach(k => k.startsWith('atomicX:v') && localStorage.removeItem(k));
      },

      rerender(tagName = null) {
          if (tagName) {
              const tpl = rendered.get(tagName.toLowerCase()) || exportMap.get(tagName.toLowerCase());
              if (tpl) AtomicX.renderTemplate(tagName, tpl, true);
          } else {
              document.querySelectorAll('[data-atomicx-processed]').forEach(el => el.removeAttribute('data-atomicx-processed'));
              rendered.forEach((tpl, name) => AtomicX.renderTemplate(name, tpl, true));
          }
      },

      debug: {
          showProcessed() { const list = document.querySelectorAll('[data-atomicx-processed]'); console.log('Processed:', list.length, list); },
          showTemplates() { console.log('Templates(rendered):', Array.from(rendered.keys())); },
          showRegistry() { console.log('Registry:', Array.from(registry.entries())); },
          resetProcessed() { document.querySelectorAll('[data-atomicx-processed]').forEach(el => el.removeAttribute('data-atomicx-processed')); },
      },
      // 新增 API: 手動刷新 alias
      refreshAliases() { if (typeof simpleUseAliases === 'function') simpleUseAliases(); }
  };

  // Flush queued calls
  pending.forEach(([name, args]) => {
      if (name === 'from') window.atomicX.from.apply(window.atomicX, args);
      else if (name === 'clear') window.atomicX.clear();
      else if (name === 'use') window.atomicX.use.apply(window.atomicX, args);
      else if (name === '__ready' && typeof args[0] === 'function') args[0](window.atomicX);
  });
}

// Initialization
function initialize() {
  injectTailwind();
  const { microMap, macroTemplatesArray } = discoverComponents();
  processMicroComponents(microMap);
  expandMacros(macroTemplatesArray);
  initialRender();
  // 新增: 初始化時先處理一次 @use: 別名
  if (typeof simpleUseAliases === 'function') simpleUseAliases();
}

document.addEventListener('DOMContentLoaded', () => {
  initialize();
  extendAtomicX();
  setupMutationObserver();
});

// --- 簡化版 @use: 別名展開 ---

function simpleUseAliases() {
  // 找所有含 @use:xxx 且有額外樣式的元素，當作樣式提供者
  const providers = new Map(); // aliasName -> classes[]
  
  document.querySelectorAll('[class*="@use:"]').forEach(el => {
      const classList = (el.className || '').split(/\s+/).filter(Boolean);
      const useTokens = classList.filter(c => c.startsWith('@use:')).map(c => c.slice(5));
      const otherClasses = classList.filter(c => !c.startsWith('@use:'));
      
      // 如果有 @use:xxx 且有其他樣式，視為該 alias 的提供者
      if (useTokens.length > 0 && otherClasses.length > 0) {
          useTokens.forEach(alias => {
              if (!providers.has(alias)) {
                  providers.set(alias, otherClasses);
              }
          });
      }
  });
  
  // 套用：找所有只有 alias class 的元素，給它們套上對應樣式
  providers.forEach((classes, alias) => {
      document.querySelectorAll('.' + alias).forEach(target => {
          const targetClasses = (target.className || '').split(/\s+/).filter(Boolean);
          // 如果只有這個 alias class（或很少其他 class），就套用樣式
          if (targetClasses.length <= 2) { // 允許有一些基本 class
              const newClasses = [...new Set([...targetClasses, ...classes])].join(' ');
              target.className = newClasses;
          }
      });
  });
}

function setupMutationObserver() {
  if (__atomicxAliasObserverInited) return;
  __atomicxAliasObserverInited = true;
  simpleUseAliases();
  
  const obs = new MutationObserver(() => {
      // DOM 變動時重新套用
      simpleUseAliases();
  });
  obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
  });
}
let __atomicxAliasObserverInited = false;
