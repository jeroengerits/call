import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BookOpen, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Agent = {
    id: number;
    name: string;
};

type KnowledgeSource = {
    id: number;
    type: string;
    title: string | null;
    url: string | null;
    originalFilename: string | null;
    fileSize: number | null;
    status: string;
    errorMessage: string | null;
};

type Props = {
    agent: Agent;
    knowledgeSources: KnowledgeSource[];
};

function label(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFileSize(fileSize: number | null): string | null {
    if (fileSize === null) {
        return null;
    }

    if (fileSize < 1024) {
        return `${fileSize} B`;
    }

    return `${(fileSize / 1024).toFixed(1)} KB`;
}

export default function KnowledgeSourcesIndex({
    agent,
    knowledgeSources,
}: Props) {
    function sourceUrl(sourceId: number, action?: string): string {
        return `${window.location.pathname}/${sourceId}${action ? `/${action}` : ''}`;
    }

    function retry(sourceId: number): void {
        router.post(sourceUrl(sourceId, 'retry'), {}, { preserveScroll: true });
    }

    function remove(sourceId: number): void {
        if (window.confirm('Remove this knowledge source?')) {
            router.delete(sourceUrl(sourceId), { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={`Knowledge sources · ${agent.name}`} />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-4xl flex-col gap-6">
                    <header className="border-b pb-6">
                        <Link
                            href="../../"
                            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back to agents
                        </Link>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Knowledge sources
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Sources connected to {agent.name}.
                        </p>
                    </header>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen
                                    className="size-5"
                                    aria-hidden="true"
                                />
                                Sources
                            </CardTitle>
                            <CardDescription>
                                {knowledgeSources.length} source
                                {knowledgeSources.length === 1 ? '' : 's'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {knowledgeSources.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center">
                                    No knowledge sources have been added yet.
                                </p>
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
                                                    {label(source.type)}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        source.status ===
                                                        'failed'
                                                            ? 'destructive'
                                                            : source.status ===
                                                                'ready'
                                                              ? 'default'
                                                              : 'secondary'
                                                    }
                                                >
                                                    {label(source.status)}
                                                </Badge>
                                            </div>
                                            <dl className="text-muted-foreground mt-2 grid gap-1 text-sm">
                                                {source.originalFilename ? (
                                                    <div>
                                                        <dt className="sr-only">
                                                            Filename
                                                        </dt>
                                                        <dd>
                                                            {
                                                                source.originalFilename
                                                            }
                                                        </dd>
                                                    </div>
                                                ) : null}
                                                {source.url ? (
                                                    <div className="truncate">
                                                        <dt className="sr-only">
                                                            URL
                                                        </dt>
                                                        <dd>{source.url}</dd>
                                                    </div>
                                                ) : null}
                                                {formatFileSize(
                                                    source.fileSize,
                                                ) ? (
                                                    <div>
                                                        <dt className="sr-only">
                                                            File size
                                                        </dt>
                                                        <dd>
                                                            {formatFileSize(
                                                                source.fileSize,
                                                            )}
                                                        </dd>
                                                    </div>
                                                ) : null}
                                                {source.errorMessage ? (
                                                    <div className="text-destructive">
                                                        <dt className="sr-only">
                                                            Error
                                                        </dt>
                                                        <dd>
                                                            {
                                                                source.errorMessage
                                                            }
                                                        </dd>
                                                    </div>
                                                ) : null}
                                            </dl>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            {source.status === 'failed' ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        retry(source.id)
                                                    }
                                                >
                                                    <RefreshCw
                                                        data-icon="inline-start"
                                                        aria-hidden="true"
                                                    />
                                                    Retry
                                                </Button>
                                            ) : null}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    remove(source.id)
                                                }
                                            >
                                                <Trash2
                                                    data-icon="inline-start"
                                                    aria-hidden="true"
                                                />
                                                Remove
                                            </Button>
                                        </div>
                                    </article>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
