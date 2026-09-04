import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    CircleAlert,
    Clock3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import type { KnowledgeAgent } from '@/types';

type Props = { agents: KnowledgeAgent[] };

export default function KnowledgeIndex({ agents }: Props) {
    return (
        <>
            <Head title="Knowledge" />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <header className="border-b pb-6">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Knowledge
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            See which agents have sources connected and where
                            processing needs attention.
                        </p>
                    </header>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen
                                    className="size-5"
                                    aria-hidden="true"
                                />
                                Agent knowledge
                            </CardTitle>
                            <CardDescription>
                                {agents.length} agent
                                {agents.length === 1 ? '' : 's'} in this team
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {agents.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <BookOpen aria-hidden="true" />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            Create an agent first
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Once an agent exists, you can
                                            connect knowledge sources to it.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                agents.map((agent) => (
                                    <article
                                        key={agent.id}
                                        className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div>
                                            <h2 className="font-medium">
                                                {agent.name}
                                            </h2>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                {agent.sourceCount} source
                                                {agent.sourceCount === 1
                                                    ? ''
                                                    : 's'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {agent.statuses.ready > 0 && (
                                                    <Badge>
                                                        <CheckCircle2 data-icon="inline-start" />
                                                        {agent.statuses.ready}{' '}
                                                        ready
                                                    </Badge>
                                                )}
                                                {agent.statuses.processing +
                                                    agent.statuses.pending >
                                                    0 && (
                                                    <Badge variant="secondary">
                                                        <Clock3 data-icon="inline-start" />
                                                        {agent.statuses
                                                            .processing +
                                                            agent.statuses
                                                                .pending}{' '}
                                                        processing
                                                    </Badge>
                                                )}
                                                {agent.statuses.failed > 0 && (
                                                    <Badge variant="destructive">
                                                        <CircleAlert data-icon="inline-start" />
                                                        {agent.statuses.failed}{' '}
                                                        failed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Link
                                            href={agent.sourcesUrl}
                                            className="text-primary inline-flex items-center gap-2 text-sm font-medium"
                                        >
                                            Manage sources
                                            <ArrowRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
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
