let currentMode = "bill";
let selectedFile = null;

const modeButtons   = document.querySelectorAll(".mode-btn");
const uploadBox     = document.getElementById("uploadBox");
const fileInput     = document.getElementById("fileInput");
const billText      = document.getElementById("billText");
const analyzeBtn    = document.getElementById("analyzeBtn");
const btnText       = document.getElementById("btnText");
const btnLoader     = document.getElementById("btnLoader");
const resultsSection = document.getElementById("results");
const resetBtn      = document.getElementById("resetBtn");

// Mode switching
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    billText.placeholder = currentMode === "bill"
      ? "Paste your medical bill here..."
      : "Paste your insurance denial letter here...";
    hideResults();
  });
});

// Drag & drop
uploadBox.addEventListener("dragover", e => { e.preventDefault(); uploadBox.classList.add("dragover"); });
uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
uploadBox.addEventListener("drop", e => {
  e.preventDefault();
  uploadBox.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
uploadBox.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

function handleFile(file) {
  selectedFile = file;
  uploadBox.querySelector("p").textContent = `✅ Selected: ${file.name}`;
  uploadBox.style.borderColor = "#2563eb";
  uploadBox.style.background = "#eff6ff";
}

// Analyze
analyzeBtn.addEventListener("click", async () => {
  const text = billText.value.trim();
  if (!selectedFile && !text) {
    alert("Please upload a file or paste your bill text.");
    return;
  }

  setLoading(true);

  try {
    const formData = new FormData();
    if (selectedFile) {
      formData.append("file", selectedFile);
    } else {
      formData.append("text", text);
    }

    const endpoint = currentMode === "bill" ? "/api/analyze/bill" : "/api/analyze/denial";
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const json = await res.json();

    if (!res.ok || !json.success) throw new Error(json.error || "Analysis failed");

    displayResults(json.data);
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    setLoading(false);
  }
});

function setLoading(loading) {
  analyzeBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoader.hidden = !loading;
}

function displayResults(data) {
  hideResults();

  // Summary header
  const severity = data.severity || "medium";
  const badge = document.getElementById("severityBadge");
  badge.className = `severity-badge severity-${severity}`;
  badge.textContent = severity === "critical" ? "🚨 Critical Issues Found"
    : severity === "high"   ? "⚠️ High Severity"
    : severity === "medium" ? "🔶 Issues Found"
    : "✅ Low Severity";

  document.getElementById("resultTitle").textContent =
    currentMode === "bill" ? "Bill Analysis Complete" : "Denial Analysis Complete";
  document.getElementById("resultSummary").textContent = data.summary;

  if (currentMode === "bill") {
    showBillResults(data);
  } else {
    showDenialResults(data);
  }

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

function showBillResults(data) {
  if (data.total_potential_savings && data.total_potential_savings !== "$0") {
    document.getElementById("savingsAmount").textContent = data.total_potential_savings;
    document.getElementById("savingsBox").hidden = false;
  }

  if (data.errors && data.errors.length > 0) {
    const list = document.getElementById("errorsList");
    list.innerHTML = data.errors.map(e => `
      <div class="error-item">
        <strong>${e.item}</strong>
        <p>${e.issue}</p>
        <span class="amount">${e.amount}</span>
      </div>`).join("");
    document.getElementById("errorsCard").hidden = false;
  }

  if (data.overcharges && data.overcharges.length > 0) {
    const list = document.getElementById("overchargesList");
    list.innerHTML = data.overcharges.map(o => `
      <div class="overcharge-item">
        <strong>${o.item}</strong>
        <p>Billed: <strong>${o.billed}</strong> → Fair price: <strong>${o.fair_price}</strong></p>
        <span class="amount">Overcharge: ${o.difference}</span>
      </div>`).join("");
    document.getElementById("overchargesCard").hidden = false;
  }

  if (data.next_steps) {
    document.getElementById("nextStepsList").innerHTML =
      data.next_steps.map(s => `<li>${s}</li>`).join("");
  }

  document.getElementById("billAppealLetter").textContent = data.appeal_letter;

  document.getElementById("copyBillLetter").addEventListener("click", () => {
    copyText(data.appeal_letter, document.getElementById("copyBillLetter"));
  });

  document.getElementById("billResults").hidden = false;
}

function showDenialResults(data) {
  document.getElementById("denialReason").textContent = data.denial_reason;
  document.getElementById("winProbability").textContent = data.win_probability;
  document.getElementById("wrongfulDenial").textContent = data.is_wrongful ? "Yes — Fight It" : "Possibly Valid";
  document.getElementById("wrongfulDenial").style.color = data.is_wrongful ? "#16a34a" : "#d97706";
  document.getElementById("wrongfulConfidence").textContent = data.wrongful_confidence;

  if (data.appeal_arguments) {
    document.getElementById("appealArguments").innerHTML =
      data.appeal_arguments.map(a => `<li>${a}</li>`).join("");
  }

  if (data.escalation_steps) {
    document.getElementById("escalationSteps").innerHTML =
      data.escalation_steps.map(s => `<li>${s}</li>`).join("");
  }

  document.getElementById("denialAppealLetter").textContent = data.appeal_letter;

  document.getElementById("copyDenialLetter").addEventListener("click", () => {
    copyText(data.appeal_letter, document.getElementById("copyDenialLetter"));
  });

  document.getElementById("denialResults").hidden = false;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "✅ Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy Letter";
      btn.classList.remove("copied");
    }, 2000);
  });
}

function hideResults() {
  resultsSection.hidden = true;
  document.getElementById("savingsBox").hidden = true;
  document.getElementById("errorsCard").hidden = true;
  document.getElementById("overchargesCard").hidden = true;
  document.getElementById("billResults").hidden = true;
  document.getElementById("denialResults").hidden = true;
}

resetBtn.addEventListener("click", () => {
  hideResults();
  billText.value = "";
  selectedFile = null;
  fileInput.value = "";
  uploadBox.querySelector("p").innerHTML = `Drop your bill here or <label for="fileInput" class="file-label">browse file</label>`;
  uploadBox.style.borderColor = "";
  uploadBox.style.background = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});
