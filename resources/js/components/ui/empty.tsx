import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Empty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)} {...props} />;
}

export function EmptyHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col items-center gap-2', className)} {...props} />;
}

export function EmptyMedia({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: 'icon' | 'default' }) {
    return <div className={cn('bg-muted flex size-10 items-center justify-center rounded-lg', className)} {...props}>{children}</div>;
}

export function EmptyTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn('font-semibold', className)} {...props} />;
}

export function EmptyDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn('text-muted-foreground max-w-sm text-sm', className)} {...props} />;
}
