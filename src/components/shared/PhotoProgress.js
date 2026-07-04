import React, { useState, useRef, useEffect } from 'react';
import { photoAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Camera, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Reusable photo progress component.
 * Used in ClientProgress.js (client uploads their own) and
 * ClientDetail.js (dietitian views client's photos).
 *
 * Images are fetched via authenticated axios (not a plain <img src="...">),
 * since the backend endpoint requires a JWT bearer token that a raw <img> tag
 * can't send. Each blob is converted to an object URL for display.
 *
 * @param {boolean} canUpload  - true for client, false for dietitian view
 * @param {array}   photos     - list of photo metadata objects
 * @param {function} onRefresh - called after upload/delete to reload the list
 */
export default function PhotoProgress({ canUpload = true, photos = [], onRefresh }) {
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [preview, setPreview] = useState(null);     // lightbox
  const [deleting, setDeleting] = useState(null);
  const [imageUrls, setImageUrls] = useState({});   // { photoId: blobObjectUrl }
  const [loadingImages, setLoadingImages] = useState({});
  const fileRef = useRef();

  // Fetch each photo's image as an authenticated blob and convert to an object URL.
  useEffect(() => {
    let cancelled = false;
    const urlsToRevoke = [];

    const loadImages = async () => {
      for (const p of photos) {
        if (imageUrls[p.id]) continue; // already loaded
        setLoadingImages(prev => ({ ...prev, [p.id]: true }));
        try {
          const res = await photoAPI.getImageBlob(p.id);
          if (cancelled) return;
          const url = URL.createObjectURL(res.data);
          urlsToRevoke.push(url);
          setImageUrls(prev => ({ ...prev, [p.id]: url }));
        } catch (e) {
          console.error('Failed to load photo', p.id, e);
        } finally {
          if (!cancelled) setLoadingImages(prev => ({ ...prev, [p.id]: false }));
        }
      }
    };

    if (photos.length > 0) loadImages();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach(u => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('Image must be under 5MB', 'error'); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('label', label || '');
      fd.append('date', photoDate);
      await photoAPI.upload(fd);
      addToast('Photo uploaded!', 'success');
      setLabel('');
      setPhotoDate(new Date().toISOString().split('T')[0]);
      fileRef.current.value = '';
      onRefresh?.();
    } catch (e) {
      addToast(e.response?.data?.error || 'Upload failed', 'error');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await photoAPI.delete(id);
      if (imageUrls[id]) URL.revokeObjectURL(imageUrls[id]);
      addToast('Photo deleted', 'success');
      onRefresh?.();
    } catch { addToast('Failed to delete photo', 'error'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      {/* Upload section — only for client */}
      {canUpload && (
        <div style={{ background: '#F0F6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Camera size={16} color="#2563EB" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>Add Progress Photo</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
              <label className="form-label">Label (optional)</label>
              <input className="form-input" placeholder="e.g. Front view, Week 4..." value={label} onChange={e => setLabel(e.target.value)} maxLength={50} />
            </div>
            <div className="form-group" style={{ width: 150, marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'Uploading...' : 'Choose Photo & Upload'}
          </button>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, marginBottom: 0 }}>Max 5MB · JPG, PNG, WEBP</p>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="empty-state">
          <Camera size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <div className="empty-state-title">No photos yet</div>
          <div className="empty-state-desc">{canUpload ? 'Upload your first progress photo above.' : 'The client hasn\'t uploaded any progress photos yet.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {photos.map(p => (
            <div key={p.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'white', position: 'relative' }}>
              {/* Image */}
              <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', background: '#F8FAFC', cursor: imageUrls[p.id] ? 'pointer' : 'default' }}
                onClick={() => imageUrls[p.id] && setPreview(p)}>
                {imageUrls[p.id] ? (
                  <>
                    <img
                      src={imageUrls[p.id]}
                      alt={p.label || 'Progress photo'}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ZoomIn size={13} color="white" />
                    </div>
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                    {loadingImages[p.id] ? (
                      <div style={{ width: 24, height: 24, border: '2.5px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <Camera size={28} />
                    )}
                  </div>
                )}
              </div>
              {/* Meta */}
              <div style={{ padding: '8px 10px' }}>
                {p.label && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</div>}
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.photoDate ? format(new Date(p.photoDate), 'MMM d, yyyy') : ''}</div>
              </div>
              {/* Delete — only client sees this */}
              {canUpload && (
                <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                  style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Trash2 size={12} color="white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {preview && imageUrls[preview.id] && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '100%', borderRadius: 14, overflow: 'hidden', background: 'white' }}>
            <img src={imageUrls[preview.id]} alt={preview.label || 'Progress'} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', background: '#000' }} />
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {preview.label && <div style={{ fontWeight: 700, fontSize: 15 }}>{preview.label}</div>}
                <div style={{ fontSize: 13, color: '#94A3B8' }}>{preview.photoDate ? format(new Date(preview.photoDate), 'EEEE, MMMM d, yyyy') : ''}</div>
              </div>
              <button onClick={() => setPreview(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                <X size={14} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
