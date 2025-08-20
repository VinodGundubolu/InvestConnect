-- Create a test agreement for investor 211
INSERT INTO investor_agreements (
  id,
  investor_id,
  template_id,
  agreement_content,
  status,
  sent_at,
  document_hash,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'test-agreement-1755696966949',
  '211',
  'default',
  'INVESTMENT PARTNERSHIP AGREEMENT

This Investment Partnership Agreement ("Agreement") is entered into on 20/8/2025 between:

INVESTOR: Vinodh Kumar Durga
EMAIL: test1@gmail.com
COMPANY: Your Investment Company

INVESTMENT DETAILS:
- Investment Amount: ₹20,00,000
- Investment Date: 20/8/2025
- Maturity Date: 20/8/2035
- Interest Rate: 6-18% per annum
- Agreement ID: test-agreement-1755696966949

TERMS AND CONDITIONS:
1. The investor agrees to invest the specified amount
2. Interest will be paid annually as per the schedule
3. Principal will be returned upon maturity
4. This agreement is governed by applicable laws

By signing below, both parties agree to the terms outlined in this agreement.

_________________________________
Investor Signature

Date: _______________',
  'pending',
  NOW(),
  'test-hash-' || EXTRACT(EPOCH FROM NOW()),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
);

-- Create agreement action log
INSERT INTO agreement_actions (
  id,
  agreement_id,
  action,
  performed_by,
  notes,
  created_at
) VALUES (
  'action-' || EXTRACT(EPOCH FROM NOW()),
  'test-agreement-1755696966949',
  'created',
  'system',
  'Test agreement created for manual testing',
  NOW()
);