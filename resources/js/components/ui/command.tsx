import * as React from 'react';
import { cn } from '@/lib/utils';

const Command = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)} {...props} />;
const CommandInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => <input ref={ref} className={cn('border-b bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground', className)} {...props} />);
CommandInput.displayName = 'CommandInput';
const CommandList = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('max-h-72 overflow-y-auto overflow-x-hidden', className)} {...props} />;
const CommandEmpty = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('py-6 text-center text-sm', className)} {...props} />;
const CommandGroup = ({ className, heading, children, ...props }: React.ComponentProps<'div'> & { heading?: string }) => <div className={cn('overflow-hidden p-1 text-foreground', className)} {...props}>{heading && <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{heading}</div>}{children}</div>;
const CommandItem = ({ className, ...props }: React.ComponentProps<'button'>) => <button type="button" className={cn('relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground', className)} {...props} />;

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
