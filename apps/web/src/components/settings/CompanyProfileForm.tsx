import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loading';

interface CompanyProfileData {
    id: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    logoUrl?: string;
}

interface CompanyProfileProps {
    readOnly?: boolean;
}

export function CompanyProfileForm({ readOnly = false }: CompanyProfileProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<CompanyProfileData>();
    const toast = useToast();
    const [loading, setLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    // Watch all fields for auto-save
    const watchedValues = watch();

    useEffect(() => {
        fetchProfile();
    }, []);

    // Auto-save Logic
    useEffect(() => {
        if (readOnly || loading || !isDirty) return;

        const timer = setTimeout(() => {
            handleSubmit(onSubmit)();
        }, 1000); // Auto-save after 1s of inactivity

        return () => clearTimeout(timer);
    }, [watchedValues, readOnly, loading, isDirty]);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/company-profile');
            const data = response.data;
            if (data) {
                setValue('name', data.name);
                setValue('address', data.address);
                setValue('phone', data.phone);
                setValue('email', data.email);
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: CompanyProfileData) => {
        if (readOnly) return;

        setIsSaving(true);
        try {
            await api.put('/company-profile', data);
            // toast.success('Disimpan otomatis', 'Auto-save'); // Optional: don't spam toasts
        } catch (error: any) {
            console.error('Auto-save failed', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan profil.', 'Gagal');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <PageLoader message="Memuat profil..." />;
    }

    return (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-3xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 max-w-2xl relative shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profil Perusahaan</h2>
                {isSaving && (
                    <span className="text-xs font-medium text-primary animate-pulse">Menyimpan...</span>
                )}
                {!isSaving && !readOnly && isDirty && (
                    <span className="text-xs text-gray-400">Perubahan belum disimpan</span>
                )}
                {!isSaving && !readOnly && !isDirty && (
                    <span className="text-xs text-success">Tersimpan</span>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    label="Nama Perusahaan"
                    {...register('name', { required: 'Nama perusahaan wajib diisi' })}
                    error={errors.name?.message}
                    disabled={readOnly}
                />

                <Input
                    label="Alamat Pusat"
                    {...register('address', { required: 'Alamat wajib diisi' })}
                    error={errors.address?.message}
                    disabled={readOnly}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="No. Telepon"
                        {...register('phone')}
                        placeholder="Contoh: 021-xxxx"
                        disabled={readOnly}
                    />
                    <Input
                        label="Email"
                        type="email"
                        {...register('email')}
                        placeholder="admin@example.com"
                        disabled={readOnly}
                    />
                </div>

                {!readOnly && (
                    <div className="pt-4 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 rounded-b-3xl border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 italic">
                            Saved automatically
                        </p>
                        <Button type="submit" loading={isSaving}>
                            Simpan Perubahan
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
