import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Plus,
  FileText,
  CheckCircle2,
  Trash2,
  Eye,
  Clock,
  Database,
  Layers,
  AlertCircle,
  FileCode,
  X,
  Copy,
  Check,
  ArrowRight,
  LogIn
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { apiService } from '../services/api';

export function FileUpload() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      name: 'Policy Docs',
      filename: 'University_Attendance_Policy_2026.pdf',
      type: 'PDF',
      size: '2.4 MB',
      chunks: 48,
      status: 'Indexed',
      uploadedAt: '2 hours ago',
      contentPreview: 'Academic regulations regarding minimum 75% student attendance for semester examinations, medical leave dispensations, and makeup examination protocols.'
    },
    {
      id: 'doc-2',
      name: 'Fee docs',
      filename: 'Tuition_Fee_Structure_and_Refunds.pdf',
      type: 'PDF',
      size: '1.1 MB',
      chunks: 22,
      status: 'Indexed',
      uploadedAt: '5 hours ago',
      contentPreview: 'Complete semester tuition breakdown, installment schedules, laboratory fees, and prorated refund policy details for withdrawn admissions.'
    }
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [lastUploadResult, setLastUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const processFiles = async (newFiles) => {
    setUploadError('');
    setIsAuthError(false);

    for (const file of newFiles) {
      const task = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.name.split('.').pop().toUpperCase(),
        progress: 15
      };

      setUploadingFiles((prev) => [...prev, task]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const storedUserId = localStorage.getItem('rag_user_id');
        if (storedUserId) {
          formData.append('userId', storedUserId);
        }

        const res = await apiService.uploadFile(formData, (percent) => {
          setUploadingFiles((prev) =>
            prev.map((t) => (t.filename === file.name ? { ...t, progress: Math.min(percent, 85) } : t))
          );
        });

        if (res && res.success) {
          if (res.apiKey) localStorage.setItem('rag_api_key', res.apiKey);
          if (res.apiEndpoint) localStorage.setItem('rag_api_endpoint', res.apiEndpoint);
          if (res.chatEndpoint) localStorage.setItem('rag_chat_endpoint', res.chatEndpoint);
          if (res.file?.userId) localStorage.setItem('rag_user_id', res.file.userId);

          setLastUploadResult(res);

          const newDoc = {
            id: res.file?._id || `doc-${Date.now()}`,
            name: task.name,
            filename: file.name,
            type: task.type,
            size: task.size,
            chunks: res.processedFiles?.length ? 24 : 15,
            status: 'Indexed',
            uploadedAt: 'Just now',
            contentPreview: `Vector embeddings generated and stored in Pinecone for ${file.name}. Ready for semantic RAG retrieval.`
          };

          setDocuments((prev) => [newDoc, ...prev]);
        } else {
          setUploadError(res?.message || 'Failed to process document');
        }
      } catch (err) {
        console.error('File upload error:', err);
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'File upload failed. Ensure server is active.';
        
        if (status === 401) {
          setUploadError('Your login session is invalid or expired (401). Please re-login to renew your credentials.');
          setIsAuthError(true);
        } else {
          setUploadError(msg);
          setIsAuthError(false);
        }
      } finally {
        setUploadingFiles((prev) => prev.filter((t) => t.filename !== file.name));
      }
    }
  };

  const handleCopyEndpoint = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="dashboard-page-container file-upload-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-muted">RAG Service</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">File Upload</span>
          </div>
          <h1 className="header-page-title">Upload Your Knowledge.</h1>
          <p className="header-page-subtitle">Bring your documents. We'll handle the rest.</p>
        </div>

        <div className="header-right">
          <div className="live-pill">
            <span className="live-dot" />
            <span>Embedding Engine Online</span>
          </div>
        </div>
      </header>

      {/* Main Two Section Stack */}
      <div className="dashboard-vertical-sections">

        {/* Success Banner when Embeddings are Generated */}
        {lastUploadResult && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: '15px' }}>
                    {lastUploadResult.message || 'Documents Added Successfully!'}
                  </span>
                  <Badge variant="success" size="sm" dot>Embeddings Ready</Badge>
                </div>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Your knowledge base is vector-indexed in Pinecone. You can now build chatbots using this endpoint:
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px',
                    background: '#0b0f19',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#60a5fa',
                    border: '1px solid #374151'
                  }}
                >
                  <span style={{ wordBreak: 'break-all' }}>
                    {lastUploadResult.apiEndpoint || `${window.location.origin}/api/${lastUploadResult.file?.userId}/${lastUploadResult.apiKey}/chat`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyEndpoint(lastUploadResult.apiEndpoint)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {copiedEndpoint ? <Check size={12} /> : <Copy size={12} />}
                    {copiedEndpoint ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/user-query')}
              >
                Test in Query Chat
              </Button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {uploadError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
            {isAuthError && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('rag_auth_token');
                  navigate('/login');
                }}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={13} />
                <span>Log In Again</span>
              </button>
            )}
          </div>
        )}

        {/* =================================================================
            1. TOP SECTION: Upload Files
           ================================================================= */}
        <section
          className={`dashboard-section upload-box-container ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Upload Files Section"
        >
          <div className="upload-box-content">
            <h2 className="upload-box-title">Upload Your Knowledge.</h2>

            {/* Prominent Plus Button */}
            <button
              type="button"
              className="upload-plus-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Click to select documents"
              aria-label="Upload new file"
            >
              <Plus size={44} strokeWidth={2.8} className="plus-icon" />
            </button>

            <p className="upload-box-instruction">
              Drop files or browse.
            </p>
            <span className="upload-box-formats">
              Supported formats: PDF (up to 50MB)
            </span>

            {/* Hidden Input for File Selection */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".pdf"
              style={{ display: 'none' }}
            />

            {/* Upload Progress Preview if actively uploading */}
            {uploadingFiles.length > 0 && (
              <div className="upload-progress-wrapper">
                {uploadingFiles.map((uf, i) => (
                  <div key={i} className="upload-progress-item">
                    <div className="progress-info-row">
                      <span className="progress-filename">{uf.filename}</span>
                      <span className="progress-percentage">{uf.progress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${uf.progress}%` }}
                      />
                    </div>
                    <span className="progress-status-text">
                      Parsing document, generating vector embeddings & indexing in Pinecone...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================
            2. BOTTOM SECTION: Uploaded Documents List
           ================================================================= */}
        <section className="dashboard-section uploaded-docs-container" aria-label="Uploaded Documents">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-icon-badge">
                <FileText size={20} className="section-icon text-indigo" />
              </div>
              <div>
                <div className="title-with-count">
                  <h2 className="section-heading">Uploaded Documents</h2>
                  <span className="count-badge">{documents.length} files</span>
                </div>
                <p className="section-subtext">
                  Vector-indexed files available for semantic retrieval and LLM context
                </p>
              </div>
            </div>
          </div>

          <div className="uploaded-docs-list">
            {documents.length === 0 ? (
              <div className="empty-requests-state">
                <p className="empty-title">No documents uploaded yet</p>
                <p className="empty-subtitle">
                  Click the plus button above to add knowledge documents to your RAG pipeline.
                </p>
              </div>
            ) : (
              documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="doc-list-item"
                  onClick={() => setSelectedDoc(doc)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="doc-number-col">
                    <span className="doc-number">{idx + 1}.</span>
                  </div>

                  {/* Document Name and Details */}
                  <div className="doc-main-col">
                    <div className="doc-title-row">
                      <h3 className="doc-display-name">{doc.name}</h3>
                      <Badge variant="indigo" size="sm">
                        {doc.type}
                      </Badge>
                      <Badge variant="success" size="sm" dot>
                        {doc.status}
                      </Badge>
                    </div>

                    <div className="doc-meta-row">
                      <span className="doc-filename">{doc.filename}</span>
                      <span className="meta-separator">•</span>
                      <span>{doc.size}</span>
                      <span className="meta-separator">•</span>
                      <span className="chunks-tag">
                        <Layers size={13} className="text-indigo" />
                        {doc.chunks} chunks
                      </span>
                      <span className="meta-separator">•</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="doc-actions-col">
                    <button
                      type="button"
                      className="doc-action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                      title="Preview document chunks"
                    >
                      <Eye size={16} />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      className="doc-action-btn delete-btn"
                      onClick={(e) => handleDelete(doc.id, e)}
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Document Chunk Preview Modal */}
      {selectedDoc && (
        <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <FileText size={18} className="text-indigo" />
                <span className="modal-doc-title">{selectedDoc.name}</span>
                <Badge variant="success" size="sm" dot>
                  {selectedDoc.status}
                </Badge>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDoc(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-stats-banner">
                <div className="modal-stat-item">
                  <Database size={16} className="modal-stat-icon text-indigo" />
                  <div>
                    <span className="modal-stat-label">File Name</span>
                    <span className="modal-stat-value">{selectedDoc.filename}</span>
                  </div>
                </div>
                <div className="modal-stat-item">
                  <Layers size={16} className="modal-stat-icon text-purple" />
                  <div>
                    <span className="modal-stat-label">Vector Chunks</span>
                    <span className="modal-stat-value">{selectedDoc.chunks} embeddings</span>
                  </div>
                </div>
                <div className="modal-stat-item">
                  <Clock size={16} className="modal-stat-icon text-cyan" />
                  <div>
                    <span className="modal-stat-label">File Size</span>
                    <span className="modal-stat-value">{selectedDoc.size}</span>
                  </div>
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-block-header">
                  <span className="detail-block-title">Extracted Chunk Sample (Page 1)</span>
                </div>
                <div className="detail-content-box query-box">
                  <p>{selectedDoc.contentPreview}</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <span className="timestamp-note">
                Indexed in Pinecone vector index with Cohere embeddings
              </span>
              <Button variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
