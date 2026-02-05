/*
  # Update Vault Secrets for Email Notifications
  
  1. Updates
    - Update SUPABASE_URL to new project URL (acvfmsbtaeqchrfosidr)
    - Add RESEND_API_KEY for email notifications
  
  2. Purpose
    - Fix email notifications by using correct Supabase URL
    - Enable Resend integration for sending notification emails to autoglasslupsk@gmail.com and lukasz.sawicki07@gmail.com
*/

-- Update SUPABASE_URL to new project URL
SELECT vault.update_secret(
  '12a122d6-5ba5-4073-b0bd-0c571b6feff3'::uuid,
  'https://acvfmsbtaeqchrfosidr.supabase.co',
  'SUPABASE_URL'
);

-- Add RESEND_API_KEY for email notifications
SELECT vault.create_secret(
  're_cLJy3ZHY_3y2dfNDR9qMZPBN9k5o1G47p',
  'RESEND_API_KEY'
);
