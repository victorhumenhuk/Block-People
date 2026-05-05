const els = {
  enabled: document.getElementById("enabledToggle"),
  termCount: document.getElementById("termCount"),
  termInput: document.getElementById("termInput"),
  add: document.getElementById("addBtn"),
  clear: document.getElementById("clearBtn"),
  list: document.getElementById("termList"),
  empty: document.getElementById("emptyState"),
  emptyAdd: document.getElementById("emptyAddBtn"),
  modeHide: document.getElementById("modeHide"),
  modeRedact: document.getElementById("modeRedact"),
  status: document.getElementById("status"),
  error: document.getElementById("errorStatus"),
  options: document.getElementById("optionsBtn"),
};
const controls = [els.enabled, els.termInput, els.add, els.clear, els.emptyAdd, els.modeHide, els.modeRedact, els.options];
let settings = { ...BPK.DEFAULTS };
let saving = null;
let busy = false;

function setBusy(isBusy) {
  busy = isBusy;
  for (const control of controls) control.disabled = isBusy;
  if (!isBusy) els.clear.disabled = settings.blockedTerms.length === 0;
}

function setStatus(message = "", type = "info") {
  els.status.textContent = type === "error" ? "" : message;
  els.status.classList.toggle("success", type === "success");
  els.error.textContent = type === "error" ? message : "";
}

function splitInput(raw) {
  return BPK.normalizeTerms(String(raw).split(/\r?\n|,/));
}

function currentMode() {
  return els.modeRedact.checked ? "redact" : "hide";
}

function withCurrentForm() {
  return { ...settings, enabled: els.enabled.checked, mode: currentMode() };
}

function render() {
  const terms = settings.blockedTerms;
  els.enabled.checked = settings.enabled;
  els.modeHide.checked = settings.mode === "hide";
  els.modeRedact.checked = settings.mode === "redact";
  els.termCount.textContent = `${terms.length} blocked`;
  els.clear.disabled = busy || terms.length === 0;
  els.list.textContent = "";

  for (const term of terms) {
    const item = document.createElement("li");
    item.className = "term-item";
    const name = document.createElement("span");
    name.className = "term-name";
    name.textContent = term;
    name.title = term;
    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${term}`);
    remove.dataset.term = term;
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    item.append(name, remove);
    els.list.append(item);
  }

  els.empty.hidden = terms.length !== 0;
}

async function persist(nextSettings, message) {
  if (saving) await saving;
  setBusy(true);
  setStatus("Saving...");
  saving = (async () => {
    try {
      settings = await BPK.saveSettings(nextSettings);
      render();
      setStatus(message, "success");
    } catch (error) {
      setStatus(error.message || "Could not save settings.", "error");
    } finally {
      saving = null;
      setBusy(false);
    }
  })();
  return saving;
}

function addTerms() {
  const incoming = splitInput(els.termInput.value);
  if (!incoming.length) {
    els.termInput.focus();
    return;
  }
  const nextTerms = BPK.normalizeTerms([...settings.blockedTerms, ...incoming]);
  const added = nextTerms.length - settings.blockedTerms.length;
  els.termInput.value = "";
  if (!added) {
    setStatus("Already blocked.", "success");
    return;
  }
  persist({ ...withCurrentForm(), blockedTerms: nextTerms }, `Added ${added === 1 ? incoming[0] : `${added} terms`}.`);
}

function removeTerm(term) {
  persist({ ...withCurrentForm(), blockedTerms: settings.blockedTerms.filter((value) => value !== term) }, `Removed ${term}.`);
}

function clearTerms() {
  if (settings.blockedTerms.length) persist({ ...withCurrentForm(), blockedTerms: [] }, "Removed all blocked terms.");
}

function saveControls() {
  persist(withCurrentForm(), "Settings updated.");
}

async function openOptions() {
  const runtime = BPK.api?.runtime;
  if (runtime?.openOptionsPage) await runtime.openOptionsPage();
}

async function load() {
  setBusy(true);
  try {
    settings = await BPK.loadSettings();
    render();
  } catch {
    setStatus("Could not load settings.", "error");
  } finally {
    setBusy(false);
  }
}

els.add.addEventListener("click", addTerms);
els.emptyAdd.addEventListener("click", () => els.termInput.focus());
els.clear.addEventListener("click", clearTerms);
els.termInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTerms();
  }
});
els.list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-term]");
  if (button) removeTerm(button.dataset.term);
});
els.enabled.addEventListener("change", saveControls);
els.modeHide.addEventListener("change", saveControls);
els.modeRedact.addEventListener("change", saveControls);
els.options.addEventListener("click", openOptions);
BPK.onSettingsChanged((nextSettings) => {
  settings = nextSettings;
  render();
});
load();
