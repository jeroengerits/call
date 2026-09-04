import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Phone, Search, Users } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useDeferredValue, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { TelephonyAgent, TelephonyPhoneNumber } from '@/types';
import { dashboard } from '@/routes';
import { destroy as destroyPhoneNumber } from '@/routes/phone-numbers';

type PhoneNumber = TelephonyPhoneNumber & { updateUrl?: string };
type Props = {
    phoneNumbers: PhoneNumber[];
    agents: Pick<TelephonyAgent, 'id' | 'name'>[];
    storeUrl: string;
};
type NumberInput = { agent_id: string; number: string };

function NumberDialog({
    number,
    agents,
    action,
    storeUrl,
}: {
    number?: PhoneNumber;
    agents: Props['agents'];
    action?: string;
    storeUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<NumberInput>({
        agent_id: number?.agentId != null ? String(number.agentId) : '',
        number: number?.number ?? '',
    });
    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.submit(number ? 'patch' : 'post', action ?? storeUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={number ? 'outline' : 'default'}
                    size={number ? 'sm' : 'default'}
                >
                    <Phone data-icon="inline-start" />
                    {number ? 'Edit' : 'Add number'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {number ? 'Edit phone number' : 'Add a phone number'}
                    </DialogTitle>
                    <DialogDescription>
                        Add a number already owned by your team.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="number-agent">Agent</Label>
                        <Select
                            value={form.data.agent_id}
                            onValueChange={(value) =>
                                form.setData(
                                    'agent_id',
                                    value === '__unassigned' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger id="number-agent">
                                <SelectValue placeholder="Leave unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__unassigned">
                                    Leave unassigned
                                </SelectItem>
                                {agents.map((agent) => (
                                    <SelectItem
                                        key={agent.id}
                                        value={String(agent.id)}
                                    >
                                        {agent.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.agent_id} />
                    </div>
                    <Field
                        id="number"
                        label="Phone number"
                        error={form.errors.number}
                    >
                        <Input
                            id="number"
                            value={form.data.number}
                            onChange={(event) =>
                                form.setData('number', event.target.value)
                            }
                            placeholder="+1 555 010 1234"
                            required
                        />
                    </Field>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Saving...'
                                : number
                                  ? 'Save changes'
                                  : 'Add number'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError id={`${id}-error`} message={error} />
        </div>
    );
}

export default function PhoneNumbersIndex({
    phoneNumbers,
    agents,
    storeUrl,
}: Props) {
    const [query, setQuery] = useState('');
    const [numberToDelete, setNumberToDelete] = useState<PhoneNumber | null>(
        null,
    );
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const deferredQuery = useDeferredValue(query.trim().toLowerCase());
    const filteredNumbers = phoneNumbers.filter((phoneNumber) =>
        [phoneNumber.number, phoneNumber.agentName ?? ''].some((value) =>
            value.toLowerCase().includes(deferredQuery),
        ),
    );
    const activeNumbers = phoneNumbers.filter(
        (phoneNumber) => phoneNumber.isActive,
    ).length;

    return (
        <>
            <Head title="Phone numbers" />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link
                                href={dashboard(teamSlug).url}
                                className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
                            >
                                <ArrowLeft className="size-4" /> Back to
                                dashboard
                            </Link>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                Phone numbers
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Assign the numbers your team already owns to an
                                agent.
                            </p>
                        </div>
                        <NumberDialog agents={agents} storeUrl={storeUrl} />
                    </header>
                    <section
                        className="grid gap-4 sm:grid-cols-3"
                        aria-label="Phone number summary"
                    >
                        <SummaryCard
                            label="Connected"
                            value={phoneNumbers.length}
                            icon={Phone}
                        />
                        <SummaryCard
                            label="Active"
                            value={activeNumbers}
                            icon={Phone}
                        />
                        <SummaryCard
                            label="Agents with numbers"
                            value={
                                new Set(
                                    phoneNumbers.map(
                                        (phoneNumber) => phoneNumber.agentId,
                                    ),
                                ).size
                            }
                            icon={Users}
                        />
                    </section>
                    <Card>
                        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="size-5" /> Connected
                                    numbers
                                </CardTitle>
                                <CardDescription>
                                    {filteredNumbers.length} of{' '}
                                    {phoneNumbers.length} connected to this
                                    team.
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search
                                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                                    aria-hidden="true"
                                />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search number or agent"
                                    aria-label="Search phone numbers"
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredNumbers.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Phone />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            {phoneNumbers.length === 0
                                                ? 'No numbers yet'
                                                : 'No matching numbers'}
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            {phoneNumbers.length === 0
                                                ? 'Add a Twilio number manually to make an agent reachable.'
                                                : 'Try a different number, agent, or Twilio SID.'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    {phoneNumbers.length === 0 && (
                                        <NumberDialog
                                            agents={agents}
                                            storeUrl={storeUrl}
                                        />
                                    )}
                                </Empty>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredNumbers.map((number) => (
                                        <div
                                            key={number.id}
                                            className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-medium">
                                                        {number.number}
                                                    </h2>
                                                    <Badge
                                                        variant={
                                                            number.isActive
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {number.isActive
                                                            ? 'Active'
                                                            : 'Paused'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {number.agentName ??
                                                        'Unassigned'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <NumberDialog
                                                    number={number}
                                                    agents={agents}
                                                    action={number.updateUrl}
                                                    storeUrl={storeUrl}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setNumberToDelete(
                                                            number,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <AlertDialog
                open={numberToDelete !== null}
                onOpenChange={(open) => !open && setNumberToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Remove this phone number?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove {numberToDelete?.number} from this
                            team.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (numberToDelete) {
                                    router.delete(
                                        destroyPhoneNumber([
                                            teamSlug,
                                            numberToDelete.id,
                                        ]).url,
                                        {
                                            preserveScroll: true,
                                            onFinish: () =>
                                                setNumberToDelete(null),
                                        },
                                    );
                                }
                            }}
                        >
                            Remove number
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function SummaryCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: typeof Phone;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>
                </div>
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                    <Icon aria-hidden="true" />
                </div>
            </CardContent>
        </Card>
    );
}
