-- Create private bucket for PDF documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('ft-documents', 'ft-documents', false);

-- RLS: Users can read their own files (folder path starts with their user_id)
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ft-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can insert their own files
CREATE POLICY "Users can insert own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ft-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add INSERT policy for ft_documents table (currently missing)
CREATE POLICY "Users can insert their own documents"
ON public.ft_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);