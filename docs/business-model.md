# Proactiva Business Model

**Date:** 2026-04-18
**Status:** Draft
**Author:** Dan Connolly + Claude

---

## 1. What Proactiva Is

Proactiva is a managed operations service that identifies and resolves operational waste ("the muddle") in mid-size organizations. We deploy AI-powered observation and autonomous agents that continuously monitor workflows, detect inefficiencies, and fix them — turning operational chaos into verified cost savings.

Revenue comes from a percentage of verified savings. Clients only pay more when they save more.

## 2. Target Market

**Primary vertical:** Mid-size companies with high operational coordination overhead.

| Segment | Why it fits | Employee range |
|---------|------------|----------------|
| Property management | Maintenance handoffs, vendor coordination, tenant communication, seasonal staffing | 15-150 |
| Agencies (marketing, creative, staffing) | Client handoffs, status meetings, duplicate reporting, scope creep | 10-80 |
| Logistics / distribution | Route coordination, dispatch, driver-warehouse handoffs, manual tracking | 20-200 |
| Multi-location retail | Inventory coordination, staff scheduling, vendor management across sites | 20-200 |

**Ideal client profile:**
- 15-200 employees
- Operations-heavy (not pure knowledge work)
- Multiple handoff points between teams/roles
- Owner or COO who acknowledges operational friction
- Not unionized (simplifies monitoring consent) — unionized later with legal framework

**Disqualifiers:**
- Fewer than 10 employees (not enough process to observe)
- Heavily regulated industries with strict data handling (healthcare, finance) — phase 2
- Fully remote with no shared tools (insufficient observation surface)

## 3. How It Works

### Phase 1: Diagnostic (Weeks 1-4)

A Proactiva analysis appliance is deployed at the client site. Lightweight observer agents are installed on key employees' machines (with written consent). The system watches and measures but changes nothing.

**Deliverable:** The Muddle Map — a detailed report of identified operational waste with dollar-cost estimates, prioritized by severity and fixability.

### Phase 2: Intervention (Months 2+)

Autonomous agents deploy against the highest-value muddle items. Examples:
- **Handoff Router** — Ensures maintenance requests, client tickets, or internal handoffs never drop between teams
- **Meeting Optimizer** — Replaces low-value status meetings with AI-generated async digests
- **Invoice Deduplicator** — Catches duplicate vendor invoices before payment
- **Context Switch Monitor** — Identifies and reduces unnecessary tool-switching patterns

### Phase 3: Continuous Monitoring

The system continues observing, catching new waste as it forms (new hires, new tools, process drift, seasonal changes). Monthly verification reports show ongoing savings against the signed baseline.

## 4. Revenue Model

### Fee Structure

```
DIAGNOSTIC PHASE (Weeks 1-4):
  If management contract signed: Diagnostic fee waived
  If no contract: $10,000 diagnostic fee
  
MANAGEMENT PHASE (12-month term, auto-renewing):
  25% of verified monthly cost savings
  Minimum monthly fee: $1,500 (credited against percentage)
  
  Example at $8,000/mo verified savings:
    25% = $2,000/mo → client pays $2,000
    
  Example at $4,000/mo verified savings:
    25% = $1,000/mo → minimum applies → client pays $1,500
```

### What was explicitly excluded and why

- **No "% of attributable new revenue."** Proving that operational improvements caused revenue growth is impossible. Clients will attribute growth to their own efforts. This line item generates disputes, not income. Dropped from the model.
- **No quarterly baseline reset.** Automatic resets look like fee-hunting. The baseline is the baseline for the contract term. Re-baselining only happens when the organization materially changes (acquisition, new department, major tool migration) and either party requests it.

### Unit Economics (Conservative)

Per client, first year:

| Item | Amount |
|------|--------|
| Revenue (minimum floor × 12) | $18,000 |
| Revenue (if avg savings = $6k/mo) | $18,000 (25% = $1,500, floor applies) |
| Revenue (if avg savings = $12k/mo) | $36,000 (25% = $3,000/mo) |
| Hardware cost | -$600 to -$1,400 |
| Deployment labor (12-20 hrs × $150) | -$1,800 to -$3,000 |
| Ongoing support (2-4 hrs/mo × $150) | -$3,600 to -$7,200 |
| **Net margin (floor scenario)** | **~$6,000 - $12,000** |
| **Net margin (good scenario)** | **~$24,000 - $30,000** |

**Breakeven:** 8-12 clients at the floor to support one founder. 5-6 clients at the good scenario.

### Revenue Longevity

The percentage model has a natural ceiling per client — once structural waste is fixed, savings flatten. The minimum monthly fee is the recurring floor that persists even in "quiet" months. Over time, the relationship should evolve:

- **Year 1:** Percentage of savings (high savings, Proactiva earns above minimum)
- **Year 2+:** Flat retainer (client converts to a predictable fee, Proactiva provides ongoing monitoring, new muddle detection, and agent maintenance)

Conversion to flat fee at renewal eliminates the verification overhead and makes revenue predictable for both sides. The year-1 percentage model is the wedge that gets you in the door; the flat retainer is the long-term business.

## 5. Verification Methodology

This is the most critical part of the model. Proactiva's revenue depends on verified savings. Both the measurement methodology and the trust model must be rigorous.

### Principle

**Measure what was. Measure what is. Show the delta. Use the client's own cost numbers.**

### Step 1: Baseline Establishment (Weeks 1-2)

During the first two weeks of the diagnostic phase, the observer system measures but does not intervene. This produces the baseline:

```
BASELINE METRICS (per muddle category):
  
  Time waste:
  - Hours/week in status meetings (calendar analysis + observation)
  - Average handoff duration (request created → acknowledged)
  - Context switches per hour per role
  
  Error/loss:
  - Tickets dropped or lost per month
  - Duplicate data entry events per week
  - Vendor invoice duplicates per month
  
  Dollar translation (CLIENT provides these rates):
  - Average loaded labor cost per hour, by role
  - Average cost to resolve a dropped ticket
  - Average duplicate invoice amount
```

**Both parties sign off on the baseline report.** This is the contractual reference point. No metric can be used for savings calculation unless it was included in the signed baseline.

### Step 2: Cost Translation Rules

Proactiva measures TIME and ERROR deltas. The CLIENT provides dollar rates. This separation is critical:

- Proactiva cannot inflate dollar values (they're the client's numbers)
- The client cannot dispute time measurements (they're from the observation system, auditable)
- Both parties agree on the translation formula before interventions begin

```
SAVINGS FORMULA:

  For time-based savings:
    hours_saved_per_week × client_hourly_rate × 4.33 = monthly_savings
    
  For error-based savings:
    errors_reduced_per_month × client_cost_per_error = monthly_savings
    
  Total verified savings = sum of all category savings
  Proactiva fee = max(total × 0.25, $1,500)
```

### Step 3: Monthly Verification Report

Delivered to the client by the 5th business day of each month:

```
┌──────────────────────────────┬──────────┬─────────┬──────────┬─────────────┐
│ Metric                       │ Baseline │ Current │ Delta    │ Savings     │
├──────────────────────────────┼──────────┼─────────┼──────────┼─────────────┤
│ Status meeting hours/wk      │ 18       │ 6       │ -12 hrs  │ $2,340/mo   │
│ Avg handoff time             │ 4.2 hrs  │ 0.8 hrs │ -3.4 hrs │ (incl above)│
│ Dropped tickets/mo           │ 12       │ 1       │ -11      │ $1,980/mo   │
│ Duplicate invoices/mo        │ 8        │ 0       │ -8       │ $960/mo     │
├──────────────────────────────┼──────────┼─────────┼──────────┼─────────────┤
│ TOTAL VERIFIED SAVINGS       │          │         │          │ $5,280/mo   │
│ Proactiva fee (25%)          │          │         │          │ $1,320/mo   │
│ Minimum applies              │          │         │          │ $1,500/mo   │
└──────────────────────────────┴──────────┴─────────┴──────────┴─────────────┘
```

### Step 4: Trust Mechanisms

1. **Raw data access.** The client dashboard shows the underlying observations — timestamps, event logs, before/after comparisons. Any number can be audited down to the source data.

2. **Dispute resolution.** If the client disputes a metric, both parties review the raw observation data. If disagreement persists, the disputed category is excluded from that month's calculation. Neither party has unilateral power over the numbers.

3. **Annual independent audit.** Client may hire a third party to review the methodology and numbers once per year, at their expense. Proactiva provides full data access for the audit. This signals confidence and builds trust.

4. **No self-serving measurements.** Proactiva never estimates dollar values. All dollar rates come from the client. Proactiva measures time and errors only.

### Re-Baselining

The initial baseline persists for the contract term. Re-baselining occurs ONLY when:
- The client's organization materially changes (acquisition, new department, 20%+ headcount change, major tool/system migration)
- Either party requests it with 30 days notice
- Both parties sign off on the new baseline

This prevents Proactiva from "finding new waste" to justify fees, while allowing legitimate resets when the organization genuinely changes.

## 6. Hardware Strategy

### Deployment Architecture

```
CLIENT MACHINES                    CLIENT SITE                 
┌─────────────────┐               ┌──────────────────────┐    
│ Observer Agent   │──────────────▶│ Analysis Appliance   │    
│ (software only)  │   local net   │ (Proactiva hardware) │    
│ screen capture   │               │ Gemma 4 26B local    │    
│ cross-platform   │               │ Agent orchestration  │    
└─────────────────┘               │ Dashboard served     │    
                                  └──────────┬───────────┘    
                                             │ (optional,     
                                             │  summaries     
                                             │  only)         
                                  ┌──────────▼───────────┐    
                                  │ Proactiva Cloud      │    
                                  │ Deep analysis        │    
                                  │ Multi-client mgmt    │    
                                  └──────────────────────┘    
```

**Key separation:** The observer agent on client machines is lightweight software (screen capture + stream to local appliance). All AI inference runs on the analysis appliance that Proactiva owns and controls. No LLM processing on employee machines.

This solves the cross-platform problem. The observer agent needs to capture screens on Windows, macOS, or Linux. The analysis appliance runs whatever OS Proactiva chooses.

### Hardware Options

| Device | Price | RAM | Best for | Notes |
|--------|-------|-----|----------|-------|
| **Mac Mini M4** | $599 | 16GB | R&D, self-testing, macOS clients | Current dev target. Good for Gemma 26B quantized. |
| **Mac Mini M4 Pro** | $1,399 | 48GB | Premium deployments | Runs Gemma 26B at higher quality. Best inference/watt. |
| **GMKtec EVO-X2 (Strix Halo)** | ~$1,200 | 96GB unified | Primary deployment target | AMD Ryzen AI Max+ 395. 96GB LPDDR5X accessible as VRAM. Runs 70B+ models. Linux/Windows. |
| **NVIDIA Jetson Orin Nano Super** | $249 | 8GB | Thin capture relay | Too small for 26B inference. Could serve as a low-cost network bridge if observer agents can't reach the main appliance directly. |
| **Beelink SER8** | ~$500 | 64GB DDR5 | Budget deployments | CPU inference only (8-15 tok/s for 8B models). Slow but cheap. |

### Recommended Deployment Tiers

**Tier 1 — Standard ($600-$1,200 hardware cost)**
Mac Mini M4 or GMKtec EVO-X2. Runs Gemma 26B locally. Handles 1-3 observer agents streaming to it. Suitable for 15-50 employee clients.

**Tier 2 — Premium ($1,200-$1,400 hardware cost)**
Mac Mini M4 Pro or EVO-X2 with full 96GB. Handles larger models, more concurrent observers, deeper analysis. Suitable for 50-200 employee clients.

**Tier 3 — Cloud-first ($0 hardware cost)**
No on-site appliance. Observer agents stream to Proactiva's cloud infrastructure. Lower privacy guarantees (data leaves the client site). Lower cost to deploy. For clients who don't want hardware on-premises or for initial pilots.

### Hardware Lifecycle

- Proactiva owns the hardware. Client does not purchase it.
- Hardware is pre-configured before shipping. Client plugs it in and connects to network.
- Remote management via SSH/VPN for updates, monitoring, troubleshooting.
- Hardware refresh every 3 years or at contract renewal.
- If client cancels: hardware is returned or remotely wiped.
- Spare units maintained for swap-outs (target: 48-hour replacement SLA).

## 7. Legal and Compliance Framework

### Employee Monitoring — Non-Negotiable Requirements

1. **Written notification.** Every monitored employee receives written notice describing what is captured, how it's used, how long it's retained, and who has access. Signed acknowledgment required before observer agent is installed.

2. **Visible capture indicator.** When the observer agent is active, a persistent on-screen indicator is visible. No silent monitoring.

3. **Excluded applications.** Employees or IT admins can exclude specific applications from capture (banking, personal email, messaging). Default exclusion list: password managers, banking apps, personal messaging.

4. **On-device PII redaction.** Before any captured frame is sent to the analysis appliance, a fast local PII scan runs. Detected sensitive content (passwords, financial data, personal messages in excluded apps) is blurred or the frame is dropped entirely.

5. **Data retention.** Raw frames: 7 days (configurable). Analysis summaries: duration of contract. Employees may request review of what has been captured from their machine.

6. **No keystroke logging.** Proactiva captures screen frames, not keystrokes. This is a firm boundary.

### Jurisdictional Requirements

| Jurisdiction | Key requirement | Status |
|-------------|----------------|--------|
| US — Federal | No federal law prohibiting employee monitoring with notice | Covered by notification requirement |
| US — Connecticut | Requires written notice before monitoring | Covered |
| US — Delaware | Requires written notice before monitoring | Covered |
| US — New York | Section 52-c requires notice of electronic monitoring | Covered |
| US — California | CCPA + constitutional privacy right. Stricter consent requirements. | Needs legal review per deployment |
| EU / GDPR | Employee consent insufficient (power imbalance). Requires "legitimate interest" + DPIA. | Phase 2. No EU deployments until legal framework is established. |
| Canada / PIPEDA | Similar to US notice requirements in most provinces. | Needs review per province |

**Pre-launch legal requirement:** Engage employment law counsel to review notification templates, consent forms, and the data processing framework before first client deployment. Budget: $5,000-$15,000.

### Contract Requirements

Every client agreement includes:
- Data Processing Addendum (DPA) defining what's captured, stored, and processed
- Employee Notification Template (client distributes to employees)
- Incident Response Procedure (what happens if PII is inadvertently captured/transmitted)
- Data Deletion Procedure (what happens at contract termination)

## 8. Competitive Positioning

### What exists today

| Competitor | What they do | Price | Gap Proactiva fills |
|-----------|-------------|-------|-------------------|
| ActivTrak, Hubstaff, Time Doctor | Employee activity monitoring | $5-15/user/mo | Observe only. No diagnosis. No remediation. |
| Celonis, UiPath Process Mining | Process mining from system logs | $50K+/year enterprise | Requires structured event logs. Doesn't work for unstructured work. |
| Management consultants | Manual observation + report | $20-50K one-time | One-time. No ongoing monitoring. No agents. |
| Macrohard / Digital Optimus | AI agent that does the work | Not yet available | Replaces workers. Proactiva helps workers by removing friction. |

### Proactiva's moat

The moat is NOT observation (commodity) or analysis (any LLM can do this). The moat is:

1. **Autonomous remediation agents** that actually fix the problems without human intervention. This is what monitoring tools and consultants cannot do.
2. **Continuous monitoring** that catches new waste as it forms. Consultants leave after the engagement.
3. **Verified savings methodology** that ties directly to revenue. Monitoring tools generate data; Proactiva generates provable financial outcomes.

### The "just give us the software" defense

Clients will eventually ask to run the system themselves. Defenses:

- The agents require continuous tuning as the organization changes. Proactiva's operational expertise is what makes them effective, not just the software.
- The verification methodology requires independence. Self-measurement is not credible for board reporting or budget justification.
- Over time, convert to flat retainer (see Revenue Longevity in section 4). Once on a retainer, the client is paying for ongoing managed operations, not a software license.

Long-term, the right answer may be to offer a self-hosted enterprise license at a higher price point for large organizations that insist. This is a year 3+ problem.

## 9. Go-to-Market Sequence

### Phase 0: Now — Build the product (Q2-Q3 2026)
- Implement the observer engine (vine-capture-audio, vine-capture-vision, vine-dsp, vine-observer) in wildvine-os
- Build cross-platform observer agent (screen capture daemon for Windows + macOS)
- Connect the Proactiva dashboard to real observation data via vine-gateway
- Deploy on own workflows first (Dan is the first case study)
- Legal review of monitoring framework

### Phase 1: First client (Q3-Q4 2026)
- Source through personal network. Property management or agency in the Portland/Seattle area.
- Free diagnostic. Prove the Muddle Map has value.
- Convert to management contract if diagnostic is compelling.
- Document everything — this becomes the case study for all future sales.

### Phase 2: Repeatable sales (Q1-Q2 2027)
- Standardize deployment process (pre-configured appliances, templated observer agent install)
- Build 3-5 case studies from early clients
- Outbound sales motion: cold outreach with specific, vertical-tailored hooks
- Target: 8-12 clients by end of Q2 2027

### Phase 3: Scale (H2 2027+)
- Hire first operations/deployment person
- Evaluate channel partnerships (property management associations, industry groups)
- Consider flat-fee retainer conversion for year-2 renewals
- Begin Windows observer agent development if not already done

## 10. Open Questions

These need answers before first deployment:

1. **Insurance.** What errors & omissions coverage is needed? What about cyber liability insurance given we're handling client operational data?
2. **Entity structure.** Is Proactiva an LLC? Corp? What state? Tax implications of hardware deployment across state lines.
3. **Intellectual property.** Who owns the muddle analysis, agent configurations, and remediation playbooks developed for a specific client?
4. **Pricing sensitivity testing.** Is $1,500/mo minimum too high for a 15-person property management company? Too low for a 200-person logistics firm? Need tiered minimums by company size.
5. **Observer agent distribution.** How does the lightweight screen capture agent get installed on client machines? MSI package? MDM push? Manual install? This is a deployment friction point.
6. **Network topology.** How does the observer agent on a client machine communicate with the analysis appliance? Local network only? VPN? What about remote employees?
