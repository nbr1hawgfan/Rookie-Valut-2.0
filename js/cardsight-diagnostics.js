
import * as CardSightSdk from "https://esm.sh/cardsightai@3.6.0";

const KEY = "rookie-vault-cardsight-api-key";
const runButton = document.querySelector("#runCardSightDiagnosticsButton");
const copyButton = document.querySelector("#copyCardSightDiagnosticsButton");
const clearButton = document.querySelector("#clearCardSightDiagnosticsButton");
const results = document.querySelector("#cardSightDiagnosticResults");
const rawDetails = document.querySelector("#cardSightRawDiagnostics");
const rawText = document.querySelector("#cardSightRawDiagnosticsText");
const message = document.querySelector("#cardSightMessage");

let latestReport = null;

runButton?.addEventListener("click", runDiagnostics);
copyButton?.addEventListener("click", copyReport);
clearButton?.addEventListener("click", clearReport);

async function runDiagnostics() {
  const apiKey = localStorage.getItem(KEY) || "";

  results.replaceChildren();
  rawDetails.classList.add("hidden");
  copyButton.classList.add("hidden");
  clearButton.classList.add("hidden");
  runButton.disabled = true;
  runButton.textContent = "Testing...";

  const report = {
    generatedAt: new Date().toISOString(),
    online: navigator.onLine,
    page: window.location.href,
    userAgent: navigator.userAgent,
    tests: []
  };

  if (!apiKey) {
    addFinishedRow("Saved API key", "fail", "No CardSight API key is saved on this device.", 0);
    report.tests.push({ label: "Saved API key", status: "fail", message: "No saved key." });
    finish(report);
    return;
  }

  let client;
  try {
    client = new CardSightSdk.CardSightAI({ apiKey, timeout: 25000 });
    addFinishedRow("SDK and client", "pass", "CardSight SDK loaded and the API client was created.", 0);
    report.tests.push({
      label: "SDK and client",
      status: "pass",
      exportedSdkKeys: Object.keys(CardSightSdk).sort()
    });
  } catch (error) {
    const text = explainError(error);
    addFinishedRow("SDK and client", "fail", text, 0);
    report.tests.push({ label: "SDK and client", status: "fail", error: serializeError(error) });
    finish(report);
    return;
  }

  const tests = [
    ["Public API health", async () => {
      const response = await client.health.check();
      return {
        status: response?.data ? "pass" : "warn",
        message: response?.data ? "CardSight API is online and responding." : "Health request returned no data.",
        data: sanitize(response)
      };
    }],
    ["API key authentication", async () => {
      const response = await client.health.checkAuth();
      return {
        status: response?.data ? "pass" : "warn",
        message: response?.data ? "CardSight accepted the saved API key." : "Authenticated health request returned no data.",
        data: sanitize(response)
      };
    }],
    ["Account and usage", async () => {
      const response = await client.subscription.get();
      return {
        status: response?.data ? "pass" : "warn",
        message: response?.data ? subscriptionMessage(response.data) : "No subscription or usage information returned.",
        data: sanitize(response)
      };
    }],
    ["Known autocomplete query", async () => {
      const response = await client.autocomplete.cards("Aaron Judge");
      const values = Array.isArray(response?.data)
        ? response.data
        : response?.data?.suggestions || [];
      return {
        status: values.length ? "pass" : "fail",
        message: values.length
          ? `Received ${values.length} suggestion${values.length === 1 ? "" : "s"} for Aaron Judge.`
          : "The API request completed but returned zero Aaron Judge suggestions.",
        data: sanitize(response)
      };
    }],
    ["Known catalog search", async () => {
      const response = await client.catalog.search({ q: "Aaron Judge", take: 5, skip: 0 });
      const values = response?.data?.results || (Array.isArray(response?.data) ? response.data : []);
      return {
        status: values.length ? "pass" : "fail",
        message: values.length
          ? `Received ${values.length} catalog result${values.length === 1 ? "" : "s"} for Aaron Judge.`
          : "The catalog request completed but returned zero Aaron Judge results.",
        data: sanitize(response)
      };
    }]
  ];

  const frontFile = document.querySelector("#scanFrontInput")?.files?.[0];
  if (frontFile) {
    tests.push(["Current photo detection", async () => {
      const response = await client.detect.card(frontFile);
      const detected = Boolean(response?.data?.detected || Number(response?.data?.count || 0) > 0);
      return {
        status: detected ? "pass" : "warn",
        message: detected
          ? `The service detected ${response?.data?.count || 1} card${Number(response?.data?.count || 1) === 1 ? "" : "s"} in the selected photo.`
          : "The API responded, but did not detect a card in the selected photo.",
        data: sanitize(response)
      };
    }]);
  }

  for (const [label, test] of tests) {
    const row = addPendingRow(label);
    const started = performance.now();

    try {
      const result = await withTimeout(test(), 25000);
      const ms = Math.round(performance.now() - started);
      finishRow(row, result.status, result.message, ms);
      report.tests.push({ label, durationMs: ms, ...result });
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      const text = explainError(error);
      finishRow(row, "fail", text, ms);
      report.tests.push({ label, status: "fail", durationMs: ms, error: serializeError(error) });
    }
  }

  finish(report);
}

function addPendingRow(label) {
  const row = document.createElement("article");
  row.className = "diagnostic-row pending";
  row.innerHTML = `
    <span class="diagnostic-icon">…</span>
    <div class="diagnostic-copy"><strong></strong><span>Running...</span></div>
    <span class="diagnostic-duration"></span>`;
  row.querySelector("strong").textContent = label;
  results.append(row);
  return row;
}

function addFinishedRow(label, status, text, ms) {
  const row = addPendingRow(label);
  finishRow(row, status, text, ms);
}

function finishRow(row, status, text, ms) {
  row.className = `diagnostic-row ${status}`;
  row.querySelector(".diagnostic-icon").textContent =
    status === "pass" ? "✓" : status === "warn" ? "!" : "×";
  row.querySelector(".diagnostic-copy span").textContent = text;
  row.querySelector(".diagnostic-duration").textContent = `${ms} ms`;
}

function finish(report) {
  latestReport = report;
  const failures = report.tests.filter(test => test.status === "fail").length;
  const warnings = report.tests.filter(test => test.status === "warn").length;
  const passes = report.tests.filter(test => test.status === "pass").length;
  report.summary = { passes, warnings, failures };

  rawText.textContent = JSON.stringify(report, null, 2);
  rawDetails.classList.remove("hidden");
  copyButton.classList.remove("hidden");
  clearButton.classList.remove("hidden");
  runButton.disabled = false;
  runButton.textContent = "Run diagnostics";

  message.textContent = failures
    ? `Diagnostics found ${failures} failed test${failures === 1 ? "" : "s"}.`
    : warnings
      ? `Diagnostics completed: ${passes} passed and ${warnings} need attention.`
      : `All ${passes} CardSight tests passed.`;
}

function clearReport() {
  latestReport = null;
  results.replaceChildren();
  rawText.textContent = "";
  rawDetails.classList.add("hidden");
  copyButton.classList.add("hidden");
  clearButton.classList.add("hidden");
}

async function copyReport() {
  if (!latestReport) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(latestReport, null, 2));
    message.textContent = "Diagnostic report copied.";
  } catch {
    rawDetails.open = true;
    message.textContent = "Technical details opened for manual copying.";
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000} seconds.`)), ms)
    )
  ]);
}

function explainError(error) {
  const status = error?.status || error?.response?.status || null;
  const text = error?.message || error?.response?.statusText || "Unknown error.";

  if (status === 401 || status === 403) {
    return `API key rejected (HTTP ${status}). The saved key is invalid, expired, or lacks access.`;
  }
  if (status === 429) {
    return "Usage or rate limit reached (HTTP 429). Check monthly CardSight usage.";
  }
  if (status >= 500) {
    return `CardSight server error (HTTP ${status}).`;
  }
  if (/fetch|network|cors/i.test(text)) {
    return `Browser/network request failed: ${text}`;
  }
  return status ? `${text} (HTTP ${status})` : text;
}

function serializeError(error) {
  return {
    name: error?.name || null,
    message: error?.message || String(error),
    status: error?.status || error?.response?.status || null,
    code: error?.code || null
  };
}

function sanitize(value, depth = 0) {
  if (depth > 5) return "[maximum depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 1500 ? value.slice(0, 1500) + "…" : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 12).map(item => sanitize(item, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = /api.?key|authorization|token|secret/i.test(key)
        ? "[redacted]"
        : sanitize(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

function subscriptionMessage(data) {
  const plan = data.plan?.name || data.plan_name || data.tier || data.subscription?.plan || "account";
  const used = data.usage?.used ?? data.calls_used ?? data.current_usage ?? null;
  const limit = data.usage?.limit ?? data.calls_limit ?? data.monthly_limit ?? null;
  return used !== null && limit !== null
    ? `${plan} access is active. Usage: ${used} of ${limit} calls.`
    : `${plan} access information returned successfully.`;
}
