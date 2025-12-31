import React, { useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface BranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    branch?: {
        id: string;
        name: string;
        address?: string;
        phone?: string;
    } | null;
}

interface FormData {
    code: string;
    name: string;
    address: string;
    phone: string;
}

export function BranchModal({ isOpen, onClose, onSuccess, branch }: BranchModalProps) {
    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>();
    const toast = useToast();
    const isEditing = !!branch;

    useEffect(() => {
        if (branch) {
            // @ts-ignore - branch might not have code in type def yet but API returns it
            setValue('code', branch.code || '');
            setValue('name', branch.name);
            setValue('address', branch.address || '');
            setValue('phone', branch.phone || '');
        } else {
            reset({
                code: '',
                name: '',
                address: '',
                phone: '',
            });
        }
    }, [branch, setValue, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        try {
            if (isEditing && branch) {
                await api.put(`/system/branches/${branch.id}`, data);
                toast.success('Data cabang berhasil diperbarui.', 'Berhasil');
            } else {
                await api.post('/system/branches', data);
                toast.success('Cabang baru berhasil ditambahkan.', 'Berhasil');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.', 'Gagal');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Cabang' : 'Tambah Cabang'}
            size="sm"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Kode Cabang (Singkatan)"
                    {...register('code', {
                        required: 'Kode cabang wajib diisi',
                        minLength: { value: 2, message: 'Minimal 2 karakter' },
                        maxLength: { value: 5, message: 'Maksimal 5 karakter' }
                    })}
                    error={errors.code?.message}
                    placeholder="Contoh: BDG"
                    className="uppercase"
                    maxLength={5}
                />

                <Input
                    label="Nama Cabang"
                    {...register('name', { required: 'Nama cabang wajib diisi' })}
                    error={errors.name?.message}
                    placeholder="Contoh: Cabang Pusat"
                />

                <Input
                    label="Alamat"
                    {...register('address')}
                    placeholder="Alamat lengkap cabang"
                    className="h-24"
                />

                <Input
                    label="No. Telepon"
                    {...register('phone')}
                    placeholder="021-xxxxxxx"
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        {isEditing ? 'Simpan Perubahan' : 'Tambah Cabang'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
