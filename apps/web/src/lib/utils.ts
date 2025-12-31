// Enhanced utility functions for the app

// Format currency to Indonesian Rupiah
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format number with thousand separators
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Format date to Indonesian format
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(d);
}

// Format datetime to Indonesian format
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

// Format date for input[type="date"]
export function formatDateInput(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

// Parse date from input[type="date"]
export function parseDateInput(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
}

// Calculate days between two dates
export function daysBetween(start: string | Date, end: string | Date): number {
    // Handle null/undefined
    if (!start || !end) return 0;

    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    // Check for invalid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Calculate interest
export function calculateInterest(
    principal: number,
    interestRateBps: number,
    days: number
): number {
    // BPS = Basis Points (1 BPS = 0.01%)
    const dailyRate = (interestRateBps / 10000) / 30; // assuming 30 days per month
    return Math.round(principal * dailyRate * days);
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Truncate text
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

// Generate random ID
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Class names helper (similar to clsx but simpler)
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

// Validate NIK (16 digits)
export function validateNIK(nik: string): boolean {
    return /^\d{16}$/.test(nik);
}

// Validate phone number (Indonesian format)
export function validatePhone(phone: string): boolean {
    return /^(08|62)\d{8,11}$/.test(phone.replace(/[\s-]/g, ''));
}

// Format phone number
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('62')) {
        return '+62 ' + cleaned.substring(2).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

// Parse number from formatted string
export function parseNumber(str: string): number {
    return parseInt(str.replace(/\D/g, ''), 10) || 0;
}

// Calculate percentage
export function calculatePercentage(part: number, whole: number): number {
    if (whole === 0) return 0;
    return Math.round((part / whole) * 100);
}

// Add days to date
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Check if date is past
export function isPast(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
}

// Check if date is today
export function isToday(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
}

// Get relative time (e.g., "2 days ago")
export function getRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
    return `${Math.floor(diffDays / 365)} tahun yang lalu`;
}
