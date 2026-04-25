const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function analyzeBill(billText) {
  const prompt = `You are an expert medical billing advocate with 20+ years of experience fighting overcharges, billing errors, and insurance denials.

Analyze this medical bill and provide:
1. BILLING ERRORS - List any suspicious charges, duplicate entries, upcoding, or incorrect billing codes
2. OVERCHARGES - Compare charges to fair market rates and flag anything 2x+ above normal
3. POTENTIAL SAVINGS - Estimate total recoverable amount
4. APPEAL LETTER - Write a professional, firm appeal letter the patient can send
5. NEXT STEPS - Clear action items ranked by priority

Medical Bill:
---
${billText}
---

Respond ONLY in this exact JSON format with no extra text:
{
  "summary": "2-3 sentence overview of what you found",
  "errors": [
    { "item": "charge name", "issue": "what is wrong", "amount": "dollar amount" }
  ],
  "overcharges": [
    { "item": "charge name", "billed": "amount billed", "fair_price": "fair market price", "difference": "overage amount" }
  ],
  "total_potential_savings": "total dollar amount",
  "severity": "low or medium or high or critical",
  "appeal_letter": "full professional appeal letter text here",
  "next_steps": ["step 1", "step 2", "step 3"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");

  return JSON.parse(jsonMatch[0]);
}

async function analyzeInsuranceDenial(denialText) {
  const prompt = `You are an expert insurance claims advocate. Analyze this insurance denial letter and help the patient fight back.

Denial Letter:
---
${denialText}
---

Respond ONLY in this exact JSON format with no extra text:
{
  "denial_reason": "plain English explanation of why denied",
  "is_wrongful": true,
  "wrongful_confidence": "75%",
  "appeal_arguments": ["argument 1", "argument 2", "argument 3"],
  "appeal_letter": "full professional appeal letter here",
  "escalation_steps": ["step 1 if appeal fails", "step 2", "step 3"],
  "win_probability": "65%",
  "summary": "2-3 sentence overview"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");

  return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeBill, analyzeInsuranceDenial };
