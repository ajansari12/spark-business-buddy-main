export interface Document {
  id: string;
  userId: string;
  sessionId: string | null;
  docType: "tier1_report";
  filePath: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export interface DbDocument {
  id: string;
  user_id: string;
  session_id: string | null;
  doc_type: "tier1_report";
  file_path: string | null;
  file_url: string | null;
  created_at: string;
}

export const mapDbDocumentToDocument = (dbDoc: DbDocument): Document => ({
  id: dbDoc.id,
  userId: dbDoc.user_id,
  sessionId: dbDoc.session_id,
  docType: dbDoc.doc_type,
  filePath: dbDoc.file_path,
  fileUrl: dbDoc.file_url,
  createdAt: dbDoc.created_at,
});
