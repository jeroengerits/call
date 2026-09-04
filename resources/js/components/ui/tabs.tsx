import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = { value: string; setValue: (value: string) => void; id: string };
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

    const id = React.useId();
    return <TabsContext.Provider value={{ value: activeValue, setValue, id }}><div className={cn('flex flex-col gap-2', className)}>{children}</div></TabsContext.Provider>;
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div role="tablist" aria-orientation="horizontal" className={cn('bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-1', className)}>{children}</div>;
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const tabs = React.useContext(TabsContext);
    const active = tabs?.value === value;

    const triggerId = `${tabs?.id}-tab-${value}`;
    const panelId = `${tabs?.id}-tabpanel-${value}`;
    return <button id={triggerId} type="button" role="tab" aria-controls={panelId} aria-selected={active} tabIndex={active ? 0 : -1} onKeyDown={(event) => {
        if (!tabs) return;
        const triggers = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
        const index = triggers.indexOf(event.currentTarget);
        const next = event.key === 'ArrowRight' ? (index + 1) % triggers.length : event.key === 'ArrowLeft' ? (index - 1 + triggers.length) % triggers.length : -1;
        if (next >= 0) { event.preventDefault(); triggers[next].focus(); triggers[next].click(); }
    }} onClick={() => tabs?.setValue(value)} className={cn('text-foreground focus-visible:ring-ring/50 inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-[3px] data-[state=active]:bg-background data-[state=active]:shadow-sm', active && 'bg-background shadow-sm', className)} data-state={active ? 'active' : 'inactive'}>{children}</button>;
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const tabs = React.useContext(TabsContext);
    if (tabs?.value !== value) return null;

    return <div id={`${tabs?.id}-tabpanel-${value}`} role="tabpanel" aria-labelledby={`${tabs?.id}-tab-${value}`} tabIndex={0} className={cn('outline-none', className)}>{children}</div>;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
