-- Migration: 20260813000000_issue_attachments_storage.sql
-- Description: Creates private Supabase storage bucket 'issue-attachments' and security policies.

-- 1. Create Private Storage Bucket for Issue Attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'issue-attachments',
    'issue-attachments',
    FALSE, -- Private bucket (served via short-lived signed URLs)
    5242880, -- 5 MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies for 'issue-attachments'
DROP POLICY IF EXISTS "Authenticated users can upload issue attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload issue attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'issue-attachments');

DROP POLICY IF EXISTS "Authenticated users can read issue attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read issue attachments"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'issue-attachments');

DROP POLICY IF EXISTS "Users can delete own uploaded issue attachments" ON storage.objects;
CREATE POLICY "Users can delete own uploaded issue attachments"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'issue-attachments' AND (owner = auth.uid() OR owner IS NULL));
