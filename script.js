const sourceInput = document.querySelector("#sourceInput");
const formattedOutput = document.querySelector("#formattedOutput");
const formatSelect = document.querySelector("#format");
const indentSelect = document.querySelector("#indent");
const sortKeys = document.querySelector("#sortKeys");
const openButton = document.querySelector("#openButton");
const fileInput = document.querySelector("#fileInput");
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
const textViewButton = document.querySelector("#textViewButton");
const treeViewButton = document.querySelector("#treeViewButton");
const treeActions = document.querySelector("#treeActions");
const expandTreeButton = document.querySelector("#expandTreeButton");
const collapseTreeButton = document.querySelector("#collapseTreeButton");
const treeOutput = document.querySelector("#treeOutput");
const releaseStamp = document.querySelector("#releaseStamp");

const appRelease = "20260709-2041";

const formatSamples = {
  json: JSON.stringify({
    project: "Format Lizard",
    format: "json",
    active: true,
    checks: ["parse", "format", "copy"],
    nested: {
      indent: 2,
      futureFormats: ["xml", "yaml", "toml"]
    }
  }),
  xml: '<project name="Format Lizard"><format>xml</format><checks><check>parse</check><check>format</check><check>copy</check></checks></project>',
  yaml: 'project: Format Lizard\nformat: yaml\nactive: true\nchecks:\n  - parse\n  - format\n  - copy\nnested:\n  indent: 2\n  futureFormats:\n    - json\n    - xml\n    - toml',
  css: '/* Format Lizard buttons */\n.button{color:white;background:#5f7a38;border-radius:8px}.button:hover{background:#35471e}@media (max-width: 640px){.button{width:100%}}'
};

const formatLabels = {
  json: "JSON",
  xml: "XML",
  yaml: "YAML",
  css: "CSS"
};

const fileExtensions = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  css: "css"
};

const mimeTypes = {
  json: "application/json",
  xml: "application/xml",
  yaml: "application/yaml",
  css: "text/css"
};

const placeholders = {
  json: '{"name":"Ada","tools":["logic","tea"],"ready":true}',
  xml: '<project name="Ada"><tool>logic</tool><ready>true</ready></project>',
  yaml: 'name: Ada\ntools:\n  - logic\n  - tea\nready: true',
  css: '.button{color:white;background:#5f7a38}'
};

const formatters = {
  json: {
    format: formatJson,
    minify: minifyJson
  },
  xml: {
    format: formatXml,
    minify: minifyXml
  },
  yaml: {
    format: formatYaml,
    minify: minifyYaml
  },
  css: {
    format: formatCss,
    minify: minifyCss
  }
};

sourceInput.value = formatSamples.json;
renderReleaseStamp();
formatInput();

openButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", openSelectedFile);
formatButton.addEventListener("click", formatInput);
minifyButton.addEventListener("click", minifyInput);
unescapeButton.addEventListener("click", unescapeJsonString);
jsonToXmlButton.addEventListener("click", convertJsonToXml);
copyButton.addEventListener("click", copyOutput);
saveButton.addEventListener("click", saveOutput);
clearButton.addEventListener("click", clearEditors);
textViewButton.addEventListener("click", () => setOutputView("text"));
treeViewButton.addEventListener("click", () => setOutputView("tree"));
expandTreeButton.addEventListener("click", () => setTreeExpanded(true));
collapseTreeButton.addEventListener("click", () => setTreeExpanded(false));
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
    clearTreeOutput();
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
    updateTreeOutput();
    setStatus(`Formatted ${getFormatLabel()}`, "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    clearTreeOutput();
    setStatus(error.message, "error");
  }

  updateCounts();
}

async function openSelectedFile() {
  const [file] = fileInput.files;
  fileInput.value = "";

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    sourceInput.value = content;
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    clearTreeOutput();
    applyDetectedOrNamedFormat(content, file.name);
    formatInput();
    setStatus(`Opened ${file.name}`, "valid");
  } catch {
    setStatus("Could not open file", "error");
  }
}

function applyDetectedOrNamedFormat(content, fileName) {
  const detectedFormat = detectFormat(content) || detectFormatFromFileName(fileName);
  if (!detectedFormat || detectedFormat === formatSelect.value) {
    return;
  }

  formatSelect.value = detectedFormat;
  sourceInput.placeholder = placeholders[detectedFormat] || "";
  formattedOutput.placeholder = `Formatted ${getFormatLabel()} will appear here`;
  updateFormatControls();
}

function minifyInput() {
  const input = sourceInput.value.trim();
  if (!input) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    clearTreeOutput();
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
    updateTreeOutput();
    setStatus(`Minified ${getFormatLabel()}`, "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    clearTreeOutput();
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
  const declaration = getXmlDeclaration(input);
  const body = Array.from(document.childNodes)
    .map((node) => formatXmlNode(node, 0))
    .filter(Boolean)
    .join("\n");
  return declaration ? `${declaration}\n${body}` : body;
}

function minifyXml(input) {
  const document = parseXml(input);
  const declaration = getXmlDeclaration(input);
  const body = new XMLSerializer()
    .serializeToString(document)
    .replace(/>\s+</g, "><")
    .trim();
  return declaration ? `${declaration}${stripXmlDeclaration(body)}` : body;
}

function parseXml(input) {
  const document = new DOMParser().parseFromString(input, "application/xml");
  const parserError = document.querySelector("parsererror");
  if (parserError) {
    throw new Error(getXmlErrorMessage(parserError));
  }
  return document;
}

function getXmlDeclaration(input) {
  const match = input.trimStart().match(/^<\?xml\s+[^?]*\?>/i);
  return match ? match[0] : "";
}

function stripXmlDeclaration(input) {
  return input.replace(/^<\?xml\s+[^?]*\?>/i, "");
}

function formatXmlNode(node, level) {
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    return formatXmlProcessingInstruction(node, level);
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return `${getIndentString().repeat(level)}<!--${node.nodeValue}-->`;
  }

  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${getIndentString().repeat(level)}<![CDATA[${node.nodeValue}]]>`;
  }

  if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
    return formatXmlDoctype(node, level);
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text ? `${getIndentString().repeat(level)}${escapeXmlText(text)}` : "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const indentation = getIndentString();
  const prefix = indentation.repeat(level);
  const attributes = formatXmlAttributes(node);
  const childNodes = Array.from(node.childNodes).filter((child) => {
    return child.nodeType !== Node.TEXT_NODE || child.textContent.trim();
  });

  if (!childNodes.length) {
    return `${prefix}<${node.nodeName}${attributes} />`;
  }

  if (childNodes.length === 1) {
    const [child] = childNodes;
    if (child.nodeType === Node.TEXT_NODE) {
      return child.textContent.trim()
        ? `${prefix}<${node.nodeName}${attributes}>${escapeXmlText(child.textContent.trim())}</${node.nodeName}>`
        : `${prefix}<${node.nodeName}${attributes} />`;
    }

    if (child.nodeType === Node.CDATA_SECTION_NODE) {
      return `${prefix}<${node.nodeName}${attributes}><![CDATA[${child.nodeValue}]]></${node.nodeName}>`;
    }
  }

  const lines = [`${prefix}<${node.nodeName}${attributes}>`];

  childNodes.forEach((child) => {
    const formatted = formatXmlNode(child, level + 1);
    if (formatted) {
      lines.push(formatted);
    }
  });

  lines.push(`${prefix}</${node.nodeName}>`);
  return lines.join("\n");
}

function formatXmlProcessingInstruction(node, level) {
  const prefix = getIndentString().repeat(level);
  return node.data
    ? `${prefix}<?${node.nodeName} ${node.data}?>`
    : `${prefix}<?${node.nodeName}?>`;
}

function formatXmlDoctype(node, level) {
  const prefix = getIndentString().repeat(level);
  if (node.publicId) {
    return `${prefix}<!DOCTYPE ${node.name} PUBLIC "${node.publicId}" "${node.systemId}">`;
  }

  return node.systemId
    ? `${prefix}<!DOCTYPE ${node.name} SYSTEM "${node.systemId}">`
    : `${prefix}<!DOCTYPE ${node.name}>`;
}

function formatXmlAttributes(node) {
  return Array.from(node.attributes)
    .map((attribute) => ` ${attribute.name}="${escapeXmlText(attribute.value)}"`)
    .join("");
}

function formatYaml(input) {
  const parsed = parseYaml(input);
  return stringifyYaml(parsed, 0);
}

function minifyYaml(input) {
  const parsed = parseYaml(input);
  return stringifyYaml(parsed, 0, { compact: true });
}

function parseYaml(input) {
  const lines = normalizeYamlLines(input);
  if (!lines.length) {
    throw new Error("YAML is empty");
  }

  const [value, nextIndex] = parseYamlBlock(lines, 0, lines[0].indent);
  if (nextIndex < lines.length) {
    throw new Error(`Invalid YAML indentation at line ${lines[nextIndex].line}`);
  }

  return value;
}

function normalizeYamlLines(input) {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((rawLine, index) => {
      if (/^\t+/.test(rawLine)) {
        throw new Error(`YAML tabs are not supported at line ${index + 1}`);
      }

      const trimmedComment = stripYamlComment(rawLine);
      if (!trimmedComment.trim()) {
        return null;
      }

      return {
        indent: trimmedComment.match(/^ */)[0].length,
        text: trimmedComment.trim(),
        line: index + 1
      };
    })
    .filter(Boolean);
}

function stripYamlComment(line) {
  let quote = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const previous = line[index - 1];

    if ((char === "\"" || char === "'") && previous !== "\\") {
      quote = quote === char ? null : quote || char;
    }

    if (char === "#" && !quote && (!index || /\s/.test(previous))) {
      return line.slice(0, index).trimEnd();
    }
  }

  return line.trimEnd();
}

function parseYamlBlock(lines, index, indent) {
  if (index >= lines.length) {
    return [null, index];
  }

  if (lines[index].indent < indent) {
    return [null, index];
  }

  if (lines[index].indent !== indent) {
    throw new Error(`Invalid YAML indentation at line ${lines[index].line}`);
  }

  return lines[index].text.startsWith("- ")
    ? parseYamlSequence(lines, index, indent)
    : parseYamlMapping(lines, index, indent);
}

function parseYamlMapping(lines, index, indent) {
  const result = {};
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (line.indent < indent) {
      break;
    }

    if (line.indent !== indent) {
      throw new Error(`Invalid YAML indentation at line ${line.line}`);
    }

    if (line.text.startsWith("- ")) {
      break;
    }

    const [key, rawValue] = splitYamlKeyValue(line.text, line.line);
    cursor += 1;

    if (rawValue) {
      result[key] = parseYamlScalar(rawValue, line.line);
      continue;
    }

    if (cursor < lines.length && lines[cursor].indent > indent) {
      [result[key], cursor] = parseYamlBlock(lines, cursor, lines[cursor].indent);
    } else {
      result[key] = null;
    }
  }

  return [result, cursor];
}

function parseYamlSequence(lines, index, indent) {
  const result = [];
  let cursor = index;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (line.indent < indent) {
      break;
    }

    if (line.indent !== indent || !line.text.startsWith("- ")) {
      break;
    }

    const itemText = line.text.slice(2).trim();
    cursor += 1;

    if (!itemText) {
      if (cursor < lines.length && lines[cursor].indent > indent) {
        const parsed = parseYamlBlock(lines, cursor, lines[cursor].indent);
        result.push(parsed[0]);
        cursor = parsed[1];
      } else {
        result.push(null);
      }
      continue;
    }

    if (looksLikeYamlKeyValue(itemText)) {
      const [key, rawValue] = splitYamlKeyValue(itemText, line.line);
      const item = {};
      item[key] = rawValue ? parseYamlScalar(rawValue, line.line) : null;

      if (cursor < lines.length && lines[cursor].indent > indent) {
        const parsed = parseYamlMapping(lines, cursor, lines[cursor].indent);
        Object.assign(item, parsed[0]);
        cursor = parsed[1];
      }

      result.push(item);
      continue;
    }

    result.push(parseYamlScalar(itemText, line.line));
  }

  return [result, cursor];
}

function splitYamlKeyValue(text, lineNumber) {
  const colonIndex = findYamlSeparator(text);
  if (colonIndex < 1) {
    throw new Error(`Invalid YAML mapping at line ${lineNumber}`);
  }

  const key = text.slice(0, colonIndex).trim();
  const value = text.slice(colonIndex + 1).trim();
  if (!key) {
    throw new Error(`Invalid YAML key at line ${lineNumber}`);
  }

  return [unquoteYamlKey(key), value];
}

function findYamlSeparator(text) {
  let quote = null;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const previous = text[index - 1];
    const next = text[index + 1];

    if ((char === "\"" || char === "'") && previous !== "\\") {
      quote = quote === char ? null : quote || char;
    }

    if (char === ":" && !quote && (!next || /\s/.test(next))) {
      return index;
    }
  }

  return -1;
}

function looksLikeYamlKeyValue(text) {
  return findYamlSeparator(text) > 0;
}

function unquoteYamlKey(key) {
  if (
    (key.startsWith("\"") && key.endsWith("\"")) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    return parseYamlScalar(key, 0);
  }

  return key;
}

function parseYamlScalar(value, lineNumber) {
  if (!value) {
    return null;
  }

  if (value.startsWith("[") || value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`Unsupported YAML flow value at line ${lineNumber}`);
    }
  }

  if (value.startsWith("\"") && value.endsWith("\"")) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`Invalid quoted YAML string at line ${lineNumber}`);
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }

  if (/^(null|~)$/i.test(value)) {
    return null;
  }

  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) {
    return Number(value);
  }

  return value;
}

function stringifyYaml(value, level, options = {}) {
  const indentation = getIndentString();

  if (Array.isArray(value)) {
    if (!value.length) {
      return "[]";
    }

    return value
      .map((item) => {
        const prefix = `${indentation.repeat(level)}-`;
        if (isYamlScalar(item)) {
          return `${prefix} ${formatYamlScalar(item)}`;
        }

        if (isPlainYamlObject(item)) {
          return stringifyYamlSequenceObject(item, level, options);
        }

        return `${prefix}\n${stringifyYaml(item, level + 1, options)}`;
      })
      .join("\n");
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) {
      return "{}";
    }

    return entries
      .map(([key, childValue]) => {
        const prefix = `${indentation.repeat(level)}${formatYamlKey(key)}:`;
        if (isYamlScalar(childValue)) {
          return `${prefix} ${formatYamlScalar(childValue)}`;
        }

        return `${prefix}\n${stringifyYaml(childValue, level + 1, options)}`;
      })
      .join("\n");
  }

  return `${indentation.repeat(level)}${formatYamlScalar(value)}`;
}

function stringifyYamlSequenceObject(value, level, options) {
  const indentation = getIndentString();
  const entries = Object.entries(value);
  const childIndent = indentation.repeat(level + 1);

  return entries
    .map(([key, childValue], index) => {
      const prefix = index === 0 ? `${indentation.repeat(level)}- ` : childIndent;
      const keyPrefix = `${prefix}${formatYamlKey(key)}:`;
      if (isYamlScalar(childValue)) {
        return `${keyPrefix} ${formatYamlScalar(childValue)}`;
      }

      return `${keyPrefix}\n${stringifyYaml(childValue, level + 2, options)}`;
    })
    .join("\n");
}

function isPlainYamlObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isYamlScalar(value) {
  return !value || typeof value !== "object";
}

function formatYamlKey(key) {
  return /^[A-Za-z_][\w.-]*$/.test(key) ? key : JSON.stringify(key);
}

function formatYamlScalar(value) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return shouldQuoteYamlString(value) ? JSON.stringify(value) : value;
  }

  return String(value);
}

function shouldQuoteYamlString(value) {
  return (
    !value ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /\s$|^\s/.test(value) ||
    /:\s/.test(value) ||
    /\s#/.test(value) ||
    /^(?:true|false|null|~)$/i.test(value) ||
    /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)
  );
}

function formatCss(input) {
  const tokens = tokenizeCss(input);
  validateCssTokens(tokens);
  const indentation = getIndentString();
  const lines = [];
  let level = 0;

  tokens.forEach((token, index) => {
    const previous = tokens[index - 1];
    const next = tokens[index + 1];

    if (token.type === "comment") {
      pushCssLine(lines, level, token.value.trim());
      return;
    }

    if (token.value === "{") {
      appendCssText(lines, " {", level);
      level += 1;
      return;
    }

    if (token.value === "}") {
      level = Math.max(0, level - 1);
      if (previous && previous.value !== "{" && previous.value !== ";" && previous.value !== "}") {
        appendCssText(lines, ";", level + 1);
      }
      pushCssLine(lines, level, "}");
      if (next && next.value !== "}") {
        lines.push("");
      }
      return;
    }

    if (token.value === ";") {
      appendCssText(lines, ";", level);
      return;
    }

    if (token.value === ":") {
      appendCssText(lines, isCssSelectorColon(tokens, index) ? ":" : ": ", level);
      return;
    }

    if (token.value === ",") {
      appendCssText(lines, ", ", level);
      return;
    }

    const text = normalizeCssText(token.value);
    if (previous && (previous.value === "{" || previous.value === ";" || previous.type === "comment")) {
      pushCssLine(lines, level, text);
    } else {
      appendCssText(lines, text, level);
    }
  });

  return lines
    .filter((line, index, allLines) => line || (allLines[index - 1] && allLines[index + 1]))
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function minifyCss(input) {
  const tokens = tokenizeCss(input);
  validateCssTokens(tokens);
  let output = "";

  tokens.forEach((token) => {
    if (token.type === "comment") {
      if (token.value.startsWith("/*!")) {
        output += token.value;
      }
      return;
    }

    if (token.type === "punctuation") {
      output = output.trimEnd();
      output += token.value;
      return;
    }

    const value = normalizeCssText(token.value);
    const previous = output[output.length - 1] || "";
    if (previous && needsCssSeparator(previous, value[0])) {
      output += " ";
    }
    output += value;
  });

  return output.trim();
}

function tokenizeCss(input) {
  const tokens = [];
  let buffer = "";
  let quote = null;
  let parenDepth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (quote) {
      buffer += char;
      if (char === "\\" && next) {
        buffer += next;
        index += 1;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\"" || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }

    if (char === "/" && next === "*") {
      flushCssBuffer(tokens, buffer);
      buffer = "";
      const end = input.indexOf("*/", index + 2);
      if (end === -1) {
        throw new Error(`Unclosed CSS comment at line ${getLineAndColumn(input, index).line}`);
      }
      tokens.push({ type: "comment", value: input.slice(index, end + 2) });
      index = end + 1;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      buffer += char;
      continue;
    }

    if (char === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      buffer += char;
      continue;
    }

    if (!parenDepth && "{}:;,".includes(char)) {
      flushCssBuffer(tokens, buffer);
      buffer = "";
      tokens.push({ type: "punctuation", value: char });
      continue;
    }

    buffer += char;
  }

  if (quote) {
    throw new Error("Unclosed CSS string");
  }

  flushCssBuffer(tokens, buffer);
  return tokens;
}

function flushCssBuffer(tokens, buffer) {
  const value = normalizeCssText(buffer);
  if (value) {
    tokens.push({ type: "text", value });
  }
}

function validateCssTokens(tokens) {
  let depth = 0;

  tokens.forEach((token) => {
    if (token.value === "{") {
      depth += 1;
    }

    if (token.value === "}") {
      depth -= 1;
      if (depth < 0) {
        throw new Error("Unexpected CSS closing brace");
      }
    }
  });

  if (depth > 0) {
    throw new Error("Unclosed CSS block");
  }
}

function isCssSelectorColon(tokens, index) {
  for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor];
    if (token.value === "{") {
      return true;
    }
    if (token.value === ";" || token.value === "}") {
      return false;
    }
  }

  return false;
}

function pushCssLine(lines, level, text) {
  lines.push(`${getIndentString().repeat(level)}${text}`);
}

function appendCssText(lines, text, level) {
  if (!lines.length || lines[lines.length - 1] === "") {
    pushCssLine(lines, level, text.trimStart());
    return;
  }

  lines[lines.length - 1] += text;
}

function normalizeCssText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function needsCssSeparator(previous, next) {
  return /[\w%)#.-]/.test(previous) && /[\w.#-]/.test(next);
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
    clearTreeOutput();
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
  clearTreeOutput();
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

  if (looksLikeCss(input)) {
    return "css";
  }

  if (looksLikeYaml(input)) {
    return "yaml";
  }

  return null;
}

function detectFormatFromFileName(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  if (extension === "json") {
    return "json";
  }

  if (extension === "xml" || extension === "config") {
    return "xml";
  }

  if (extension === "yaml" || extension === "yml") {
    return "yaml";
  }

  if (extension === "css") {
    return "css";
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

function looksLikeCss(input) {
  if (!/[{}]/.test(input) || !/[.#@:[\]\w-][^{]*\{[^}]*[:;]/.test(input)) {
    return false;
  }

  try {
    validateCssTokens(tokenizeCss(input));
    return true;
  } catch {
    return false;
  }
}

function looksLikeYaml(input) {
  try {
    parseYaml(input);
    return /^[A-Za-z_"][^{}[\]]*:\s*/m.test(input) || /^\s*-\s+\S/m.test(input);
  } catch {
    return false;
  }
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
    clearTreeOutput();
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
    clearTreeOutput();
    setStatus("Converted JSON to XML", "valid");
  } catch (error) {
    formattedOutput.value = "";
    delete formattedOutput.dataset.outputFormat;
    clearTreeOutput();
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
  link.download = `format-lizard-${appRelease}.${fileExtensions[outputFormat] || "txt"}`;
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
  clearTreeOutput();
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

function setOutputView(view) {
  const showTree = view === "tree" && !treeViewButton.disabled;
  formattedOutput.classList.toggle("hidden", showTree);
  treeOutput.classList.toggle("hidden", !showTree);
  setTreeActionsVisible(showTree);
  textViewButton.classList.toggle("active", !showTree);
  treeViewButton.classList.toggle("active", showTree);
  textViewButton.setAttribute("aria-pressed", String(!showTree));
  treeViewButton.setAttribute("aria-pressed", String(showTree));
}

function updateTreeOutput() {
  if (getOutputFormat() !== "json" || !formattedOutput.value.trim()) {
    clearTreeOutput();
    return;
  }

  try {
    const parsed = JSON.parse(formattedOutput.value);
    treeOutput.replaceChildren(renderJsonTree(parsed, "$"));
    treeViewButton.disabled = false;
  } catch {
    clearTreeOutput();
  }
}

function clearTreeOutput() {
  treeOutput.replaceChildren();
  treeViewButton.disabled = true;
  setOutputView("text");
}

function setTreeActionsVisible(isVisible) {
  treeActions.classList.toggle("is-hidden", !isVisible);
  treeActions.setAttribute("aria-hidden", String(!isVisible));
  expandTreeButton.disabled = !isVisible;
  collapseTreeButton.disabled = !isVisible;
}

function setTreeExpanded(isExpanded) {
  treeOutput.querySelectorAll("details").forEach((details) => {
    details.open = isExpanded;
  });
}

function renderJsonTree(value, label) {
  const node = document.createElement("div");
  node.className = "tree-node";

  if (isJsonContainer(value)) {
    const details = document.createElement("details");
    details.open = true;

    const summary = document.createElement("summary");
    summary.append(renderJsonContainerLine(value, label));
    details.append(summary);

    const children = document.createElement("div");
    children.className = "tree-children";
    const entries = Array.isArray(value)
      ? value.map((item, index) => [index, item])
      : Object.entries(value);

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "tree-empty";
      empty.textContent = Array.isArray(value) ? "empty array" : "empty object";
      children.append(empty);
    } else {
      entries.forEach(([key, childValue]) => {
        children.append(renderJsonTree(childValue, key));
      });
    }

    details.append(children);
    node.append(details);
    return node;
  }

  node.append(renderJsonLeafLine(value, label));
  return node;
}

function renderJsonContainerLine(value, label) {
  const line = document.createElement("span");
  line.className = "tree-line";
  line.append(renderJsonLabel(label));

  const meta = document.createElement("span");
  meta.className = "tree-meta";
  const count = Array.isArray(value) ? value.length : Object.keys(value).length;
  meta.textContent = Array.isArray(value)
    ? `[${count} ${count === 1 ? "item" : "items"}]`
    : `{${count} ${count === 1 ? "key" : "keys"}}`;
  line.append(meta);
  return line;
}

function renderJsonLeafLine(value, label) {
  const line = document.createElement("div");
  line.className = "tree-line";
  line.append(renderJsonLabel(label));

  const valueNode = document.createElement("span");
  valueNode.className = `tree-${getJsonType(value)}`;
  valueNode.textContent = formatJsonLeafValue(value);
  line.append(valueNode);
  return line;
}

function renderJsonLabel(label) {
  const labelNode = document.createElement("span");
  labelNode.className = Number.isInteger(Number(label)) && String(Number(label)) === String(label)
    ? "tree-index"
    : "tree-key";
  labelNode.textContent = `${label}:`;
  return labelNode;
}

function isJsonContainer(value) {
  return value !== null && typeof value === "object";
}

function getJsonType(value) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

function formatJsonLeafValue(value) {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === null) {
    return "null";
  }

  return String(value);
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
