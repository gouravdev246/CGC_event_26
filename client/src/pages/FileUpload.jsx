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
  ArrowUpRight
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
  const [uploadError, setUploadError] = useState(null);
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
    setUploadError(null);
    for (const file of newFiles) {
      const task = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        filename: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        type: file.name.split('.').pop().toUpperCase(),
        progress: 40
      };

      setUploadingFiles((prev) => [...prev, task]);

      try {
        const res = await apiService.uploadFile(file);
        setUploadingFiles((prev) => prev.filter((t) => t.filename !== file.name));

        const newDoc = {
          id: res.file?._id || res.file?.id || `doc-${Date.now()}`,
          name: task.name,
          filename: file.name,
          type: task.type,
          size: task.size,
          chunks: Math.floor(Math.random() * 30) + 12,
          status: 'Indexed',
          uploadedAt: 'Just now',
          contentPreview: `Extracted content and vector embeddings for ${file.name}. Ready for semantic RAG retrieval.`
        };

        setDocuments((prev) => [newDoc, ...prev]);
      } catch (err) {
        setUploadingFiles((prev) => prev.filter((t) => t.filename !== file.name));
        const errData = err.response?.data;
        if (err.response?.status === 403 || errData?.code === 'DOCUMENT_LIMIT_REACHED') {
          setUploadError({
            message: errData?.message || 'Document upload limit reached for your plan.',
            plan: errData?.plan || 'Free',
            limit: errData?.limit || 2,
            currentUsage: errData?.currentUsage || 2
          });
          break;
        } else {
          setUploadError({
            message: errData?.message || 'Failed to upload document. Please try again.'
          });
        }
      }
    }
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

      {/* Main Two Section Stack Matching Sketch */}
      <div className="dashboard-vertical-sections">
        {uploadError && (
          <div className="subscription-banner banner-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <strong>{uploadError.message}</strong>
              {uploadError.limit && (
                <span style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                  Current Plan ({uploadError.plan}) usage: {uploadError.currentUsage} / {uploadError.limit} documents
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={ArrowUpRight}
              onClick={() => navigate('/subscription')}
            >
              Upgrade Plan
            </Button>
          </div>
        )}

        {/* =================================================================
            1. TOP SECTION: Upload Files (Large rounded box with prominent +)
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

            {/* Prominent Plus Button Matching Sketch */}
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
              Supported formats: PDF, DOCX, TXT, CSV, MD (up to 50MB)
            </span>

            {/* Hidden Input for File Selection */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".pdf,.docx,.doc,.txt,.csv,.md"
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
                      Parsing document and generating vector embeddings...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================
            2. BOTTOM SECTION: Uploaded Documents List (1. Policy Docs, 2. Fee docs)
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
                  {/* Number prefix matching sketch: 1. Policy Docs, 2. Fee docs */}
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
                Indexed in HNSW vector index with cosine similarity metric
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
