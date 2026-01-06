import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import { apiGet, apiPost, apiPut, apiDelete, apiUploadImage } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './Management.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  event_date: string;
}

function NewsManagement() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    event_date: '',
    is_featured: false,
    is_published: false,
  });

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, content: html }));
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Update editor content when formData.content changes (e.g., when editing)
  useEffect(() => {
    if (editor && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content || '');
    }
  }, [formData.content, editor]);

  // Format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return '';
    }
    
    // Trim whitespace
    dateString = dateString.trim();
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's a date with time (YYYY-MM-DD HH:MM:SS), extract just the date part
    if (/^\d{4}-\d{2}-\d{2}\s/.test(dateString)) {
      return dateString.split(' ')[0];
    }
    
    // Try to parse as Date object
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (editing) {
      const rawEventDate = (editing as any).event_date;
      const formattedDate = formatDateForInput(rawEventDate);
      
      const newFormData = {
        title: editing.title || '',
        content: editing.content || '',
        excerpt: editing.excerpt || '',
        featured_image: editing.featured_image || '',
        event_date: formattedDate,
        is_featured: editing.is_featured || false,
        is_published: editing.is_published || false,
      };
      setFormData(newFormData);
      setImagePreview(editing.featured_image || '');
      
      // Update editor content
      if (editor) {
        setTimeout(() => {
          editor.commands.setContent(newFormData.content || '');
        }, 50);
      }
    }
  }, [editing, editor]);

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  useEffect(() => {
    loadNews();
  }, [currentPage, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const loadNews = async () => {
    try {
      setLoading(true);
      let url = `${API_ENDPOINTS.NEWS.LIST}?page=${currentPage}&limit=${itemsPerPage}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const response = await apiGet<{ 
        success: boolean; 
        data: NewsItem[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(url);
      
      if (response.success) {
        setNews(response.data);
        // Update pagination info from API response
        if (response.pagination) {
          setTotalItems(response.pagination.total);
          setTotalPages(response.pagination.pages);
        } else {
          // Fallback: if API doesn't return pagination, use data length
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const result = await apiUploadImage(file);
      setFormData({ ...formData, featured_image: result.url });
      showSuccess('Image uploaded successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to upload image');
      setImagePreview('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image upload from editor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Upload file
    try {
      const result = await apiUploadImage(file);
      return result.url;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  // Handle image button click in editor
  const handleEditorImageClick = () => {
    if (editorImageInputRef.current) {
      editorImageInputRef.current.click();
    }
  };

  // Handle image file selection for editor
  const handleEditorImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const url = await handleEditorImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
      showSuccess('Image inserted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to upload image');
    } finally {
      if (editorImageInputRef.current) {
        editorImageInputRef.current.value = '';
      }
    }
  };

  // Handle bulk image upload button click
  const handleBulkImageClick = () => {
    if (bulkImageInputRef.current) {
      bulkImageInputRef.current.click();
    }
  };

  // Handle bulk image file selection for editor
  const handleBulkImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;

    const fileArray = Array.from(files);
    
    // Validate all files
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        showError(`"${file.name}" is not an image file. Skipping.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError(`"${file.name}" is too large (max 5MB). Skipping.`);
        continue;
      }
    }

    setUploadingBulk(true);
    const validFiles = fileArray.filter(
      file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      setUploadingBulk(false);
      showError('No valid images to upload');
      return;
    }

    try {
      // Upload all images sequentially
      const uploadedUrls: string[] = [];
      let successCount = 0;
      let failCount = 0;

      for (const file of validFiles) {
        try {
          const result = await apiUploadImage(file);
          uploadedUrls.push(result.url);
          successCount++;
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          failCount++;
        }
      }

      // Insert all images consecutively in the editor
      if (uploadedUrls.length > 0) {
        editor.chain().focus();
        
        // Insert images consecutively so they can be detected as a group for collage layout
        // Wrap each image in a paragraph to ensure proper spacing
        uploadedUrls.forEach((url, index) => {
          // Insert image wrapped in a paragraph
          editor.chain().insertContent(`<p><img src="${url}" alt="Event image ${index + 1}" /></p>`).run();
        });

        // Show success message
        if (failCount === 0) {
          showSuccess(`Successfully uploaded and inserted ${successCount} image${successCount !== 1 ? 's' : ''}!`);
        } else {
          showSuccess(`Uploaded ${successCount} image${successCount !== 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        }
      } else {
        showError('Failed to upload any images');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to upload images');
    } finally {
      setUploadingBulk(false);
      if (bulkImageInputRef.current) {
        bulkImageInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, featured_image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.NEWS.UPDATE}?id=${editing.id}`, {
          ...formData,
          id: editing.id,
        });
        showSuccess('News item updated successfully!');
      } else {
        await apiPost(API_ENDPOINTS.NEWS.CREATE, formData);
        showSuccess('News item created successfully!');
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadNews();
    } catch (error: any) {
      showError(error.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this news item?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.NEWS.DELETE}?id=${id}`);
      showSuccess('News item deleted successfully!');
      loadNews();
    } catch (error: any) {
      showError(error.message || 'Delete failed');
    }
  };

  const handleEdit = (item: NewsItem) => {
    const newFormData = {
      title: item.title || '',
      content: item.content || '',
      excerpt: item.excerpt || '',
      featured_image: item.featured_image || '',
      event_date: formatDateForInput((item as any).event_date),
      is_featured: item.is_featured || false,
      is_published: item.is_published || false,
    };
    
    // Set form data first
    setFormData(newFormData);
    setEditing(item);
    setImagePreview(item.featured_image || '');
    setShowForm(true);
    
    // Update editor content after a brief delay to ensure editor is ready
    setTimeout(() => {
      if (editor) {
        editor.commands.setContent(newFormData.content || '');
      }
    }, 100);
  };

  const resetForm = () => {
    const emptyFormData = {
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      event_date: '',
      is_featured: false,
      is_published: false,
    };
    setFormData(emptyFormData);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear editor content
    if (editor) {
      editor.commands.setContent('');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading news..." />
      </AdminLayout>
    );
  }

  // Show form as full page if editing or creating
  if (showForm) {
    return (
      <AdminLayout>
        <div className="management-form-page">
          <div className="form-page-header">
            <div className="form-page-title">
              <button 
                onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} 
                className="back-to-list-btn"
                title="Back to list"
              >
                ← Back
              </button>
              <h1>{editing ? 'Edit News' : 'Create New News'}</h1>
            </div>
          </div>
          <div className="form-page-content">
            <form onSubmit={handleSubmit} className="full-page-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <div className="rich-text-editor">
                    {editor && (
                      <>
                        {/* Toolbar */}
                        <div className="tiptap-toolbar">
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'is-active' : ''}
                            title="Bold"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'is-active' : ''}
                            title="Italic"
                          >
                            <em>I</em>
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={editor.isActive('strike') ? 'is-active' : ''}
                            title="Strikethrough"
                          >
                            <s>S</s>
                          </button>
                          <div className="toolbar-divider"></div>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                            title="Heading 1"
                          >
                            H1
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                            title="Heading 2"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                            title="Heading 3"
                          >
                            H3
                          </button>
                          <div className="toolbar-divider"></div>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
                            title="Align Left"
                          >
                            ⬅
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
                            title="Align Center"
                          >
                            ⬌
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
                            title="Align Right"
                          >
                            ➡
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
                            title="Justify"
                          >
                            ⬌
                          </button>
                          <div className="toolbar-divider"></div>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'is-active' : ''}
                            title="Bullet List"
                          >
                            •
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={editor.isActive('orderedList') ? 'is-active' : ''}
                            title="Numbered List"
                          >
                            1.
                          </button>
                          <div className="toolbar-divider"></div>
                          <button
                            type="button"
                            onClick={handleEditorImageClick}
                            title="Insert Single Image"
                            disabled={uploadingBulk}
                          >
                            🖼
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkImageClick}
                            title="Upload Multiple Images"
                            disabled={uploadingBulk}
                            className={uploadingBulk ? 'uploading' : ''}
                          >
                            {uploadingBulk ? '⏳' : '🖼️+'}
                          </button>
                          <input
                            ref={editorImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditorImageSelect}
                            style={{ display: 'none' }}
                          />
                          <input
                            ref={bulkImageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleBulkImageSelect}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                            title="Clear Formatting"
                          >
                            🧹
                          </button>
                        </div>
                        {/* Editor */}
                        <EditorContent editor={editor} />
                      </>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    placeholder="Select event date"
                  />
                  <small className="form-hint">Select the date when the event occurred or will occur</small>
                </div>
                <div className="form-group">
                  <label>Featured Image</label>
                  <div className="image-upload-section">
                    {/* Upload Option */}
                    <div className="upload-option">
                      <label className="upload-label">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={uploading}
                          style={{ display: 'none' }}
                        />
                        <span className="upload-button">
                          {uploading ? 'Uploading...' : 'Choose Image File'}
                        </span>
                      </label>
                      <span className="upload-hint">Max 5MB (JPEG, PNG, GIF, WebP)</span>
                    </div>
                    
                    {/* OR Divider */}
                    <div className="upload-divider">
                      <span>OR</span>
                    </div>
                    
                    {/* URL Option */}
                    <div className="url-option">
                      <label>Image URL</label>
                      <input
                        type="text"
                        value={formData.featured_image}
                        onChange={(e) => {
                          setFormData({ ...formData, featured_image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {(imagePreview || formData.featured_image) && (
                      <div className="image-preview">
                        <img 
                          src={imagePreview || formData.featured_image} 
                          alt="Preview" 
                          onError={() => setImagePreview('')}
                        />
                        <button 
                          type="button" 
                          onClick={handleRemoveImage}
                          className="remove-image-btn"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    />
                    Featured
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    />
                    Published
                  </label>
                </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editing ? 'Update News' : 'Save News'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); resetForm(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AdminLayout>
      <div className="management">
        <div className="management-header">
          <div>
            <h1>News Management</h1>
            <div className="total-count">
              Total News Items: <strong>{totalItems}</strong>
            </div>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); resetForm(); }} className="btn-primary">
            Add New
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="search-results-info">
              Found {totalItems} result{totalItems !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Excerpt</th>
                <th>Featured</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {news.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    {searchQuery ? `No news items found matching "${searchQuery}"` : 'No news items found'}
                  </td>
                </tr>
              ) : (
                news.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.excerpt || '-'}</td>
                    <td>{item.is_featured ? 'Yes' : 'No'}</td>
                    <td>{item.is_published ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="btn-action btn-edit"
                          title="Edit this news item"
                        >
                          <span className="btn-icon">✏️</span>
                          <span className="btn-text">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="btn-action btn-delete"
                          title="Delete this news item"
                        >
                          <span className="btn-icon">🗑️</span>
                          <span className="btn-text">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
                title="Previous page"
              >
                ← Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    page === currentPage ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                title="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default NewsManagement;
