import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Bot,
    Check,
    ChevronsUpDown,
    Phone,
    Search,
    Users,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useDeferredValue, useState } from 'react';
import InputError from '@/components/input-error';
import TelephonySetupProgress from '@/components/telephony-setup-progress';
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { TelephonyAgent } from '@/types';
import { dashboard } from '@/routes';
import { destroy as destroyAgent } from '@/routes/agents';
import { index as phoneNumbers } from '@/routes/phone-numbers';

type Props = {
    agents: TelephonyAgent[];
    storeUrl: string;
    phoneNumbersCount: number;
    knowledgeSourcesCount: number;
};
type AgentInput = {
    name: string;
    language: string;
    greeting: string;
    instructions: string;
};

const languages = [
    ['en-US', 'English'],
    ['es-ES', 'Spanish'],
    ['zh-CN', 'Mandarin'],
    ['hi-IN', 'Hindi'],
    ['pt-BR', 'Portuguese'],
    ['fr-FR', 'French'],
    ['ar-SA', 'Arabic'],
    ['bn-BD', 'Bengali'],
    ['ru-RU', 'Russian'],
    ['ur-PK', 'Urdu'],
    ['de-DE', 'German'],
    ['ja-JP', 'Japanese'],
    ['ko-KR', 'Korean'],
    ['it-IT', 'Italian'],
    ['tr-TR', 'Turkish'],
    ['vi-VN', 'Vietnamese'],
    ['pl-PL', 'Polish'],
    ['uk-UA', 'Ukrainian'],
    ['nl-NL', 'Dutch'],
    ['el-GR', 'Greek'],
    ['cs-CZ', 'Czech'],
    ['sv-SE', 'Swedish'],
    ['ro-RO', 'Romanian'],
    ['hu-HU', 'Hungarian'],
    ['he-IL', 'Hebrew'],
    ['da-DK', 'Danish'],
    ['fi-FI', 'Finnish'],
    ['nb-NO', 'Norwegian'],
    ['sk-SK', 'Slovak'],
    ['bg-BG', 'Bulgarian'],
    ['hr-HR', 'Croatian'],
    ['sr-RS', 'Serbian'],
    ['ms-MY', 'Malay'],
    ['th-TH', 'Thai'],
    ['id-ID', 'Indonesian'],
    ['fil-PH', 'Filipino'],
    ['sw-KE', 'Swahili'],
    ['fa-IR', 'Persian'],
    ['ta-IN', 'Tamil'],
    ['te-IN', 'Telugu'],
    ['mr-IN', 'Marathi'],
    ['gu-IN', 'Gujarati'],
] as const;

function LanguagePicker({
    value,
    onChange,
    invalid,
}: {
    value: string;
    onChange: (value: string) => void;
    invalid: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = languages.find(([language]) => language === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id="language"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-invalid={invalid}
                    className="w-full justify-between font-normal"
                >
                    {selected?.[1] ?? 'Select a language'}
                    <ChevronsUpDown aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <Command>
                    <CommandInput
                        placeholder="Search languages..."
                        aria-label="Search languages"
                    />
                    <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup heading="Supported languages">
                            {languages.map(([language, label]) => (
                                <CommandItem
                                    key={language}
                                    value={`${label} ${language}`}
                                    onSelect={() => {
                                        onChange(language);
                                        setOpen(false);
                                    }}
                                >
                                    {label}
                                    <Check
                                        className={
                                            value === language
                                                ? 'ml-auto opacity-100'
                                                : 'ml-auto opacity-0'
                                        }
                                        aria-hidden="true"
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function AgentFormDialog({
    agent,
    action,
    storeUrl,
}: {
    agent?: TelephonyAgent;
    action?: string;
    storeUrl: string;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<AgentInput>({
        name: agent?.name ?? '',
        language: agent?.language ?? 'en-US',
        greeting: agent?.greeting ?? '',
        instructions: agent?.instructions ?? '',
    });
    const endpoint = action ?? storeUrl;

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.submit(agent ? 'patch' : 'post', endpoint, {
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
                    variant={agent ? 'outline' : 'default'}
                    size={agent ? 'sm' : 'default'}
                >
                    <Bot data-icon="inline-start" />
                    {agent ? 'Edit' : 'New agent'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {agent ? 'Edit agent' : 'Configure an agent'}
                    </DialogTitle>
                    <DialogDescription>
                        Keep the language and guidance focused on one kind of
                        caller.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="name" label="Name" error={form.errors.name}>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                            />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="language"
                            label="Language"
                            error={form.errors.language}
                        >
                            <LanguagePicker
                                value={form.data.language}
                                onChange={(value) =>
                                    form.setData('language', value)
                                }
                                invalid={Boolean(form.errors.language)}
                            />
                        </Field>
                    </div>
                    <Field
                        id="greeting"
                        label="Greeting"
                        error={form.errors.greeting}
                    >
                        <Textarea
                            id="greeting"
                            value={form.data.greeting}
                            onChange={(event) =>
                                form.setData('greeting', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        id="instructions"
                        label="Instructions"
                        error={form.errors.instructions}
                    >
                        <Textarea
                            id="instructions"
                            value={form.data.instructions}
                            onChange={(event) =>
                                form.setData('instructions', event.target.value)
                            }
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
                                : agent
                                  ? 'Save changes'
                                  : 'Create agent'}
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
    description,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {description && (
                <p
                    id={`${id}-description`}
                    className="text-muted-foreground text-xs"
                >
                    {description}
                </p>
            )}
            <InputError id={`${id}-error`} message={error} />
        </div>
    );
}

export default function AgentsIndex({
    agents,
    storeUrl,
    phoneNumbersCount,
    knowledgeSourcesCount,
}: Props) {
    const [query, setQuery] = useState('');
    const [agentToDelete, setAgentToDelete] = useState<TelephonyAgent | null>(
        null,
    );
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const deferredQuery = useDeferredValue(query.trim().toLowerCase());
    const filteredAgents = agents.filter((agent) =>
        [agent.name, agent.language].some((value) =>
            value.toLowerCase().includes(deferredQuery),
        ),
    );
    const activeAgents = agents.filter((agent) => agent.isActive).length;

    return (
        <>
            <Head title="Agents" />
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
                                Agents
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Build and tune the instructions your team uses
                                on calls.
                            </p>
                        </div>
                        {(agents.length > 0 || phoneNumbersCount > 0) && (
                            <AgentFormDialog storeUrl={storeUrl} />
                        )}
                    </header>
                    <TelephonySetupProgress
                        phoneNumbersCount={phoneNumbersCount}
                        agentsCount={agents.length}
                        knowledgeSourcesCount={knowledgeSourcesCount}
                        currentTeamSlug={teamSlug}
                    />
                    <section
                        className="grid gap-4 sm:grid-cols-4"
                        aria-label="Agent summary"
                    >
                        <SummaryCard
                            label="Total agents"
                            value={agents.length}
                            icon={Users}
                        />
                        <SummaryCard
                            label="Active"
                            value={activeAgents}
                            icon={Bot}
                        />
                        <SummaryCard
                            label="Assigned numbers"
                            value={agents.reduce(
                                (total, agent) =>
                                    total + agent.phoneNumbersCount,
                                0,
                            )}
                            icon={Phone}
                        />
                        <SummaryCard
                            label="Knowledge sources"
                            value={agents.reduce(
                                (total, agent) =>
                                    total + agent.knowledgeSourcesCount,
                                0,
                            )}
                            icon={BookOpen}
                        />
                    </section>
                    <Card>
                        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="size-5" /> Your agents
                                </CardTitle>
                                <CardDescription>
                                    {filteredAgents.length} of {agents.length}{' '}
                                    configured for this team.
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search
                                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                                    aria-hidden="true"
                                />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search agents"
                                    aria-label="Search agents"
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {filteredAgents.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Bot aria-hidden="true" />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            {agents.length === 0
                                                ? 'No agents yet'
                                                : 'No matching agents'}
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            {agents.length === 0
                                                ? phoneNumbersCount > 0
                                                    ? 'Create an agent to give callers a clear, consistent experience.'
                                                    : 'Add a phone number first so callers can reach the agent you create.'
                                                : 'Try a different name or language.'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    {agents.length === 0 &&
                                        (phoneNumbersCount > 0 ? (
                                            <AgentFormDialog
                                                storeUrl={storeUrl}
                                            />
                                        ) : (
                                            <Button asChild>
                                                <Link
                                                    href={
                                                        phoneNumbers(teamSlug)
                                                            .url
                                                    }
                                                >
                                                    <Phone data-icon="inline-start" />
                                                    Add a phone number first
                                                </Link>
                                            </Button>
                                        ))}
                                </Empty>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <div
                                        key={agent.id}
                                        className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                                                <Bot className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-medium">
                                                        {agent.name}
                                                    </h2>
                                                    <Badge
                                                        variant={
                                                            agent.isActive
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {agent.isActive
                                                            ? 'Active'
                                                            : 'Paused'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {agent.language} ·{' '}
                                                    {agent.phoneNumbersCount}{' '}
                                                    assigned number
                                                    {agent.phoneNumbersCount ===
                                                    1
                                                        ? ''
                                                        : 's'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <AgentFormDialog
                                                agent={agent}
                                                action={agent.updateUrl}
                                                storeUrl={storeUrl}
                                            />
                                            {agent.knowledgeUrl && (
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={
                                                            agent.knowledgeUrl
                                                        }
                                                    >
                                                        Knowledge
                                                    </Link>
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setAgentToDelete(agent)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <AlertDialog
                open={agentToDelete !== null}
                onOpenChange={(open) => !open && setAgentToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this agent?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the agent, its sources, assigned
                            numbers, and calls.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (agentToDelete) {
                                    router.delete(
                                        destroyAgent([
                                            teamSlug,
                                            agentToDelete.id,
                                        ]).url,
                                        {
                                            preserveScroll: true,
                                            onFinish: () =>
                                                setAgentToDelete(null),
                                        },
                                    );
                                }
                            }}
                        >
                            Delete agent
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
    icon: typeof Bot;
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
