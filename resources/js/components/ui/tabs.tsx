import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = { value: string; setValue: (value: string) => void };
const TabsContext = React.createContext<TabsContextValue | null>(null);

function Tabs({ value, defaultValue, onValueChange, className, children }: {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}) {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
    const activeValue = value ?? internalValue;
    const setValue = (nextValue: string) => {
        if (value === undefined) setInternalValue(nextValue);
        onValueChange?.(nextValue);
    };

    return <TabsContext.Provider value={{ value: activeValue, setValue }}><div className={cn('flex flex-col gap-2', className)}>{children}</div></TabsContext.Provider>;
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div role="tablist" className={cn('bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1', className)}>{children}</div>;
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const tabs = React.useContext(TabsContext);
    const active = tabs?.value === value;

    return <button type="button" role="tab" aria-selected={active} tabIndex={active ? 0 : -1} onClick={() => tabs?.setValue(value)} className={cn('text-foreground focus-visible:ring-ring/50 inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-[3px] data-[state=active]:bg-background data-[state=active]:shadow-sm', active && 'bg-background shadow-sm', className)} data-state={active ? 'active' : 'inactive'}>{children}</button>;
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const tabs = React.useContext(TabsContext);
    if (tabs?.value !== value) return null;

    return <div role="tabpanel" className={cn('outline-none', className)}>{children}</div>;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
