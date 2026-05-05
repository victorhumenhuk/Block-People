const els = {
  summary: document.getElementById("summary"),
  save: document.getElementById("saveBtn"),
  mobileSave: document.getElementById("mobileSaveBtn"),
  reload: document.getElementById("reloadBtn"),
  clear: document.getElementById("clearBtn"),
  terms: document.getElementById("termsInput"),
  enabled: document.getElementById("enabledInput"),
  modeHide: document.getElementById("modeHideInput"),
  modeRedact: document.getElementById("modeRedactInput"),
  status: document.getElementById("status"),
  error: document.getElementById("errorStatus"),
};
const controls = [els.save, els.mobileSave, els.reload, els.clear, els.terms, els.enabled, els.modeHide, els.modeRedact];
let settings = { ...BPK.DEFAULTS };
let dirty = false;
let busy = false;

function setBusy(isBusy) {
  busy = isBusy;
  for (const control of controls) control.disabled = isBusy;
  if (!isBusy) els.clear.disabled = settings.blockedTerms.length === 0;
}

function setStatus(message = "", type = "success") {
  els.status.textContent = type === "error" ? "" : message;
  els.error.textContent = type === "error" ? message : "";
}

function selectedMode() {
  return els.modeRedact.checked ? "redact" : "hide";
}

function formSettings() {
  return {
    ...settings,
    enabled: els.enabled.checked,
    blockedTerms: BPK.normalizeTerms(els.terms.value.split(/\r?\n|,/)),
    mode: selectedMode(),
  };
}

function render() {
  els.summary.textContent = `${settings.blockedTerms.length} blocked term${settings.blockedTerms.length === 1 ? "" : "s"}`;
  els.terms.value = settings.blockedTerms.join("\n");
  els.enabled.checked = settings.enabled;
  els.modeHide.checked = settings.mode === "hide";
  els.modeRedact.checked = settings.mode === "redact";
  els.clear.disabled = busy || settings.blockedTerms.length === 0;
}

function markDirty() {
  dirty = true;
  setStatus("");
}

async function load() {
  setBusy(true);
  try {
    settings = await BPK.loadSettings();
    dirty = false;
    render();
  } catch {
    setStatus("Could not load settings.", "error");
  } finally {
    setBusy(false);
  }
}

async function save() {
  setBusy(true);
  setStatus("Saving...");
  try {
    settings = await BPK.saveSettings(formSettings());
    dirty = false;
    render();
    setStatus("Saved.");
  } catch (error) {
    setStatus(error.message || "Could not save settings.", "error");
  } finally {
    setBusy(false);
  }
}

function clearAll() {
  els.terms.value = "";
  markDirty();
}

els.save.addEventListener("click", save);
els.mobileSave.addEventListener("click", save);
els.reload.addEventListener("click", load);
els.clear.addEventListener("click", clearAll);
for (const input of [els.terms, els.enabled, els.modeHide, els.modeRedact]) {
  input.addEventListener("input", markDirty);
  input.addEventListener("change", markDirty);
}
BPK.onSettingsChanged((nextSettings) => {
  if (dirty) return;
  settings = nextSettings;
  render();
});
load();
