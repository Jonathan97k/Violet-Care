import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { addPhoto } from '../../utils/db';
import { haptics } from '../../utils/haptics';

interface PhotoUploadProps {
  onUploadComplete?: (photoId: string) => void;
  caption?: string;
  date?: string;
  showInline?: boolean;
}

const PhotoUpload = ({ onUploadComplete, caption = '', date, showInline = false }: PhotoUploadProps) => {
  const [, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState(caption);
  const [photoDate, setPhotoDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      if (showInline) {
        setShowModal(true);
      }
    };
    reader.readAsDataURL(file);
    
    haptics.light();
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsUploading(true);

    try {
      const photoId = crypto.randomUUID();
      await addPhoto({
        id: photoId,
        data: preview,
        caption: photoCaption.trim(),
        date: photoDate,
        createdAt: new Date().toISOString(),
      });

      haptics.success();
      
      if (onUploadComplete) {
        onUploadComplete(photoId);
      }

      // Reset
      setSelectedFile(null);
      setPreview(null);
      setPhotoCaption('');
      setShowModal(false);

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error('Failed to upload photo:', error);
      haptics.error();
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setPhotoCaption(caption);
    setShowModal(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    
    haptics.light();
  };

  const TriggerButtons = () => (
    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => cameraInputRef.current?.click()}
        className="flex-1 py-3 bg-violet-500/20 border border-violet-400/40 text-white rounded-xl font-dm-sans text-sm flex items-center justify-center gap-2 hover:bg-violet-500/30 transition-colors"
      >
        <Camera size={18} />
        Take Photo
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-dm-sans text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
      >
        <Upload size={18} />
        Choose File
      </motion.button>
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  const UploadModal = () => (
    <AnimatePresence>
      {(showModal || (!showInline && preview)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1a0533] border border-white/15 rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-playfair text-lg flex items-center gap-2">
                <ImageIcon size={20} className="text-violet-400" />
                Add Photo
              </h3>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg transition-colors"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-center p-6">
                  <FileImage size={48} className="text-white/30 mb-3" />
                  <p className="text-white/60 text-sm font-dm-sans mb-4">
                    Take a photo or choose from your gallery
                  </p>
                  <TriggerButtons />
                </div>
              )}

              {preview && (
                <>
                  <div>
                    <label className="block text-white/80 text-sm font-dm-sans mb-2">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-dm-sans mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 disabled:cursor-not-allowed text-white rounded-xl font-dm-sans font-medium transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Save Photo
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancel}
                      disabled={isUploading}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl font-dm-sans transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (showInline) {
    return (
      <>
        <TriggerButtons />
        <UploadModal />
      </>
    );
  }

  return <UploadModal />;
};

export default PhotoUpload;
