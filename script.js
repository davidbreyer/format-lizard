const sourceInput = document.querySelector("#sourceInput");
const formattedOutput = document.querySelector("#formattedOutput");
const formatSelect = document.querySelector("#format");
const indentSelect = document.querySelector("#indent");
const formatButton = document.querySelector("#formatButton");
const minifyButton = document.querySelector("#minifyButton");
const copyButton = document.querySelector("#copyButton");
const clearButton = document.querySelector("#clearButton");
const status = document.querySelector("#status");
const stats = document.querySelector("#stats");
const inputCount = document.querySelector("#inputCount");
const outputCount = document.querySelector("#outputCount");
const releaseStamp = document.querySelector("#releaseStamp");

const appRelease = "20260603-2050";

const sampleJson = {
  project: "Lizard Formatter",
  format: "json",
  active: true,
  checks: ["parse", "format", "copy"],
  nested: {
    indent: 2,
    futureFormats: ["yaml", "xml", "toml"]
  }
};

sourceInput.value = JSON.stringify(sampleJson);
renderReleaseStamp();
formatJson();

formatButton.addEventListener("click", formatJson);
minifyButton.addEventListener("click", () => formatJson({ minify: true }));
copyButton.addEventListener("click", copyOutput);
clearButton.addEventListener("click", clearEditors);
sourceInput.addEventListener("input", updateCounts);
indentSelect.addEventListener("change", () => {
  if (formattedOutput.value.trim()) {
    formatJson();
  }
});

function formatJson(options = {}) {
  if (formatSelect.value !== "json") {
    setStatus("Only JSON is available right now.", "error");
    return;
  }

  const input = sourceInput.value.trim();
  if (!input) {
    formattedOutput.value = "";
    setStatus("Ready", "idle");
    updateCounts();
    return;
  }

  try {
    const parsed = JSON.parse(input);
    const spacing = options.minify ? 0 : getIndent();
    formattedOutput.value = JSON.stringify(parsed, null, spacing);
    setStatus(options.minify ? "Minified JSON" : "Formatted JSON", "valid");
  } catch (error) {
    formattedOutput.value = "";
    setStatus(getJsonErrorMessage(error), "error");
  }

  updateCounts();
}

function getIndent() {
  return indentSelect.value === "tab" ? "\t" : Number(indentSelect.value);
}

async function copyOutput() {
  if (!formattedOutput.value) {
    setStatus("Nothing to copy", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(formattedOutput.value);
    setStatus("Copied output", "valid");
  } catch {
    formattedOutput.select();
    document.execCommand("copy");
    setStatus("Copied output", "valid");
  }
}

function clearEditors() {
  sourceInput.value = "";
  formattedOutput.value = "";
  setStatus("Ready", "idle");
  updateCounts();
  sourceInput.focus();
}

function updateCounts() {
  const inputLength = sourceInput.value.length;
  const outputLength = formattedOutput.value.length;
  inputCount.textContent = formatCount(inputLength);
  outputCount.textContent = formatCount(outputLength);
  stats.textContent = `${formatCount(inputLength)} input / ${formatCount(outputLength)} output`;
}

function setStatus(message, type) {
  status.textContent = message;
  status.className = `status-pill status-${type}`;
}

function getJsonErrorMessage(error) {
  const match = error.message.match(/position (\d+)/i);
  if (!match) {
    return error.message;
  }

  const position = Number(match[1]);
  const location = getLineAndColumn(sourceInput.value, position);
  return `Invalid JSON at line ${location.line}, column ${location.column}`;
}

function getLineAndColumn(text, position) {
  const before = text.slice(0, position);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function formatCount(value) {
  return `${value.toLocaleString()} ${value === 1 ? "char" : "chars"}`;
}

function renderReleaseStamp() {
  if (releaseStamp) {
    releaseStamp.textContent = `Version: ${appRelease}`;
  }
}
