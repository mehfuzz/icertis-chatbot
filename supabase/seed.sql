-- ============================================================
-- Seed: Sample Custom Q&A pairs for ICM and Oracle Fusion
-- Run AFTER schema.sql and AFTER you have the app running
-- (embeddings must be generated via the /api/custom-queries POST endpoint)
--
-- These are PLACEHOLDER entries without embeddings.
-- To activate: use the Admin UI → Custom Q&A to add these with embeddings,
-- OR call the POST /api/custom-queries endpoint for each entry.
-- ============================================================

-- The INSERT below is for reference/documentation only.
-- Real entries must go through the API to get query_embedding generated.

/*
Example queries to add via Admin UI (Custom Q&A → Add Q&A):

MODULE: ICM (Icertis Contract Management)
=========================================

Q: How to create a contract in Icertis?
A: To create a contract in Icertis Contract Management:
   1. Log into the ICM portal at your organization's URL
   2. Navigate to Contracts > Create Contract
   3. Select the contract type (e.g., Vendor Agreement, NDA, MSA)
   4. Fill in mandatory fields: Contract Name, Counterparty, Start Date, End Date
   5. Select the applicable clause library or template
   6. Add contract parties and their roles
   7. Upload supporting documents if required
   8. Submit for approval workflow
   9. The contract will route to the designated approvers based on your organization's workflow rules
   Note: Ensure you have "Contract Creator" role to initiate contracts.

Q: What approval levels are needed for a high-value contract in Icertis?
A: High-value contracts in Icertis follow a tiered approval workflow:
   - Contracts up to ₹10 Lakhs: Category Manager approval
   - ₹10 Lakhs to ₹1 Crore: Procurement Head approval
   - Above ₹1 Crore: CFO + Legal approval required
   All contracts above ₹50 Lakhs also require Legal review before approval.
   To check the workflow for your specific contract value, go to ICM > Admin > Workflow Configuration.

MODULE: Oracle Fusion ERP
=========================

Q: Why is my PO stuck in approval in Oracle Fusion?
A: Common reasons a Purchase Order gets stuck in Oracle Fusion approval:
   1. Approver is out of office with no delegation configured
      → Solution: Contact the approver or their manager to approve/delegate
   2. Budget insufficient for the cost center
      → Check: Procurement > Budgetary Control > Check Funds
   3. Approval rules configuration issue
      → Contact the Oracle Fusion administrator
   4. Approval notification not received
      → The approver should check their Oracle BPM worklist or email
   5. Amount exceeds approver's authority limit
      → The PO will auto-escalate after 48 hours per standard SLA
   To check PO status: Navigate to Procurement > Purchase Orders > Search for your PO > View Approval History

Q: How to check invoice status in Oracle Fusion?
A: To check invoice payment status in Oracle Fusion:
   1. Navigate to Payables > Invoices > Manage Invoices
   2. Search by: Invoice Number, Supplier Name, or PO Number
   3. The Status field shows: Needs Validation / Validated / Approved / Paid / Cancelled
   4. For payment details: Click the invoice > Actions > View Payment
   5. If invoice is "Needs Validation": Check validation errors in the invoice header
   For supplier inquiries, use Supplier Portal > Invoices for self-service status checks.

Q: Steps to onboard a new vendor in Oracle Fusion?
A: New vendor onboarding process in Oracle Fusion:
   1. Raise a Supplier Registration Request:
      Navigator > Procurement > Suppliers > Create Supplier
   2. Fill mandatory details: Legal Name, Tax Registration Number, Address, Bank Details
   3. Attach required documents: GST Certificate, PAN Card, Cancelled Cheque, MSME Certificate (if applicable)
   4. Submit for Sourcing team review
   5. Sourcing team validates documents (3-5 business days)
   6. Finance team validates bank details
   7. Legal team reviews and approves (if spend > ₹50 Lakhs)
   8. Vendor receives portal access for self-service updates
   Note: New vendors are activated in Oracle only after all approvals are complete.

Q: Common sourcing errors and fixes in Oracle Fusion
A: Frequently encountered Oracle Sourcing errors:
   1. "Negotiation already in progress" error
      → Only one active negotiation can exist per category. Check existing negotiations.
   2. "Response outside valid response period" error
      → The bidding window has closed. Contact the sourcing team to extend if needed.
   3. "Price not within acceptable range" error
      → Supplier response violates the price constraint. Check negotiation settings.
   4. "Award cannot be created - funds check failed"
      → Insufficient budget. Raise a budget revision request before awarding.
   5. "Supplier not eligible" error
      → Supplier may not meet qualification criteria. Check qualification status in Supplier Qualification.
   For all sourcing issues, contact: sourcing-support@airtel.com

MODULE: General SCM
===================

Q: What is the escalation path for urgent procurement issues?
A: Procurement escalation matrix for Airtel SCM:
   Level 1: Procurement Analyst → Category Manager (Response: 4 hours)
   Level 2: Category Manager → Procurement Head (Response: 24 hours)
   Level 3: Procurement Head → CPO (Response: 48 hours)
   For system (ICM/Oracle) issues:
   Level 1: IT Helpdesk (Ticket via ServiceNow)
   Level 2: Application Support Team
   Level 3: Vendor Support (Oracle/Icertis)
   Emergency contact: scm-emergency@airtel.com (for critical supply chain disruptions)
*/

-- Placeholder comment table entry for tracking
COMMENT ON TABLE custom_queries IS
  'Stores pre-defined Q&A pairs. Entries added via Admin UI will have query_embedding populated automatically.';
