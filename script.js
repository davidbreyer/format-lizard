const sourceInput = document.querySelector("#sourceInput");
const formattedOutput = document.querySelector("#formattedOutput");
const formatSelect = document.querySelector("#format");
const indentSelect = document.querySelector("#indent");
const sortKeys = document.querySelector("#sortKeys");
const formatButton = document.querySelector("#formatButton");
const minifyButton = document.querySelector("#minifyButton");
const unescapeButton = document.querySelector("#unescapeButton");
const jsonToXmlButton = document.querySelector("#jsonToXmlButton");
const copyButton = document.querySelector("#copyButton");
const saveButton = document.querySelector("#saveButton");
const clearButton = document.querySelector("#clearButton");
const status = document.querySelector("#status");
const stats = document.querySelector("#stats");
const inputCount = document.querySelector("#inputCount");
const outputCount = document.querySelector("#outputCount");
const releaseStamp = document.querySelector("#releaseStamp");

const appRelease = "20260604-0641";

const formatSamples = {
  json: JSON.stringify({
    project: "Lizard Formatter",
    format: "json",
    active: true,
    checks: ["parse", "format", "copy"],
    nested: {
      indent: 2,
      futureFormats: ["xml", "yaml", "toml"]
    }
  }),
  xml: '<project name="Lizard Formatter"><format>xml</format><checks><check>parse</check><check>format</check><check>copy</check></checks></project>'
};

const formatLabels = {
  json: "JSON",
  xml: "XML"
};

const fileExtensions = {
  json: "json",
  xml: "xml"
};

const mimeTypes = {
  json: "application/json",
  xml: "application/xml"
};

const placeholders = {
  json: '{"name":"Ada","tools":["logic","tea"],"ready":true}',
  xml: '<project name="Ada"><tool>logic</tool><ready>true</ready></project>'
};

const formatters = {
  json: {
    format: formatJson,
    minify: minifyJson
  },
  xml: {
    format: formatXml,
    minify: minifyXml
  }
};

sourceInput.value = formatSamples.json;
renderReleaseStamp();
formatInput();

formatButton.addEventListener("click", formatInput);
minifyButton.addEventListener("click", minifyInput);
unescapeButton.addEventListener("click", unescapeJsonString);
jsonToXmlButton.addEventListener("click", convertJsonToXml);
copyButton.addEventListener("click", copyOutput);
saveButton.addEventListener("click", saveOutput);
clearButton.addEventListener("click", clearEditors);
sourceInput.addEventListener("input", handleInputChange);
formatSelect.addEventListener("change", handleFormatChange);
indentSelect.addEventListener("change", () => {
  if (formattedOutput.value.trim()) {
    formatInput();
  }
});
sortKeys.addEventListener("change", () => {
  if (formatSelect.value === "json" && formattedOutput.value.trim()) {
    formatInput();
  }
});

function formatInput() {
  const input = sourceInput.value.trim();
  if (!input) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    setStatus("Ready", "idle");
    updateCounts();
    return;
  }

  const selectedFormatter = formatters[formatSelect.value];
  if (!selectedFormatter) {
    setStatus("That format is not available right now.", "error");
    return;
  }

  try {
    formattedOutput.value = selectedFormatter.format(input);
    formattedOutput.dataset.outputFormat = formatSelect.value;
    setStatus(`Formatted ${getFormatLabel()}`, "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    setStatus(error.message, "error");
  }

  updateCounts();
}

function minifyInput() {
  const input = sourceInput.value.trim();
  if (!input) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    setStatus("Ready", "idle");
    updateCounts();
    return;
  }

  const selectedFormatter = formatters[formatSelect.value];
  if (!selectedFormatter) {
    setStatus("That format is not available right now.", "error");
    return;
  }

  try {
    formattedOutput.value = selectedFormatter.minify(input);
    formattedOutput.dataset.outputFormat = formatSelect.value;
    setStatus(`Minified ${getFormatLabel()}`, "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    setStatus(error.message, "error");
  }

  updateCounts();
}

function formatJson(input) {
  try {
    const parsed = prepareJsonValue(JSON.parse(input));
    return JSON.stringify(parsed, null, getIndent());
  } catch (error) {
    throw new Error(getJsonErrorMessage(error));
  }
}

function minifyJson(input) {
  try {
    return JSON.stringify(prepareJsonValue(JSON.parse(input)));
  } catch (error) {
    throw new Error(getJsonErrorMessage(error));
  }
}

function prepareJsonValue(value) {
  return sortKeys.checked ? sortJsonKeys(value) : value;
}

function sortJsonKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce((sorted, key) => {
      sorted[key] = sortJsonKeys(value[key]);
      return sorted;
    }, {});
}

function formatXml(input) {
  const document = parseXml(input);
  const serialized = new XMLSerializer().serializeToString(document);
  return prettyPrintXml(serialized, getIndentString());
}

function minifyXml(input) {
  const document = parseXml(input);
  return new XMLSerializer()
    .serializeToString(document)
    .replace(/>\s+</g, "><")
    .trim();
}

function parseXml(input) {
  const document = new DOMParser().parseFromString(input, "application/xml");
  const parserError = document.querySelector("parsererror");
  if (parserError) {
    throw new Error(getXmlErrorMessage(parserError));
  }
  return document;
}

function prettyPrintXml(xml, indentation) {
  const tokens = xml.replace(/>\s*</g, "><").split(/(?=<)|(?<=>)/g).filter(Boolean);
  let level = 0;
  const lines = [];

  tokens.forEach((token) => {
    if (!token.trim()) {
      return;
    }

    if (token.startsWith("</")) {
      level = Math.max(level - 1, 0);
    }

    lines.push(`${indentation.repeat(level)}${token.trim()}`);

    if (isOpeningXmlTag(token)) {
      level += 1;
    }
  });

  return lines.join("\n");
}

function isOpeningXmlTag(token) {
  return token.startsWith("<")
    && !token.startsWith("</")
    && !token.startsWith("<?")
    && !token.startsWith("<!")
    && !token.endsWith("/>");
}

function getIndent() {
  return indentSelect.value === "tab" ? "\t" : Number(indentSelect.value);
}

function getIndentString() {
  return indentSelect.value === "tab" ? "\t" : " ".repeat(Number(indentSelect.value));
}

function handleFormatChange() {
  const selectedFormat = formatSelect.value;
  sourceInput.placeholder = placeholders[selectedFormat] || "";
  formattedOutput.placeholder = `Formatted ${getFormatLabel()} will appear here`;
  updateFormatControls();

  if (!sourceInput.value.trim() || formattedOutput.value.trim()) {
    sourceInput.value = formatSamples[selectedFormat] || "";
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    formatInput();
  } else {
    updateCounts();
  }
}

function handleInputChange() {
  autoDetectFormat(sourceInput.value);
  updateCounts();
}

function autoDetectFormat(value) {
  const detectedFormat = detectFormat(value);
  if (!detectedFormat || detectedFormat === formatSelect.value) {
    return;
  }

  formatSelect.value = detectedFormat;
  sourceInput.placeholder = placeholders[detectedFormat] || "";
  formattedOutput.placeholder = `Formatted ${getFormatLabel()} will appear here`;
  formattedOutput.value = "";
  delete formattedOutput.dataset.outputFormat;
  updateFormatControls();
  setStatus(`Detected ${getFormatLabel()}`, "valid");
}

function detectFormat(value) {
  const input = value.trim();
  if (!input) {
    return null;
  }

  if (looksLikeJson(input)) {
    return "json";
  }

  if (looksLikeXml(input)) {
    return "xml";
  }

  return null;
}

function looksLikeJson(input) {
  const first = input[0];
  const last = input[input.length - 1];
  return (first === "{" && last === "}") || (first === "[" && last === "]");
}

function looksLikeXml(input) {
  return /^<\?xml[\s>]/i.test(input) || /^<[A-Za-z_][\w:.-]*(\s|>|\/>)/.test(input);
}

function updateFormatControls() {
  const isJson = formatSelect.value === "json";
  sortKeys.disabled = !isJson;
  unescapeButton.disabled = !isJson;
  jsonToXmlButton.disabled = !isJson;
}

function unescapeJsonString() {
  if (formatSelect.value !== "json") {
    setStatus("Unescape is only available for JSON.", "error");
    return;
  }

  const input = sourceInput.value.trim();
  if (!input) {
    setStatus("Nothing to unescape", "error");
    return;
  }

  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== "string") {
      setStatus("Input is valid JSON, but not a JSON string.", "error");
      return;
    }

    sourceInput.value = parsed;
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    autoDetectFormat(parsed);
    formatInput();
    setStatus("Unescaped JSON string", "valid");
  } catch (error) {
    setStatus(getJsonErrorMessage(error), "error");
  }
}

function convertJsonToXml() {
  if (formatSelect.value !== "json") {
    setStatus("JSON to XML is only available for JSON input.", "error");
    return;
  }

  const input = sourceInput.value.trim();
  if (!input) {
    setStatus("Nothing to convert", "error");
    return;
  }

  try {
    const parsed = prepareJsonValue(JSON.parse(input));
    formattedOutput.value = jsonValueToXmlDocument(parsed);
    formattedOutput.dataset.outputFormat = "xml";
    setStatus("Converted JSON to XML", "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    setStatus(getJsonErrorMessage(error), "error");
  }

  updateCounts();
}

function jsonValueToXmlDocument(value) {
  const rootName = getJsonRootName(value);
  const body = jsonValueToXml(value, rootName, 0);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

function getJsonRootName(value) {
  if (Array.isArray(value)) {
    return "items";
  }

  return "root";
}

function jsonValueToXml(value, tagName, level) {
  const indentation = getIndentString();
  const safeTagName = toXmlTagName(tagName);
  const prefix = indentation.repeat(level);

  if (Array.isArray(value)) {
    if (!value.length) {
      return `${prefix}<${safeTagName}></${safeTagName}>`;
    }

    const childLines = value.map((item) => jsonValueToXml(item, "item", level + 1));
    return [
      `${prefix}<${safeTagName}>`,
      ...childLines,
      `${prefix}</${safeTagName}>`
    ].join("\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) {
      return `${prefix}<${safeTagName}></${safeTagName}>`;
    }

    const childLines = entries.map(([key, childValue]) => jsonValueToXml(childValue, key, level + 1));
    return [
      `${prefix}<${safeTagName}>`,
      ...childLines,
      `${prefix}</${safeTagName}>`
    ].join("\n");
  }

  if (value === null) {
    return `${prefix}<${safeTagName} null="true"></${safeTagName}>`;
  }

  return `${prefix}<${safeTagName}>${escapeXmlText(String(value))}</${safeTagName}>`;
}

function toXmlTagName(value) {
  const cleaned = String(value)
    .trim()
    .replace(/[^\w:.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned) {
    return "value";
  }

  return /^[A-Za-z_:]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function escapeXmlText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

function saveOutput() {
  if (!formattedOutput.value) {
    setStatus("Nothing to save", "error");
    return;
  }

  const outputFormat = getOutputFormat();
  const blob = new Blob([formattedOutput.value], {
    type: `${mimeTypes[outputFormat] || "text/plain"};charset=utf-8`
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `lizard-formatter-${appRelease}.${fileExtensions[outputFormat] || "txt"}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
  setStatus("Saved output file", "valid");
}

function clearEditors() {
  sourceInput.value = "";
  formattedOutput.value = "";
  delete formattedOutput.dataset.outputFormat;
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

function getOutputFormat() {
  return formattedOutput.dataset.outputFormat || formatSelect.value;
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

function getXmlErrorMessage(parserError) {
  const text = parserError.textContent.replace(/\s+/g, " ").trim();
  const match = text.match(/line\s+(\d+).*column\s+(\d+)/i);
  if (match) {
    return `Invalid XML at line ${match[1]}, column ${match[2]}`;
  }
  return "Invalid XML";
}

function getFormatLabel() {
  return formatLabels[formatSelect.value] || formatSelect.value.toUpperCase();
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

updateFormatControls();
