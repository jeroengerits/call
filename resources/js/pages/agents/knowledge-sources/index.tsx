import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, RefreshCw, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
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
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { index as agents } from '@/routes/agents';
import {
    destroy as destroySource,
    retry as retrySource,
} from '@/routes/knowledge-sources';

type Source = {
    id: number;
    type: 'url' | 'text' | 'attachment';
    title: string | null;
    url: string | null;
    originalFilename: string | null;
    fileSize: number | null;
    status: 'pending' | 'processing' | 'ready' | 'failed';
    errorMessage: string | null;
};
type Props = {
    agent: { id: number; name: string };
    knowledgeSources: Source[];
    storeUrl?: string;
};
type SourceInput = {
    type: Source['type'];
    title: string;
    url: string;
    content: string;
    attachment: File | null;
};

const labels: Record<Source['type'], string> = {
    url: 'URL',
    text: 'Text',
    attachment: 'Attachment',
};

function statusVariant(
    status: Source['status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
    return status === 'failed'
        ? 'destructive'
        : status === 'ready'
          ? 'default'
          : 'secondary';
}

function formatFileSize(size: number | null): string | null {
    if (size === null) return null;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function SourceForm({
    storeUrl,
    onSuccess,
}: {
    storeUrl: string;
    onSuccess: () => void;
}) {
    const form = useForm<SourceInput>({
        type: 'url',
        title: '',
        url: '',
        content: '',
        attachment: null,
    });

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(storeUrl, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onSuccess();
            },
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-5">
            <Tabs
                value={form.data.type}
                onValueChange={(value) =>
                    form.setData('type', value as Source['type'])
                }
            >
                <TabsList className="grid w-full grid-cols-3">
                    {(Object.keys(labels) as Source['type'][]).map((type) => (
                        <TabsTrigger key={type} value={type}>
                            {labels[type]}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <p className="text-muted-foreground mt-2 text-xs">
                    Choose how this source should be added to the agent.
                </p>
                <InputError id="source-type-error" message={form.errors.type} />
                <TabsContent value="url" className="mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="source-url">URL</Label>
                        <Input
                            id="source-url"
                            type="url"
                            placeholder="https://example.com/help"
                            value={form.data.url}
                            onChange={(event) =>
                                form.setData('url', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.url)}
                            required
                        />
                        <InputError
                            id="source-url-error"
                            message={form.errors.url}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="source-content">Text content</Label>
                        <Textarea
                            id="source-content"
                            className="min-h-36"
                            value={form.data.content}
                            onChange={(event) =>
                                form.setData('content', event.target.value)
                            }
                            aria-invalid={Boolean(form.errors.content)}
                            required
                        />
                        <InputError
                            id="source-content-error"
                            message={form.errors.content}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="attachment" className="mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="source-attachment">Attachment</Label>
                        <Input
                            id="source-attachment"
                            type="file"
                            accept=".txt,.md,.pdf,.csv,.json"
                            onChange={(event) =>
                                form.setData(
                                    'attachment',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            aria-invalid={Boolean(form.errors.attachment)}
                            aria-describedby="source-attachment-help source-attachment-error"
                            required
                        />
                        <p
                            id="source-attachment-help"
                            className="text-muted-foreground text-xs"
                        >
                            TXT, MD, PDF, CSV, or JSON up to 10 MB.
                        </p>
                        <InputError
                            id="source-attachment-error"
                            message={form.errors.attachment}
                        />
                    </div>
                </TabsContent>
            </Tabs>
            <div className="grid gap-2">
                <Label htmlFor="source-title">Title</Label>
                <Input
                    id="source-title"
                    value={form.data.title}
                    onChange={(event) =>
                        form.setData('title', event.target.value)
                    }
                    aria-invalid={Boolean(form.errors.title)}
                    aria-describedby={
                        form.errors.title ? 'source-title-error' : undefined
                    }
                    required
                />
                <InputError
                    id="source-title-error"
                    message={form.errors.title}
                />
            </div>
            <Button type="submit" disabled={form.processing}>
                {form.processing ? 'Adding source...' : 'Add source'}
            </Button>
        </form>
    );
}

export default function KnowledgeSourcesIndex({
    agent,
    knowledgeSources,
    storeUrl,
}: Props) {
    const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
    const endpoint = storeUrl ?? `${window.location.pathname}`;
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const remove = () => {
        if (!sourceToDelete) return;
        router.delete(
            destroySource([teamSlug, agent.id, sourceToDelete.id]).url,
            {
                preserveScroll: true,
                onFinish: () => setSourceToDelete(null),
            },
        );
    };

    return (
        <>
            <Head title={`Knowledge sources · ${agent.name}`} />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-5xl flex-col gap-6">
                    <header className="border-b pb-6">
                        <Link
                            href={agents(teamSlug).url}
                            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back to agents
                        </Link>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Knowledge sources
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Give {agent.name} reliable context from documents,
                            websites, and notes.
                        </p>
                    </header>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                    Add a source
                                </CardTitle>
                                <CardDescription>
                                    Sources are processed before they become
                                    available to calls.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SourceForm
                                    storeUrl={endpoint}
                                    onSuccess={() => undefined}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Connected sources</CardTitle>
                                <CardDescription>
                                    {knowledgeSources.length} source
                                    {knowledgeSources.length === 1 ? '' : 's'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                {knowledgeSources.length === 0 ? (
                                    <Empty className="py-8">
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <BookOpen aria-hidden="true" />
                                            </EmptyMedia>
                                            <EmptyTitle>
                                                No sources yet
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Add a URL, text note, or
                                                attachment to start building
                                                this agent&apos;s knowledge.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    knowledgeSources.map((source) => (
                                        <article
                                            key={source.id}
                                            className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-medium">
                                                        {source.title ||
                                                            'Untitled source'}
                                                    </h2>
                                                    <Badge variant="outline">
                                                        {labels[source.type]}
                                                    </Badge>
                                                    <Badge
                                                        variant={statusVariant(
                                                            source.status,
                                                        )}
                                                    >
                                                        {source.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-2 truncate text-sm">
                                                    {source.url ??
                                                        source.originalFilename ??
                                                        formatFileSize(
                                                            source.fileSize,
                                                        ) ??
                                                        'Text source'}
                                                </p>
                                                {source.errorMessage && (
                                                    <p
                                                        className="text-destructive mt-1 text-sm"
                                                        role="alert"
                                                    >
                                                        {source.errorMessage}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-2">
                                                {source.status === 'failed' && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(
                                                                retrySource([
                                                                    teamSlug,
                                                                    agent.id,
                                                                    source.id,
                                                                ]).url,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <RefreshCw
                                                            data-icon="inline-start"
                                                            aria-hidden="true"
                                                        />
                                                        Retry
                                                    </Button>
                                                )}
                                                <AlertDialog
                                                    open={
                                                        sourceToDelete?.id ===
                                                        source.id
                                                    }
                                                    onOpenChange={(open) => {
                                                        if (!open)
                                                            setSourceToDelete(
                                                                null,
                                                            );
                                                    }}
                                                >
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setSourceToDelete(
                                                                    source,
                                                                )
                                                            }
                                                        >
                                                            <Trash2
                                                                data-icon="inline-start"
                                                                aria-hidden="true"
                                                            />
                                                            Remove
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Remove this
                                                                source?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will
                                                                permanently
                                                                remove{' '}
                                                                {source.title ||
                                                                    'this knowledge source'}{' '}
                                                                from{' '}
                                                                {agent.name}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={remove}
                                                            >
                                                                Remove source
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    );
}
