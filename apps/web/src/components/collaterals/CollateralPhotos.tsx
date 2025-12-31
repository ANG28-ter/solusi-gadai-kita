import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { FiCamera, FiTrash2, FiPlus } from 'react-icons/fi';
import { PageLoader } from '@/components/ui/Loading';
import { ImageViewer } from '@/components/ui/ImageViewer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface CollateralPhotosProps {
    collateralId: string;
    photoUrls: string[];
    onUpdate: () => void;
    editable?: boolean;
}

export const CollateralPhotos: React.FC<CollateralPhotosProps> = ({
    collateralId,
    photoUrls = [],
    onUpdate,
    editable = true
}) => {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerSrc, setViewerSrc] = useState<string>('');

    // Delete Confirmation state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [photoToDeleteIndex, setPhotoToDeleteIndex] = useState<number | null>(null);

    // Construct full image URL
    const getImageUrl = (path: string) => {
        if (!path) return '';
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const origin = baseUrl.replace(/\/api\/v1\/?$/, '');
        return `${origin}${path}`;
    };

    const handleViewImage = (src: string) => {
        setViewerSrc(src);
        setViewerOpen(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Current count + new files
        if (photoUrls.length + files.length > 3) {
            toast.error('Maksimal 3 foto', 'Anda hanya dapat menambahkan total 3 foto');
            return;
        }

        const formData = new FormData();
        let validFiles = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate type
            if (!file.type.match(/^image\/(jpeg|png)$/)) {
                toast.error(`File ${file.name} format tidak didukung`, 'Gunakan JPG atau PNG');
                continue;
            }

            // Validate size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} terlalu besar`, 'Maksimal 5MB');
                continue;
            }

            formData.append('photos', file);
            validFiles++;
        }

        if (validFiles === 0) return;

        setIsUploading(true);
        try {
            await api.post(`/collaterals/${collateralId}/photos`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success(`${validFiles} Foto berhasil diupload`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onUpdate();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Gagal upload foto', error.response?.data?.message || error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteClick = (index: number) => {
        setPhotoToDeleteIndex(index);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (photoToDeleteIndex === null) return;

        const index = photoToDeleteIndex;
        setDeletingIndex(index);

        try {
            await api.delete(`/collaterals/${collateralId}/photos/${index}`);
            toast.success('Foto berhasil dihapus');
            onUpdate();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('Gagal menghapus foto', error.response?.data?.message || error.message);
        } finally {
            setDeletingIndex(null);
            setPhotoToDeleteIndex(null);
            setIsDeleteModalOpen(false);
        }
    };

    const remainingSlots = 3 - photoUrls.length;

    return (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
                Foto Barang ({photoUrls.length}/3)
                {editable && remainingSlots > 0 && (
                    <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<FiPlus />}
                        onClick={() => fileInputRef.current?.click()}
                        loading={isUploading}
                    >
                        Tambah Foto
                    </Button>
                )}
            </h3>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleFileSelect}
            />

            {photoUrls.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">
                    <FiCamera size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada foto</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photoUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50">
                            <img
                                src={getImageUrl(url)}
                                alt={`Collateral ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleViewImage(getImageUrl(url))}
                            />

                            {editable ? (
                                <div
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                    onClick={() => handleViewImage(getImageUrl(url))}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(index);
                                        }}
                                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transform scale-90 hover:scale-100 transition-all"
                                        disabled={deletingIndex === index}
                                        title="Hapus Foto"
                                    >
                                        {deletingIndex === index ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <FiTrash2 size={20} />
                                        )}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ))}

                    {/* Placeholder for remaining slots (optional visuals) */}
                    {Array.from({ length: 3 - photoUrls.length }).map((_, i) => (
                        <div key={`param-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50/50">
                            <span className="text-xs text-gray-300">Empty Slot</span>
                        </div>
                    ))}
                </div>
            )}

            <ImageViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                src={viewerSrc}
                alt="Foto Barang Jaminan"
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Hapus Foto Barang?"
                message="Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                variant="danger"
                loading={deletingIndex !== null}
            />
        </div>
    );
};
