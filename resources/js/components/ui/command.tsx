import * as React from 'react';
import { cn } from '@/lib/utils';

const CommandContext = React.createContext<{ search: string; setSearch: (value: string) => void; register: (visible: boolean) => () => void; matches: number }>({ search: '', setSearch: () => undefined, register: () => () => undefined, matches: 0 });
const Command = ({ className, ...props }: React.ComponentProps<'div'>) => {
    const [search, setSearch] = React.useState('');
    const [matches, setMatches] = React.useState(0);
    const register = React.useCallback((visible: boolean) => {
        if (visible) setMatches((count) => count + 1);
        return () => { if (visible) setMatches((count) => Math.max(0, count - 1)); };
    }, []);
    return <CommandContext.Provider value={{ search, setSearch, register, matches }}><div className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)} {...props} /></CommandContext.Provider>;
};
const CommandInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, onChange, ...props }, ref) => {
    const { setSearch } = React.useContext(CommandContext);
    return <input ref={ref} className={cn('border-b bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground', className)} onChange={(event) => { setSearch(event.target.value); onChange?.(event); }} {...props} />;
});
CommandInput.displayName = 'CommandInput';
const CommandList = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('max-h-72 overflow-y-auto overflow-x-hidden', className)} {...props} />;
const CommandEmpty = ({ className, ...props }: React.ComponentProps<'div'>) => {
    const { matches } = React.useContext(CommandContext);
    return matches === 0 ? <div className={cn('py-6 text-center text-sm', className)} {...props} /> : null;
};
const CommandGroup = ({ className, heading, children, ...props }: React.ComponentProps<'div'> & { heading?: string }) => <div className={cn('overflow-hidden p-1 text-foreground', className)} {...props}>{heading && <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{heading}</div>}{children}</div>;
const CommandItem = ({ className, value, children, ...props }: React.ComponentProps<'button'> & { value?: string }) => {
    const { search, register } = React.useContext(CommandContext);
    const visible = !value || value.toLowerCase().includes(search.toLowerCase());
    React.useEffect(() => register(visible), [register, visible]);
    if (!visible) return null;
    return <button type="button" className={cn('relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground', className)} {...props}>{children}</button>;
};

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
