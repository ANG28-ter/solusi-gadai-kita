import React from 'react';
import { Modal } from './Modal';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    alt?: string;
}

export function ImageViewer({ isOpen, onClose, src, alt = 'Image' }: ImageViewerProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Lihat Foto"
            size="xl"
        >
            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-[80vh] object-contain rounded"
                />
            </div>
        </Modal>
    );
}
