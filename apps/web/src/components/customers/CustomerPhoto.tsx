import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { FiCamera, FiTrash2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import { PageLoader } from '@/components/ui/Loading';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface CustomerPhotoProps {
    customerId: string;
    photoUrl?: string | null;
    onUpdate: () => void;
    editable?: boolean;
}

export const CustomerPhoto: React.FC<CustomerPhotoProps> = ({
    customerId,
    photoUrl,
    onUpdate,
    editable = true
}) => {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerSrc, setViewerSrc] = useState<string>('');

    // Delete Confirmation state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Construct full image URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        // Remove /api/v1 suffix if present to get the root origin
        const origin = baseUrl.replace(/\/api\/v1\/?$/, '');
        return `${origin}${path}`;
    };

    const handleViewImage = (src: string) => {
        setViewerSrc(src);
        setViewerOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toast.error('Format file tidak didukung', 'Gunakan JPG atau PNG');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File terlalu besar', 'Maksimal 5MB');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('photo', selectedFile);

        try {
            await api.post(`/customers/${customerId}/photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Foto berhasil diupload');
            handleCancel();
            onUpdate();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Gagal upload foto', error.response?.data?.message || error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/customers/${customerId}/photo`);
            toast.success('Foto berhasil dihapus');
            onUpdate();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('Gagal menghapus foto', error.response?.data?.message || error.message);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
            />

            <div className="relative group">
                {/* Image Container */}
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-md flex items-center justify-center relative bg-white dark:bg-gray-800">
                    {isUploading || isDeleting ? (
                        <PageLoader message="Processing..." />
                    ) : previewUrl ? (
                        /* Preview Mode */
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleViewImage(previewUrl)}
                        />
                    ) : photoUrl ? (
                        /* Display Existing Photo */
                        <img
                            src={getImageUrl(photoUrl)}
                            alt="Customer Photo"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image'; // Fallback
                            }}
                            onClick={() => handleViewImage(getImageUrl(photoUrl))}
                        />
                    ) : (
                        /* Placeholder */
                        <div className="flex flex-col items-center text-gray-400">
                            <FiCamera size={48} />
                            <span className="text-xs mt-2">No Photo</span>
                        </div>
                    )}
                </div>

                {/* Edit Overlay (only when not previewing) */}
                {editable && !previewUrl && !isUploading && !isDeleting && (
                    <div className="absolute bottom-0 right-0 gap-2 flex">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all"
                            title="Upload Foto"
                        >
                            <FiCamera size={20} />
                        </button>
                        {photoUrl && (
                            <button
                                onClick={handleDeleteClick}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-all"
                                title="Hapus Foto"
                            >
                                <FiTrash2 size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons for Preview Mode */}
            {previewUrl && !isUploading && (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<FiX />}
                        onClick={handleCancel}
                    >
                        Batal
                    </Button>
                    <Button
                        size="sm"
                        leftIcon={<FiCheck />}
                        onClick={handleUpload}
                        loading={isUploading}
                    >
                        Simpan
                    </Button>
                </div>
            )}

            <ImageViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                src={viewerSrc}
                alt="Foto Nasabah"
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Foto Nasabah?"
                message="Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
};
