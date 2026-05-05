/* Block People & Keywords content script: local, batched, reversible filtering. */
(function initContentScript() {
  "use strict";

  if (globalThis.__BPK_CONTENT_ACTIVE__) return;
  globalThis.__BPK_CONTENT_ACTIVE__ = true;

  if (!globalThis.BPK) return;

  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;
  const DOCUMENT_NODE = 9;
  const DOCUMENT_FRAGMENT_NODE = 11;
  const SHOW_TEXT = 4;
  const SHOW_ELEMENT = 1;

  const WORD_CHAR_RE = /[\p{L}\p{N}_]/u;
  const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

  const BASE_CONTAINER_SELECTORS = [
    "article",
    "[role='article']",
    "[role='listitem']",
    "li",
    "tr",
    "section",
    "figure",
    ".post",
    ".comment",
    ".card",
    ".entry",
    ".feed-item",
    ".result",
    "[data-testid='post-container']",
  ];

  const SITE_CONTAINER_SELECTORS = [
    {
      test: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/,
      selectors: [
        "ytd-rich-item-renderer",
        "ytd-video-renderer",
        "ytd-grid-video-renderer",
        "ytd-compact-video-renderer",
        "ytd-playlist-video-renderer",
        "ytd-reel-item-renderer",
        "ytm-video-with-context-renderer",
      ],
    },
    {
      test: /(^|\.)x\.com$|(^|\.)twitter\.com$/,
      selectors: ["article", "[data-testid='tweet']", "[data-testid='cellInnerDiv']"],
    },
    {
      test: /(^|\.)reddit\.com$/,
      selectors: ["article", "shreddit-post", "[data-testid='post-container']", "[data-testid='post']"],
    },
    {
      test: /(^|\.)facebook\.com$/,
      selectors: ["[role='article']", "[data-pagelet^='FeedUnit']"],
    },
    {
      test: /(^|\.)google\./,
      selectors: ["g-card", "g-inner-card", "div[data-hveid]", "div.MjjYud", "div.Gx5Zad"],
    },
    {
      test: /(^|\.)news\.ycombinator\.com$/,
      selectors: ["tr.athing", ".athing"],
    },
  ];

  const MEDIA_SELECTOR = [
    "img",
    "picture",
    "video",
    "canvas",
    "svg",
    "figure",
    "g-img",
    "ytd-thumbnail",
    "ytm-thumbnail-overlay",
  ].join(", ");

  const SKIP_SELECTOR = [
    "script",
    "style",
    "noscript",
    "textarea",
    "input",
    "select",
    "option",
    "svg",
    "[contenteditable]",
    "[data-bpk-hidden='1']",
    "[data-bpk-text-wrapper='1']",
    ".bpk-redaction",
    ".bpk-redaction-marker",
  ].join(", ");

  const SIGNAL_ATTRS = ["alt", "aria-label", "title", "data-title", "data-content-feature", "src", "data-src"];
  const BLOCK_DISPLAYS = new Set(["block", "flex", "grid", "list-item", "table", "table-row", "table-cell"]);

  let settings = BPK.normalizeSettings(BPK.DEFAULTS);
  let matcher = null;
  let observer = null;
  let scanTimer = null;
  let idleHandle = null;
  let applying = false;

  let scannedTextNodes = new WeakSet();
  let scannedElements = new WeakSet();
  let shadowHostsSeen = new WeakSet();

  const observedRoots = new WeakSet();
  const pendingRoots = new Set();
  const hiddenElements = new Set();
  const originalDisplay = new WeakMap();
  const redactionWrappers = new Set();
  const wrapperText = new WeakMap();

  function isElement(node) {
    return Boolean(node && node.nodeType === ELEMENT_NODE);
  }

  function isText(node) {
    return Boolean(node && node.nodeType === TEXT_NODE);
  }

  function isRoot(node) {
    return Boolean(
      node &&
        (node.nodeType === ELEMENT_NODE ||
          node.nodeType === DOCUMENT_NODE ||
          node.nodeType === DOCUMENT_FRAGMENT_NODE),
    );
  }

  function ownerDocument(node) {
    if (node?.nodeType === DOCUMENT_NODE) return node;
    return node?.ownerDocument || document;
  }

  function ownerWindow(node) {
    return ownerDocument(node).defaultView || window;
  }

  function escapeRe(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function resetSeen() {
    scannedTextNodes = new WeakSet();
    scannedElements = new WeakSet();
    shadowHostsSeen = new WeakSet();
  }

  function buildMatcher(nextSettings) {
    const terms = BPK.normalizeTerms(nextSettings.blockedTerms).sort((a, b) => b.length - a.length);
    if (!terms.length) return null;

    return {
      regex: new RegExp(terms.map(escapeRe).join("|"), "giu"),
    };
  }

  function charBefore(text, index) {
    if (index <= 0) return "";
    return Array.from(text.slice(Math.max(0, index - 2), index)).pop() || "";
  }

  function charAfter(text, index) {
    if (index >= text.length) return "";
    return Array.from(text.slice(index, index + 2))[0] || "";
  }

  function isWordChar(value) {
    return WORD_CHAR_RE.test(value);
  }

  function isCjkTerm(value) {
    return CJK_RE.test(value);
  }

  function hasWholeWordBoundary(text, start, end, value) {
    if (isCjkTerm(value)) return true;

    const first = Array.from(value)[0] || "";
    const last = Array.from(value).pop() || "";
    const needsStart = isWordChar(first);
    const needsEnd = isWordChar(last);

    if (needsStart && isWordChar(charBefore(text, start))) return false;
    if (needsEnd && isWordChar(charAfter(text, end))) return false;

    return true;
  }

  function matchRanges(text) {
    if (!matcher || !text) return [];

    const ranges = [];
    matcher.regex.lastIndex = 0;

    let match = matcher.regex.exec(text);
    while (match) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      if (value && (!settings.wholeWord || hasWholeWordBoundary(text, start, end, value))) {
        ranges.push({ start, end });
      }

      if (match[0].length === 0) matcher.regex.lastIndex += 1;
      match = matcher.regex.exec(text);
    }

    return ranges;
  }

  function hasMatch(text) {
    return matchRanges(text).length > 0;
  }

  function hostFor(node) {
    return ownerWindow(node).location.hostname.toLowerCase();
  }

  function containerSelectorFor(node) {
    const host = hostFor(node);
    const selectors = [...BASE_CONTAINER_SELECTORS];

    for (const entry of SITE_CONTAINER_SELECTORS) {
      if (entry.test.test(host)) selectors.unshift(...entry.selectors);
    }

    return [...new Set(selectors)].join(", ");
  }

  function isTooLarge(el) {
    if (!isElement(el)) return false;

    const rect = el.getBoundingClientRect();
    if (!rect || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)) return false;

    const view = ownerWindow(el);
    const doc = ownerDocument(el);
    const vw = view.innerWidth || doc.documentElement.clientWidth || 0;
    const vh = view.innerHeight || doc.documentElement.clientHeight || 0;

    return Boolean(vw && vh && rect.width > vw * 0.96 && rect.height > vh * 0.82);
  }

  function countMedia(el) {
    if (!isElement(el)) return 0;
    return (el.matches(MEDIA_SELECTOR) ? 1 : 0) + el.querySelectorAll(MEDIA_SELECTOR).length;
  }

  function scoreContainer(el) {
    if (
      !isElement(el) ||
      el === ownerDocument(el).body ||
      el === ownerDocument(el).documentElement ||
      isTooLarge(el)
    ) {
      return -1;
    }

    const view = ownerWindow(el);
    const style = view.getComputedStyle(el);
    const semantic = el.matches(containerSelectorFor(el)) ? 100 : 0;
    const display = BLOCK_DISPLAYS.has(style.display) ? 14 : 0;
    const media = countMedia(el);
    const mediaScore = media > 0 ? 50 + Math.min(media, 4) * 8 : 0;
    const textLength = (el.innerText || el.textContent || "").trim().length;
    const textScore = Math.min(textLength, 300) / 10;
    const children = el.children.length >= 2 ? 8 : 0;

    return semantic + display + mediaScore + textScore + children;
  }

  function findHideContainer(node) {
    const parent = isText(node) ? node.parentElement : node;
    if (!isElement(parent)) return null;

    const selector = containerSelectorFor(parent);
    const preferred = parent.closest(selector);
    if (preferred && !isTooLarge(preferred)) return preferred;

    let current = parent;
    let best = null;
    let bestScore = -1;

    for (let depth = 0; current && current !== ownerDocument(current).body && depth < 12; depth += 1) {
      const score = scoreContainer(current);
      if (score > bestScore) {
        best = current;
        bestScore = score;
      }
      current = current.parentElement;
    }

    return best && bestScore >= 20 ? best : parent;
  }

  function hideElement(el) {
    if (!isElement(el) || hiddenElements.has(el)) return false;

    originalDisplay.set(el, {
      value: el.style.getPropertyValue("display"),
      priority: el.style.getPropertyPriority("display"),
    });
    el.setAttribute("data-bpk-hidden", "1");
    el.style.setProperty("display", "none", "important");
    hiddenElements.add(el);
    return true;
  }

  function restoreHidden() {
    for (const el of hiddenElements) {
      const original = originalDisplay.get(el);
      if (original?.value) {
        el.style.setProperty("display", original.value, original.priority);
      } else {
        el.style.removeProperty("display");
      }
      el.removeAttribute("data-bpk-hidden");
    }
    hiddenElements.clear();
  }

  function restoreRedactions() {
    for (const wrapper of redactionWrappers) {
      const original = wrapperText.get(wrapper);
      if (wrapper.isConnected && typeof original === "string") {
        wrapper.replaceWith(ownerDocument(wrapper).createTextNode(original));
      }
    }
    redactionWrappers.clear();
  }

  function restoreAll() {
    restoreRedactions();
    restoreHidden();
    resetSeen();
  }

  function hasEditableAncestor(el) {
    let current = el;
    while (current && isElement(current)) {
      if (current.isContentEditable) return true;
      current = current.parentElement;
    }
    return false;
  }

  function shouldSkipTextNode(node) {
    if (!isText(node) || !node.isConnected || scannedTextNodes.has(node)) return true;

    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest(SKIP_SELECTOR)) return true;
    if (hasEditableAncestor(parent)) return true;

    return false;
  }

  function redactTextNode(node, ranges) {
    const original = node.nodeValue || "";
    const doc = ownerDocument(node);
    const wrapper = doc.createElement("span");
    wrapper.setAttribute("data-bpk-text-wrapper", "1");

    let cursor = 0;
    for (const range of ranges) {
      if (range.start > cursor) {
        wrapper.append(doc.createTextNode(original.slice(cursor, range.start)));
      }

      const marker = doc.createElement("span");
      marker.className = "bpk-redaction bpk-redaction-marker";
      marker.setAttribute("data-bpk-redaction", "1");
      marker.setAttribute("role", "text");
      marker.setAttribute("aria-label", "redacted");
      marker.title = "redacted";
      marker.textContent = "[BLOCKED]";
      wrapper.append(marker);
      cursor = range.end;
    }

    if (cursor < original.length) {
      wrapper.append(doc.createTextNode(original.slice(cursor)));
    }

    wrapperText.set(wrapper, original);
    redactionWrappers.add(wrapper);
    node.replaceWith(wrapper);
  }

  function processTextNode(node) {
    if (shouldSkipTextNode(node)) return;
    scannedTextNodes.add(node);

    const ranges = matchRanges(node.nodeValue || "");
    if (!ranges.length) return;

    if (settings.mode === "hide") {
      hideElement(findHideContainer(node));
      return;
    }

    if (settings.mode === "redact") {
      redactTextNode(node, ranges);
    }
  }

  function walkText(root) {
    if (!isRoot(root) && !isText(root)) return;

    if (isText(root)) {
      processTextNode(root);
      return;
    }

    const doc = ownerDocument(root);
    const walker = doc.createTreeWalker(root, SHOW_TEXT);
    let current = walker.nextNode();

    while (current) {
      processTextNode(current);
      current = walker.nextNode();
    }
  }

  function collectSignals(mediaEl, target) {
    const parts = [];

    for (const el of [mediaEl, target]) {
      if (!isElement(el)) continue;
      for (const attr of SIGNAL_ATTRS) {
        const value = el.getAttribute(attr);
        if (value) parts.push(value);
      }
    }

    const link = mediaEl.closest?.("a[href]");
    if (link) {
      for (const attr of ["href", "aria-label", "title"]) {
        const value = link.getAttribute(attr);
        if (value) parts.push(value);
      }
    }

    if (isElement(target)) {
      const text = (target.innerText || target.textContent || "").trim();
      if (text) parts.push(text.slice(0, 900));
    }

    return parts.join(" ");
  }

  function processMedia(root) {
    if (settings.mode !== "hide" || !matcher) return;

    const elements = [];
    if (isElement(root) && root.matches(MEDIA_SELECTOR)) elements.push(root);
    if (root?.querySelectorAll) elements.push(...root.querySelectorAll(MEDIA_SELECTOR));

    for (const mediaEl of elements) {
      if (!isElement(mediaEl) || !mediaEl.isConnected) continue;

      const target = findHideContainer(mediaEl) || mediaEl;
      if (!target?.isConnected || scannedElements.has(target)) continue;
      scannedElements.add(target);

      if (target.closest?.("[data-bpk-hidden='1']")) continue;
      if (hasMatch(collectSignals(mediaEl, target))) hideElement(target);
    }
  }

  function observeRoot(root) {
    if (!observer || !isRoot(root) || observedRoots.has(root)) return;
    observedRoots.add(root);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function collectOpenShadowRoots(root, roots) {
    if (!root?.querySelectorAll) return;

    const doc = ownerDocument(root);
    const walker = doc.createTreeWalker(root, SHOW_ELEMENT);
    let current = walker.currentNode;

    while (current) {
      if (isElement(current) && current.shadowRoot && !shadowHostsSeen.has(current)) {
        shadowHostsSeen.add(current);
        observeRoot(current.shadowRoot);
        roots.push(current.shadowRoot);
        collectOpenShadowRoots(current.shadowRoot, roots);
      }
      current = walker.nextNode();
    }
  }

  function collectSameOriginFrames(root, roots) {
    if (!root?.querySelectorAll) return;

    const frames = isElement(root) && root.localName === "iframe" ? [root] : [...root.querySelectorAll("iframe")];

    for (const frame of frames) {
      try {
        const frameDoc = frame.contentDocument;
        if (!frameDoc?.documentElement) continue;

        observeRoot(frameDoc.documentElement);
        roots.push(frameDoc.body || frameDoc.documentElement);
      } catch {
        // Cross-origin frames are intentionally skipped.
      }
    }
  }

  function processRoot(root) {
    if (!settings.enabled || !matcher) return;

    const roots = [root];
    collectOpenShadowRoots(root, roots);
    collectSameOriginFrames(root, roots);

    for (const currentRoot of roots) {
      walkText(currentRoot);
      processMedia(currentRoot);
    }
  }

  function runWhenIdle(fn) {
    if ("cancelIdleCallback" in window && idleHandle) {
      window.cancelIdleCallback(idleHandle);
      idleHandle = null;
    }

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(
        () => {
          idleHandle = null;
          fn();
        },
        { timeout: 500 },
      );
      return;
    }

    if ("requestAnimationFrame" in window) {
      window.requestAnimationFrame(() => fn());
      return;
    }

    window.setTimeout(fn, 0);
  }

  function flushQueue() {
    if (applying) return;

    const roots = [...pendingRoots].filter((root) => root?.isConnected !== false);
    pendingRoots.clear();
    applying = true;

    try {
      for (const root of roots) processRoot(root);
    } finally {
      applying = false;
    }
  }

  function scheduleScan() {
    if (scanTimer) window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      runWhenIdle(flushQueue);
    }, 100);
  }

  function enqueue(node) {
    if (!node) return;

    const root = isText(node) ? node.parentElement : node;
    if (!isRoot(root)) return;

    pendingRoots.add(root);
    scheduleScan();
  }

  function applySettings(nextSettings) {
    settings = BPK.normalizeSettings(nextSettings);
    matcher = buildMatcher(settings);
    restoreAll();
    enqueue(document.body || document.documentElement || document);
  }

  function handleMutations(mutations) {
    if (applying) return;

    let resetForTextChanges = false;

    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        resetForTextChanges = true;
        enqueue(mutation.target);
        continue;
      }

      if (mutation.type !== "childList") continue;

      for (const node of mutation.addedNodes) {
        enqueue(node);
      }
    }

    if (resetForTextChanges) resetSeen();
  }

  async function init() {
    observer = new MutationObserver(handleMutations);
    observeRoot(document.documentElement || document);

    BPK.onSettingsChanged(applySettings);

    try {
      applySettings(await BPK.loadSettings());
    } catch {
      applySettings(BPK.DEFAULTS);
    }
  }

  init();
})();
