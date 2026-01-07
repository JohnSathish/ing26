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
import EmptyState from '../../components/EmptyState/EmptyState';
import './Management.css';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  menu_label: string;
  menu_position: number;
  parent_menu: string | null;
  is_submenu: boolean;
  is_enabled: boolean;
  is_featured: boolean;
  show_in_menu: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PARENT_MENU_OPTIONS = [
  { value: '', label: 'Main Menu (No Parent)' },
  { value: 'about', label: 'About Us' },
  { value: 'provincials', label: 'ING Provincials' },
  { value: 'council', label: 'Council' },
  { value: 'houses', label: 'Houses' },
];

function PagesManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'enabled' | 'disabled' | 'in_menu' | 'featured'>('all');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sortColumn, setSortColumn] = useState<'title' | 'slug' | 'created_at' | 'sort_order'>('sort_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const bulkImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'menu' | 'seo'>('basic');
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    featured_image: '',
    menu_label: '',
    menu_position: 0,
    parent_menu: '',
    is_submenu: false,
    is_enabled: true,
    is_featured: false,
    show_in_menu: true,
    sort_order: 0,
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

  // Update editor content when formData.content changes
  useEffect(() => {
    if (editor && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content || '');
    }
  }, [formData.content, editor]);

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-generate slug when title changes
  useEffect(() => {
    if (!editing && formData.title && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [formData.title, editing]);

  // Auto-generate meta title from title
  useEffect(() => {
    if (!editing && formData.title && !formData.meta_title) {
      setFormData(prev => ({ ...prev, meta_title: prev.title }));
    }
  }, [formData.title, editing]);

  // Auto-generate menu label from title
  useEffect(() => {
    if (!editing && formData.title && !formData.menu_label) {
      setFormData(prev => ({ ...prev, menu_label: prev.title }));
    }
  }, [formData.title, editing]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        enabled_only: 'false', // Admin can see all pages
      });
      
      if (searchQuery) {
        // Note: Backend search not implemented yet, filtering client-side
      }
      
      const response = await apiGet<{ success: boolean; data: Page[]; pagination: any }>(
        `${API_ENDPOINTS.PAGES.LIST}?${params}`
      );
      
      console.log('Pages API response:', response);
      console.log('Response data:', response.data);
      console.log('Response pagination:', response.pagination);
      
      if (response.success) {
        let filteredPages = response.data || [];
        
        // Client-side search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredPages = response.data.filter(page =>
            page.title.toLowerCase().includes(query) ||
            page.slug.toLowerCase().includes(query) ||
            (page.excerpt && page.excerpt.toLowerCase().includes(query)) ||
            (page.menu_label && page.menu_label.toLowerCase().includes(query))
          );
        }

        // Apply status filter
        if (searchFilter === 'enabled') {
          filteredPages = filteredPages.filter(page => page.is_enabled);
        } else if (searchFilter === 'disabled') {
          filteredPages = filteredPages.filter(page => !page.is_enabled);
        } else if (searchFilter === 'in_menu') {
          filteredPages = filteredPages.filter(page => page.show_in_menu);
        } else if (searchFilter === 'featured') {
          filteredPages = filteredPages.filter(page => page.is_featured);
        }
        
        setPages(filteredPages);
        setTotalItems(response.pagination?.total || filteredPages.length);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === 1) {
      loadPages();
    } else {
      setCurrentPage(1);
    }
  }, [searchQuery, searchFilter]);

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      meta_title: '',
      meta_description: '',
      featured_image: '',
      menu_label: '',
      menu_position: 0,
      parent_menu: '',
      is_submenu: false,
      is_enabled: true,
      is_featured: false,
      show_in_menu: true,
      sort_order: 0,
    });
    setImagePreview('');
    setEditing(null);
    if (editor) {
      editor.commands.setContent('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiPut(`${API_ENDPOINTS.PAGES.UPDATE}?id=${editing.id}`, formData);
        showSuccess('Page updated successfully!');
      } else {
        const response = await apiPost(API_ENDPOINTS.PAGES.CREATE, formData);
        console.log('Create page response:', response);
        if (response && response.success) {
          showSuccess('Page created successfully!');
        } else {
          throw new Error(response?.error || 'Failed to create page');
        }
      }
      setShowForm(false);
      resetForm();
      // Reload pages after a short delay to ensure database is updated
      setTimeout(() => {
        loadPages();
      }, 500);
    } catch (error: any) {
      console.error('Page operation error:', error);
      showError(error.message || 'Operation failed. Please check console for details.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }
    try {
      await apiDelete(`${API_ENDPOINTS.PAGES.DELETE}?id=${id}`);
      showSuccess('Page deleted successfully!');
      loadPages();
      setSelectedPages(prev => prev.filter(pageId => pageId !== id));
    } catch (error: any) {
      showError(error.message || 'Failed to delete page');
    }
  };

  const handleToggleStatus = async (page: Page) => {
    try {
      setTogglingStatus(page.id);
      await apiPut(`${API_ENDPOINTS.PAGES.UPDATE}?id=${page.id}`, {
        title: page.title,
        slug: page.slug,
        content: page.content || '',
        excerpt: page.excerpt || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        featured_image: page.featured_image || '',
        menu_label: page.menu_label || '',
        menu_position: page.menu_position || 0,
        parent_menu: page.parent_menu || '',
        is_submenu: page.is_submenu || false,
        is_enabled: !page.is_enabled,
        is_featured: page.is_featured || false,
        show_in_menu: page.show_in_menu,
        sort_order: page.sort_order || 0,
      });
      showSuccess(`Page ${!page.is_enabled ? 'enabled' : 'disabled'} successfully!`);
      loadPages();
    } catch (error: any) {
      showError(error.message || 'Failed to update page status');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleSort = (column: 'title' | 'slug' | 'created_at' | 'sort_order') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPages(pages.map(p => p.id));
    } else {
      setSelectedPages([]);
    }
  };

  const handleSelectPage = (id: number) => {
    setSelectedPages(prev => 
      prev.includes(id) 
        ? prev.filter(pageId => pageId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPages.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPages.length} page(s)?`)) {
      return;
    }
    try {
      for (const id of selectedPages) {
        await apiDelete(`${API_ENDPOINTS.PAGES.DELETE}?id=${id}`);
      }
      showSuccess(`${selectedPages.length} page(s) deleted successfully!`);
      setSelectedPages([]);
      loadPages();
    } catch (error: any) {
      showError(error.message || 'Failed to delete pages');
    }
  };

  const sortedPages = [...pages].sort((a, b) => {
    let aVal: any = a[sortColumn];
    let bVal: any = b[sortColumn];
    
    if (sortColumn === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const handleEdit = (page: Page) => {
    setEditing(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      excerpt: page.excerpt || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      featured_image: page.featured_image || '',
      menu_label: page.menu_label || '',
      menu_position: page.menu_position || 0,
      parent_menu: page.parent_menu || '',
      is_submenu: page.is_submenu || false,
      is_enabled: page.is_enabled,
      is_featured: page.is_featured || false,
      show_in_menu: page.show_in_menu,
      sort_order: page.sort_order || 0,
    });
    setImagePreview(page.featured_image || '');
    setShowForm(true);
    if (editor) {
      editor.commands.setContent(page.content || '');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await apiUploadImage(file);
      setFormData(prev => ({ ...prev, featured_image: imageUrl }));
      setImagePreview(imageUrl);
      showSuccess('Image uploaded successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBulkImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingBulk(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = await apiUploadImage(file);
        if (editor) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      }
      showSuccess(`${files.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      showError(error.message || 'Failed to upload images');
    } finally {
      setUploadingBulk(false);
      if (bulkImageInputRef.current) {
        bulkImageInputRef.current.value = '';
      }
    }
  };

  if (loading && pages.length === 0) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading pages..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="management-container">
        <div className="management-header">
          <h1>Pages Management</h1>
          <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            + Create New Page
          </button>
        </div>

        {showForm && (
          <div className="form-container enhanced-form">
            <div className="form-header">
              <div>
                <h2>{editing ? 'Edit' : 'Create'} Page</h2>
                {formData.slug && (
                  <p className="page-url-preview">
                    <span className="url-label">URL:</span>
                    <code>/page/{formData.slug}</code>
                    {editing && (
                      <a 
                        href={`/page/${formData.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="preview-link"
                        title="Preview page"
                      >
                        🔗 Preview
                      </a>
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn-close-form"
                onClick={() => { setShowForm(false); resetForm(); }}
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="form-tabs">
              <button
                type="button"
                className={`form-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                📝 Basic Info
              </button>
              <button
                type="button"
                className={`form-tab ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                ✍️ Content
              </button>
              <button
                type="button"
                className={`form-tab ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                🗂️ Menu Settings
              </button>
              <button
                type="button"
                className={`form-tab ${activeTab === 'seo' ? 'active' : ''}`}
                onClick={() => setActiveTab('seo')}
              >
                🔍 SEO & Meta
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="form-tab-content">
                  <div className="form-section">
                    <h3 className="section-title">Page Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          Title *
                          <span className="field-hint">The main title of the page</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          placeholder="Enter page title"
                          className="form-input-large"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>
                          Slug *
                          <span className="field-hint">URL-friendly identifier (auto-generated from title)</span>
                        </label>
                        <div className="slug-input-wrapper">
                          <span className="slug-prefix">/page/</span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                            required
                            placeholder="page-slug"
                            className="slug-input"
                          />
                        </div>
                        {formData.slug && (
                          <p className="field-help">
                            Page will be accessible at: <code>/page/{formData.slug}</code>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Excerpt
                        <span className="field-hint">Short description shown in listings and previews</span>
                      </label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        rows={3}
                        placeholder="Brief description of the page..."
                        maxLength={300}
                      />
                      <div className="char-counter">
                        {formData.excerpt.length} / 300 characters
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Featured Image
                        <span className="field-hint">Main image displayed at the top of the page</span>
                      </label>
                      <div className="image-upload-section">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn-upload-image"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? '⏳ Uploading...' : '📷 Upload Featured Image'}
                        </button>
                        {imagePreview && (
                          <div className="image-preview-enhanced">
                            <img src={imagePreview} alt="Featured" />
                            <div className="image-actions">
                              <button
                                type="button"
                                className="btn-remove-image"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, featured_image: '' }));
                                  setImagePreview('');
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">Status</h3>
                    <div className="form-row">
                      <div className="form-group checkbox-group-enhanced">
                        <label className="checkbox-label-large">
                          <input
                            type="checkbox"
                            checked={formData.is_enabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                          />
                          <span className="checkbox-custom"></span>
                          <div>
                            <strong>Enabled</strong>
                            <span className="checkbox-hint">Page will be visible to visitors when enabled</span>
                          </div>
                        </label>
                      </div>
                      <div className="form-group checkbox-group-enhanced">
                        <label className="checkbox-label-large">
                          <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                          />
                          <span className="checkbox-custom"></span>
                          <div>
                            <strong>Featured</strong>
                            <span className="checkbox-hint">Mark this page as featured</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="form-tab-content">
                  <div className="form-section">
                    <h3 className="section-title">Page Content</h3>
                    <div className="form-group">
                      <label>
                        Content
                        <span className="field-hint">Main content of the page. Use the toolbar for formatting.</span>
                      </label>
                      {editor && (
                        <div className="editor-container-enhanced">
                          <div className="editor-toolbar-enhanced">
                            <div className="toolbar-group">
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                                title="Bold"
                              >
                                <strong>B</strong>
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                                title="Italic"
                              >
                                <em>I</em>
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
                                title="Heading 1"
                              >
                                H1
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                                title="Heading 2"
                              >
                                H2
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                                title="Heading 3"
                              >
                                H3
                              </button>
                            </div>
                            <div className="toolbar-group">
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                                title="Bullet List"
                              >
                                •
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                                title="Numbered List"
                              >
                                1.
                              </button>
                              <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
                                title="Quote"
                              >
                                "
                              </button>
                            </div>
                            <div className="toolbar-group">
                              <button
                                type="button"
                                onClick={() => editorImageInputRef.current?.click()}
                                className="toolbar-btn"
                                title="Insert Image"
                              >
                                🖼️
                              </button>
                              <button
                                type="button"
                                onClick={() => bulkImageInputRef.current?.click()}
                                className="toolbar-btn"
                                title="Bulk Upload Images"
                                disabled={uploadingBulk}
                              >
                                {uploadingBulk ? '⏳' : '🖼️+'}
                              </button>
                            </div>
                          </div>
                          <EditorContent editor={editor} />
                          <input
                            type="file"
                            ref={editorImageInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const imageUrl = await apiUploadImage(file);
                                  editor.chain().focus().setImage({ src: imageUrl }).run();
                                } catch (error: any) {
                                  showError(error.message || 'Failed to upload image');
                                }
                              }
                            }}
                          />
                          <input
                            type="file"
                            ref={bulkImageInputRef}
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleBulkImageSelect}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Settings Tab */}
              {activeTab === 'menu' && (
                <div className="form-tab-content">
                  <div className="form-section">
                    <h3 className="section-title">Navigation Menu</h3>
                    <div className="form-group">
                      <label>
                        Show in Menu
                        <span className="field-hint">Display this page in the navigation menu</span>
                      </label>
                      <label className="checkbox-label-large">
                        <input
                          type="checkbox"
                          checked={formData.show_in_menu}
                          onChange={(e) => setFormData(prev => ({ ...prev, show_in_menu: e.target.checked }))}
                        />
                        <span className="checkbox-custom"></span>
                        <div>
                          <strong>Show in Navigation Menu</strong>
                          <span className="checkbox-hint">When enabled, this page will appear in the site navigation</span>
                        </div>
                      </label>
                    </div>

                    {formData.show_in_menu && (
                      <>
                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              Menu Label
                              <span className="field-hint">Text displayed in the menu (defaults to page title)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.menu_label}
                              onChange={(e) => setFormData(prev => ({ ...prev, menu_label: e.target.value }))}
                              placeholder="Label shown in menu"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              Parent Menu
                              <span className="field-hint">Select parent menu item for submenu placement</span>
                            </label>
                            <select
                              value={formData.parent_menu}
                              onChange={(e) => setFormData(prev => ({ ...prev, parent_menu: e.target.value }))}
                            >
                              {PARENT_MENU_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>
                              Sort Order
                              <span className="field-hint">Lower numbers appear first (0 = first)</span>
                            </label>
                            <input
                              type="number"
                              value={formData.sort_order}
                              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                              min="0"
                              step="1"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              Menu Position
                              <span className="field-hint">Additional positioning control</span>
                            </label>
                            <input
                              type="number"
                              value={formData.menu_position}
                              onChange={(e) => setFormData(prev => ({ ...prev, menu_position: parseInt(e.target.value) || 0 }))}
                              min="0"
                              step="1"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="checkbox-label-large">
                            <input
                              type="checkbox"
                              checked={formData.is_submenu}
                              onChange={(e) => setFormData(prev => ({ ...prev, is_submenu: e.target.checked }))}
                            />
                            <span className="checkbox-custom"></span>
                            <div>
                              <strong>Is Submenu Item</strong>
                              <span className="checkbox-hint">Mark as a submenu item under a parent menu</span>
                            </div>
                          </label>
                        </div>

                        {formData.parent_menu && (
                          <div className="menu-preview">
                            <h4>Menu Preview</h4>
                            <div className="menu-preview-content">
                              <div className="menu-preview-item">
                                <strong>{formData.parent_menu.charAt(0).toUpperCase() + formData.parent_menu.slice(1)}</strong>
                                <div className="menu-preview-subitem">
                                  → {formData.menu_label || formData.title || 'Page Title'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="form-tab-content">
                  <div className="form-section">
                    <h3 className="section-title">SEO Settings</h3>
                    <div className="form-group">
                      <label>
                        Meta Title
                        <span className="field-hint">SEO title (appears in search results and browser tabs)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.meta_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                        placeholder="SEO-friendly title (50-60 characters recommended)"
                        maxLength={60}
                      />
                      <div className="char-counter">
                        {formData.meta_title.length} / 60 characters
                        {formData.meta_title.length > 60 && (
                          <span className="char-warning">⚠️ Too long for optimal SEO</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        Meta Description
                        <span className="field-hint">Brief description shown in search results</span>
                      </label>
                      <textarea
                        value={formData.meta_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                        rows={3}
                        placeholder="Compelling description that encourages clicks (150-160 characters recommended)"
                        maxLength={160}
                      />
                      <div className="char-counter">
                        {formData.meta_description.length} / 160 characters
                        {formData.meta_description.length > 160 && (
                          <span className="char-warning">⚠️ May be truncated in search results</span>
                        )}
                      </div>
                    </div>

                    {formData.meta_title && (
                      <div className="seo-preview">
                        <h4>Search Result Preview</h4>
                        <div className="seo-preview-content">
                          <div className="seo-preview-title">
                            {formData.meta_title || formData.title || 'Page Title'}
                          </div>
                          <div className="seo-preview-url">
                            /page/{formData.slug || 'page-slug'}
                          </div>
                          <div className="seo-preview-description">
                            {formData.meta_description || formData.excerpt || 'Page description will appear here...'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions-enhanced">
                <div className="form-actions-left">
                  <button type="submit" className="btn-primary btn-large" disabled={uploading || uploadingBulk}>
                    {uploading || uploadingBulk ? '⏳ Processing...' : (editing ? '💾 Update Page' : '✨ Create Page')}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => { setShowForm(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                </div>
                {editing && formData.is_enabled && formData.slug && (
                  <a
                    href={`/page/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-preview"
                  >
                    👁️ Preview Page
                  </a>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="enhanced-search-container">
          <div className="enhanced-search-bar">
            <div className="search-input-wrapper-enhanced">
              <span className="search-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages by title, slug, excerpt, or menu label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    searchInputRef.current?.blur();
                  }
                  if (e.key === '/' && e.ctrlKey) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                  }
                }}
                className="search-input-enhanced"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn-enhanced" 
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search (Esc)"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="search-actions">
              <button
                className={`filter-toggle-btn ${showSearchFilters ? 'active' : ''}`}
                onClick={() => setShowSearchFilters(!showSearchFilters)}
                title="Toggle filters"
              >
                <span className="filter-icon">⚙️</span>
                <span className="filter-text">Filters</span>
                {searchFilter !== 'all' && <span className="filter-badge">{searchFilter}</span>}
              </button>
            </div>
          </div>

          {showSearchFilters && (
            <div className="search-filters-panel">
              <div className="filters-header">
                <h4>Filter Pages</h4>
                <button 
                  className="close-filters-btn"
                  onClick={() => setShowSearchFilters(false)}
                >
                  ✕
                </button>
              </div>
              <div className="filters-content">
                <div className="filter-group">
                  <label className="filter-label">Status</label>
                  <div className="filter-options">
                    <button
                      className={`filter-chip ${searchFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSearchFilter('all')}
                    >
                      All Pages
                    </button>
                    <button
                      className={`filter-chip ${searchFilter === 'enabled' ? 'active' : ''}`}
                      onClick={() => setSearchFilter('enabled')}
                    >
                      ✅ Enabled
                    </button>
                    <button
                      className={`filter-chip ${searchFilter === 'disabled' ? 'active' : ''}`}
                      onClick={() => setSearchFilter('disabled')}
                    >
                      ❌ Disabled
                    </button>
                  </div>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Menu</label>
                  <div className="filter-options">
                    <button
                      className={`filter-chip ${searchFilter === 'in_menu' ? 'active' : ''}`}
                      onClick={() => setSearchFilter('in_menu')}
                    >
                      🗂️ In Menu
                    </button>
                    <button
                      className={`filter-chip ${searchFilter === 'featured' ? 'active' : ''}`}
                      onClick={() => setSearchFilter('featured')}
                    >
                      ⭐ Featured
                    </button>
                  </div>
                </div>
                {(searchQuery || searchFilter !== 'all') && (
                  <div className="filter-actions">
                    <button
                      className="clear-all-filters-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchFilter('all');
                        setShowSearchFilters(false);
                      }}
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="search-results-info-enhanced">
            <div className="results-count">
              {searchQuery || searchFilter !== 'all' ? (
                <>
                  <span className="results-number">{pages.length}</span>
                  <span className="results-text">of {totalItems} pages</span>
                  <span className="results-label">matching your search</span>
                </>
              ) : (
                <>
                  <span className="results-number">{totalItems}</span>
                  <span className="results-text">total pages</span>
                </>
              )}
            </div>
            {searchQuery && (
              <div className="search-hint">
                Press <kbd>Esc</kbd> to clear • <kbd>Ctrl</kbd> + <kbd>/</kbd> to focus
              </div>
            )}
          </div>
        </div>

        {pages.length === 0 ? (
          <EmptyState
            title="No Pages Found"
            message={searchQuery ? "No pages match your search criteria." : "Create your first page to get started."}
            actionLabel="Create Page"
            onAction={() => { resetForm(); setShowForm(true); }}
          />
        ) : (
          <>
            {selectedPages.length > 0 && (
              <div className="bulk-actions-bar">
                <div className="bulk-actions-info">
                  <strong>{selectedPages.length}</strong> page(s) selected
                </div>
                <div className="bulk-actions-buttons">
                  <button 
                    onClick={handleBulkDelete}
                    className="btn-bulk-delete"
                    title="Delete selected pages"
                  >
                    🗑️ Delete Selected
                  </button>
                  <button 
                    onClick={() => setSelectedPages([])}
                    className="btn-bulk-clear"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="table-container-enhanced">
              <table className="management-table-enhanced">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedPages.length === pages.length && pages.length > 0}
                        onChange={handleSelectAll}
                        title="Select all"
                      />
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('title')}
                    >
                      <div className="th-content">
                        Title
                        {sortColumn === 'title' && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('slug')}
                    >
                      <div className="th-content">
                        Slug
                        {sortColumn === 'slug' && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th>Menu</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('sort_order')}
                    >
                      <div className="th-content">
                        Order
                        {sortColumn === 'sort_order' && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th>Status</th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="th-content">
                        Created
                        {sortColumn === 'created_at' && (
                          <span className="sort-indicator">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPages.map((page) => (
                    <tr 
                      key={page.id}
                      className={selectedPages.includes(page.id) ? 'row-selected' : ''}
                    >
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => handleSelectPage(page.id)}
                        />
                      </td>
                      <td>
                        <div className="page-title-cell">
                          <strong>{page.title}</strong>
                          {page.is_featured && (
                            <span className="featured-badge" title="Featured page">⭐</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <code className="slug-code">{page.slug}</code>
                      </td>
                      <td>
                        {page.show_in_menu ? (
                          <div className="menu-info">
                            {page.parent_menu ? (
                              <span className="menu-path">
                                <span className="parent-menu">{page.parent_menu}</span>
                                <span className="menu-arrow">→</span>
                                <span className="menu-label">{page.menu_label || page.title}</span>
                              </span>
                            ) : (
                              <span className="badge badge-primary">
                                {page.menu_label || page.title}
                              </span>
                            )}
                            {page.is_submenu && (
                              <span className="submenu-indicator" title="Submenu item">📁</span>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-secondary">Not in menu</span>
                        )}
                      </td>
                      <td>
                        <span className="sort-order-badge">{page.sort_order}</span>
                      </td>
                      <td>
                        <div className="status-cell">
                          <button
                            onClick={() => handleToggleStatus(page)}
                            disabled={togglingStatus === page.id}
                            className={`status-toggle ${page.is_enabled ? 'enabled' : 'disabled'}`}
                            title={`Click to ${page.is_enabled ? 'disable' : 'enable'}`}
                          >
                            {togglingStatus === page.id ? (
                              <span className="spinner">⏳</span>
                            ) : (
                              <>
                                <span className="status-dot"></span>
                                <span className="status-text">{page.is_enabled ? 'Enabled' : 'Disabled'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          {new Date(page.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons-enhanced">
                          {page.is_enabled && (
                            <a
                              href={`/page/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-action btn-view-small"
                              title="View page"
                            >
                              👁️
                            </a>
                          )}
                          <button 
                            onClick={() => handleEdit(page)} 
                            className="btn-action btn-edit-small"
                            title="Edit page"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(page.id)} 
                            className="btn-action btn-delete-small"
                            title="Delete page"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default PagesManagement;

