const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzeBill(billText) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert medical billing advocate with 20+ years of experience fighting overcharges, billing errors, and insurance denials.

Analyze this medical bill and provide:

1. BILLING ERRORS - List any suspicious charges, duplicate entries, upcoding, or incorrect billing codes
2. OVERCHARGES - Compare charges to fair market rates and flag anything 2x+ above normal
3. POTENTIAL SAVINGS - Estimate total recoverable amount
4. APPEAL LETTER - Write a professional, firm appeal letter the patient can send to the hospital/insurance company
5. NEXT STEPS - Clear action items ranked by priority

Medical Bill Text:
---
${billText}
---

Respond in this exact JSON format:
{
  "summary": "2-3 sentence overview of what you found",
  "errors": [
    { "item": "charge name", "issue": "what is wrong", "amount": "dollar amount" }
  ],
  "overcharges": [
    { "item": "charge name", "billed": "amount billed", "fair_price": "fair market price", "difference": "overage amount" }
  ],
  "total_potential_savings": "total dollar amount",
  "severity": "low | medium | high | critical",
  "appeal_letter": "full professional appeal letter text",
  "next_steps": ["step 1", "step 2", "step 3"]
}`,
      },
    ],
  });

  const text = response.content[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");

  return JSON.parse(jsonMatch[0]);
}

async function analyzeInsuranceDenial(denialText) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert insurance claims advocate. Analyze this insurance denial letter and help the patient fight back.

Denial Letter:
---
${denialText}
---

Provide:
1. Why they denied it (in plain English)
2. Whether this denial is likely valid or wrongful
3. The strongest arguments to appeal
4. A complete appeal letter
5. Escalation path if first appeal fails

Respond in this exact JSON format:
{
  "denial_reason": "plain English explanation of why denied",
  "is_wrongful": true or false,
  "wrongful_confidence": "percentage like 75%",
  "appeal_arguments": ["argument 1", "argument 2", "argument 3"],
  "appeal_letter": "full professional appeal letter",
  "escalation_steps": ["step 1 if appeal fails", "step 2", "step 3"],
  "win_probability": "percentage chance of winning appeal",
  "summary": "2-3 sentence overview"
}`,
      },
    ],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");

  return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeBill, analyzeInsuranceDenial };
