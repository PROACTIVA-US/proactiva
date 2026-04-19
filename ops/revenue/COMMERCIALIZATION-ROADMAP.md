# Proactiva Commercialization Roadmap

Last updated: 2026-04-14

## Purpose

This is the long-term operating task list for turning Proactiva into a revenue-producing company.

The goal is not to build a polished platform first. The goal is to sell and deliver measurable cost-savings work, collect money cleanly, capture proof, and convert repeatable wins into replication packs.

## Commercial Thesis

Proactiva sells relief from operational muddle.

The first commercial motion is:

1. find a workflow with measurable waste,
2. define the baseline cost,
3. implement a focused intervention,
4. verify savings,
5. charge a percentage of verified savings.

The operating system underneath this is Wildvine OS. The customer-facing company is Proactiva.

## Operating Principles

- Revenue before platform polish.
- Narrow scope before broad automation.
- Human-approved outreach before autonomous outreach.
- Attorney-reviewed contracts before paid client work.
- Measured savings before savings-share invoices.
- Every delivery creates a reusable replication pack.
- Every client-facing claim needs evidence.

## Phase 0: Business Foundation

Goal: make Proactiva able to safely enter a first paid engagement.

Required tasks:

| Task | Status | Owner | Notes |
| --- | --- | --- | --- |
| Decide legal entity name and operating name | Pending | Operator | Confirm whether Proactiva is a new entity, DBA, or project under an existing entity. |
| Confirm domain plan for `proactiva.us` | Pending | Operator | Buy domain, route DNS, and attach email before broad outreach. |
| Set up business email | Pending | Operator | Use a domain email for outreach, contract signatures, and Stripe. |
| Set up business bank account | Pending | Operator | Needed before Stripe live payouts. |
| Decide bookkeeping system | Pending | Operator | QuickBooks, Xero, or equivalent. |
| Create basic chart of accounts | Pending | Operator | Track discovery fees, implementation fees, savings-share revenue, software costs, contractor costs. |
| Create operating folder for signed client records | Pending | Operator | Keep signed agreements, invoices, evidence, and delivery artifacts per client. |
| Define data retention policy | Pending | Operator + Counsel | Especially important if clients share operational records. |

Done criteria:

- Proactiva can sign an agreement, receive funds, issue invoices, and store client evidence without improvising.

## Phase 1: Offer and Sales Motion

Goal: get to the first credible discovery conversation and first paid pilot.

Required tasks:

| Task | Status | Owner | Notes |
| --- | --- | --- | --- |
| Keep the first niche narrow | Active | Operator | Current hypothesis: property management operations. |
| Build a 25-lead list with verified pain signals | Pending | Wildvine + Operator | No invented contacts or assumed savings. |
| Draft 10 human-approved outreach messages | Pending | Wildvine | Operator sends only after review. |
| Create a one-page savings audit offer | Pending | Wildvine | Use plain language: diagnose muddle, model savings, propose smallest fix. |
| Define discovery fee policy | Pending | Operator | Options: free first call, paid audit, or refundable diagnostic credit. |
| Define pilot qualification rules | Pending | Operator | Only accept work with measurable baseline, decision-maker access, and data access. |
| Create proposal template | Pending | Wildvine + Counsel | Should map discovery output to scope, metric, fee, and measurement period. |

Done criteria:

- 10 targeted messages are ready to send.
- One prospect can receive a coherent audit offer.
- A qualified prospect can move from call to proposal without new invention.

## Phase 2: Contract Stack

Goal: have a contract path for discovery, implementation, savings-share, and data access.

These documents should be drafted internally first, then reviewed by counsel before use with a paying client.

Core contract documents:

| Document | Priority | Status | Purpose |
| --- | --- | --- | --- |
| Mutual NDA | P1 | Pending | Protect client operational data and Proactiva methods during discovery. |
| Discovery / Savings Audit Agreement | P1 | Pending | Covers paid or unpaid diagnosis, limited access, deliverables, and no guarantee. |
| Master Services Agreement | P1 | Pending | Baseline commercial terms across engagements. |
| Statement of Work | P1 | Pending | Names the workflow, scope, timeline, deliverables, and acceptance criteria. |
| Savings-Share Schedule | P1 | Draft exists | Defines baseline, measurement period, exclusions, fee percentage, verification, and payment timing. |
| Data Processing Addendum | P2 | Pending | Needed if client data includes personal information or regulated records. |
| Data Access and Security Exhibit | P2 | Pending | Defines least-privilege access, systems touched, data handling, and offboarding. |
| AI Use Disclosure | P2 | Pending | Explains what AI tools may be used, what is not sent to third-party models, and approval boundaries. |
| Change Order Template | P2 | Pending | Keeps scope changes explicit. |
| Case Study Release | P3 | Pending | Allows use of anonymized or named results after approval. |

Savings-share terms to resolve with counsel:

- What counts as verified savings.
- Who calculates the baseline.
- What data is authoritative.
- Which changes are excluded from savings.
- Whether savings are gross, net, or labor-hour-equivalent.
- Fee percentage and duration.
- Audit rights if numbers are disputed.
- Payment due date after verification.
- Cap, floor, or success threshold.
- Termination rights and earned-fee survival.

Done criteria:

- A first client can sign NDA, discovery terms, SOW, and savings-share schedule without custom drafting from scratch.

## Phase 3: Stripe and Money Movement

Goal: collect money without building billing infrastructure too early.

Recommended v0 Stripe posture:

- Use Stripe Payment Links for simple fixed fees such as a paid diagnostic or setup fee.
- Use Stripe Invoicing for custom implementation fees and savings-share invoices.
- Use Stripe Billing later for recurring retainers, subscriptions, or replication-pack access.
- Use a custom Checkout integration only when the Proactiva site needs embedded purchase or account flows.

Official Stripe references:

- Payment Links: <https://docs.stripe.com/payments/payment-links>
- Checkout: <https://docs.stripe.com/payments/checkout>
- Invoicing: <https://docs.stripe.com/invoicing>
- Billing: <https://docs.stripe.com/billing>
- Tax: <https://docs.stripe.com/tax>

Setup tasks:

| Task | Status | Owner | Notes |
| --- | --- | --- | --- |
| Create Stripe account | Pending | Operator | Use Proactiva legal/business details when finalized. |
| Complete identity and bank verification | Pending | Operator | Required for live payments and payouts. |
| Configure statement descriptor | Pending | Operator | Should clearly say Proactiva. |
| Configure customer email receipts | Pending | Operator | Keep professional receipts for all payments. |
| Create discovery/audit product | Pending | Operator | Example: fixed diagnostic fee if chosen. |
| Create implementation/setup product | Pending | Operator | Can be invoiced manually at first. |
| Create savings-share invoice process | Pending | Operator | Manual invoice against verified savings report; do not automate until formula is battle-tested. |
| Decide tax handling | Pending | Operator + Accountant | Configure Stripe Tax only after tax obligations are understood. |
| Connect bookkeeping | Pending | Operator | Stripe to accounting system or manual monthly export. |
| Create refund and dispute policy | Pending | Operator + Counsel | Especially for diagnostic fees. |
| Keep API keys out of repo and plist files | Active | Wildvine | Stripe keys must live only in secret storage or `.env`. |

Done criteria:

- Proactiva can collect a diagnostic fee or issue a custom invoice.
- Savings-share invoices are tied to a signed verification report.
- Stripe keys are never committed or placed in launchd plists.

## Phase 4: Website, Intake, and CRM

Goal: make the public surface credible enough to support founder-led sales.

Required pages for `Proactiva.us`:

| Page | Status | Purpose |
| --- | --- | --- |
| Home | Pending | State the savings-first offer clearly. |
| Savings Audit | Pending | Explain the first engagement and expected output. |
| Replication Packs | Pending | Show examples of repeatable muddle patterns. |
| About | Pending | Founder/operator credibility without overclaiming. |
| Contact / Intake | Pending | Capture qualified leads into a durable record. |

CRM tasks:

| Task | Status | Owner | Notes |
| --- | --- | --- | --- |
| Choose CRM source of truth | Pending | Operator | Start with markdown/CSV if needed; avoid heavy CRM setup before leads exist. |
| Define lead stages | Pending | Wildvine | Suggested: identified, researched, drafted, sent, replied, discovery, proposed, won, lost. |
| Define required lead fields | Active | Wildvine | Organization, pain signal, source URL, contact path, next step. |
| Add intake-to-lead workflow | Pending | Wildvine | Site form should create or append a lead record. |
| Add follow-up reminders | Pending | Wildvine | Use Wildvine heartbeat first; external CRM later if needed. |

Done criteria:

- A prospect can understand the offer, request contact, and become a tracked lead.

## Phase 5: Delivery System

Goal: fulfill the first engagement repeatably and defensibly.

Required delivery artifacts:

| Artifact | Status | Purpose |
| --- | --- | --- |
| Discovery call guide | Active | Diagnose workflow, baseline, savings metric, decision process. |
| Muddle map template | Pending | Visual or structured map of current workflow failure. |
| Baseline evidence checklist | Pending | What numbers, screenshots, exports, or logs prove the current cost. |
| Savings model | Pending | Calculates current cost, expected savings, confidence, and assumptions. |
| Intervention plan | Pending | Smallest concrete workflow fix. |
| Implementation log | Pending | Records changes made, dates, owners, and evidence. |
| Verification report | Pending | Compares baseline to post-change result. |
| Client handoff packet | Pending | Summarizes what changed and how to maintain it. |

Delivery gates:

1. Do not propose savings-share unless the baseline can be measured.
2. Do not start implementation without signed scope.
3. Do not invoice savings-share without a verification report.
4. Do not turn a fix into a replication pack until it worked once.

Done criteria:

- A client engagement can move from discovery to verification with an artifact at each step.

## Phase 6: Replication Packs

Goal: convert delivery work into reusable assets.

First pack candidates:

| Pack | Status | Trigger |
| --- | --- | --- |
| Lead-response cleanup | Pending | Slow or inconsistent follow-up costs revenue. |
| Intake and triage | Pending | Requests arrive from many channels and are mishandled. |
| Internal handoff | Pending | Work stalls between sales, operations, and delivery. |
| Invoice and collections | Pending | Cash leaks through late billing or weak follow-up. |
| Meeting-to-action | Pending | Decisions are made but not converted into owned next actions. |

Pack lifecycle:

1. Draft from known muddle pattern.
2. Test manually on one real workflow.
3. Measure before and after.
4. Write failure modes.
5. Package templates, scripts, prompts, and checklist.
6. Use in second similar engagement.
7. Only then consider productizing.

Done criteria:

- One pack can be delivered by another operator using the written materials.

## Phase 7: Wildvine Automation

Goal: let Wildvine OS drive the repeatable work while the operator keeps approval over risk.

Automation task list:

| Task | Status | Owner | Notes |
| --- | --- | --- | --- |
| Proactiva revenue skill reads this roadmap | Active | Wildvine | Skill reads `commercialization-status.md` each cycle and opens the full roadmap only when needed. |
| Add commercialization status file | Active | Wildvine | One file summarizes current phase, blockers, and next commercial tasks. |
| Add lead research guardrails | Active | Wildvine | No fabricated lead data or guessed contact details. |
| Add contract artifact checklist | Pending | Wildvine | Warn when a client is moving forward without required documents. |
| Add Stripe readiness checklist | Pending | Wildvine | Warn before paid work if Stripe/bank/accounting are incomplete. |
| Add client delivery ledger | Pending | Wildvine | Track discovery, proposal, signed docs, baseline, implementation, verification, invoice. |
| Add replication-pack promotion rule | Pending | Wildvine | When verification succeeds, create or update a pack. |

Done criteria:

- Vinemaster can tell what commercialization task is next without asking the operator.

## Phase 8: Risk, Security, and Compliance

Goal: avoid preventable failures while working with client data.

Required policies:

| Policy | Status | Notes |
| --- | --- | --- |
| Confidentiality policy | Pending | Covers client data and internal methods. |
| AI provider data policy | Pending | Defines which data may go to which model or API. |
| Access control policy | Pending | Least privilege, named users, revocation, password manager. |
| Incident response note | Pending | What to do if client data is exposed or a tool misbehaves. |
| Backup and retention policy | Pending | How long client data and evidence are kept. |
| Insurance review | Pending | Consider E&O, cyber, and general liability before larger clients. |

Done criteria:

- A cautious client can ask how Proactiva handles data and receive a coherent answer.

## Phase 9: Growth and Productization

Goal: scale only after the manual service motion proves repeatable.

Milestones:

| Milestone | Condition |
| --- | --- |
| First paid diagnostic | One client pays or commits to a defined audit. |
| First savings-share pilot | One client signs scope and savings-share terms. |
| First verified savings invoice | Savings are measured and invoiced. |
| First replication pack | One successful fix is packaged. |
| Second use of same pack | The same pack works for another client. |
| Public case study | Client approves anonymized or named results. |
| Subscription experiment | A pack or monitoring service has repeated demand. |
| Contractor handoff | Another operator can deliver from the pack. |

Do not build a SaaS platform until at least one replication pack has worked twice.

## Current Priority Stack

P0 this week:

1. Confirm the first market wedge: property management or another niche.
2. Build one verified lead with a real pain signal and contact path.
3. Draft the savings audit one-pager.
4. Decide whether the first diagnostic is free, paid, or credited against implementation.
5. Draft the NDA, discovery agreement, and SOW outline for counsel review.

P1 after first serious prospect:

1. Finalize Stripe account and bank connection.
2. Create diagnostic fee Payment Link if using paid audit.
3. Create invoice template for setup or implementation fees.
4. Create baseline evidence checklist.
5. Create savings verification report template.

P2 after first signed pilot:

1. Complete implementation log.
2. Produce verification report.
3. Issue first savings-share invoice.
4. Convert the work into a replication pack.
5. Capture testimonial or case study permission.

## Open Decisions

- Legal structure for Proactiva.
- First niche after one or two lead tests.
- Free versus paid diagnostic.
- Initial savings-share percentage range.
- Whether implementation fees are optional, required, or credited.
- Which client data can be processed locally versus with third-party AI providers.
- Whether Stripe is enough for v0 billing or whether accounting software should issue invoices.

## Definition of Commercial Readiness

Proactiva is commercially ready when:

- a prospect can find the site,
- a lead can be captured,
- a discovery call can be run,
- a proposal can be generated,
- contracts can be signed,
- money can be collected,
- delivery can be tracked,
- savings can be verified,
- an invoice can be issued,
- the result can become a replication pack.
