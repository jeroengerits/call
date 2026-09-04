import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock3, Phone } from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { TelephonyCall } from '@/types';
import { index as phoneNumbers } from '@/routes/phone-numbers';
import { index as calls } from '@/routes/calls';

type Props = {
    calls: {
        data: TelephonyCall[];
        current_page: number;
        last_page: number;
        total: number;
    };
    limit: number;
    summary: { total: number; completed: number };
};

export default function CallHistoryIndex({
    calls: paginatedCalls,
    limit,
    summary,
}: Props) {
    const { currentTeam } = usePage().props;
    const callsUrl = currentTeam ? calls(currentTeam.slug).url : '/';
    const callsOnPage = paginatedCalls.data;
    return (
        <>
            <Head title="Call history" />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <header className="border-b pb-6">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Call history
                        </h1>
                        <p className="text-muted-foreground mt-2 text-pretty">
                            Review the latest conversations handled by your
                            team&apos;s agents.
                        </p>
                    </header>
                    <Card>
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock3
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                    Recent calls
                                </CardTitle>
                                <CardDescription className="text-pretty">
                                    Showing {callsOnPage.length} of{' '}
                                    {summary.total} calls, limited to {limit}{' '}
                                    per page.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant="outline"
                                    className="tabular-nums"
                                >
                                    {summary.total} total
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="tabular-nums"
                                >
                                    <CheckCircle2 data-icon="inline-start" />
                                    {summary.completed} completed
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {callsOnPage.length === 0 ? (
                                <Empty className="min-h-72 border-0">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Phone aria-hidden="true" />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            No calls recorded
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Calls will appear here when your
                                            telephony webhook starts writing
                                            call records.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <Button asChild variant="outline">
                                        <Link
                                            href={
                                                phoneNumbers(
                                                    currentTeam?.slug ?? '',
                                                ).url
                                            }
                                        >
                                            Set up a phone number{' '}
                                            <ArrowRight data-icon="inline-end" />
                                        </Link>
                                    </Button>
                                </Empty>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Caller</TableHead>
                                                <TableHead>Agent</TableHead>
                                                <TableHead>Number</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Started</TableHead>
                                                <TableHead>Summary</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {callsOnPage.map((call) => (
                                                <TableRow key={call.id}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {call.callerNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {call.agentName ??
                                                            'Unassigned'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {call.phoneNumber ??
                                                            'Unknown number'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                call.status ===
                                                                'completed'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {call.status.replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                                        {call.startedAt
                                                            ? new Date(
                                                                  call.startedAt,
                                                              ).toLocaleString()
                                                            : 'Not started'}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-sm">
                                                        {call.summary ??
                                                            call.outcome ??
                                                            'No summary'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            {paginatedCalls.last_page > 1 && (
                                <div className="flex items-center justify-between border-t px-6 py-4 text-sm">
                                    <span className="text-muted-foreground tabular-nums">
                                        Page {paginatedCalls.current_page} of{' '}
                                        {paginatedCalls.last_page}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                paginatedCalls.current_page ===
                                                1
                                            }
                                        >
                                            <Link
                                                href={`${callsUrl}?page=${paginatedCalls.current_page - 1}&limit=${limit}`}
                                                preserveScroll
                                            >
                                                Previous
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                paginatedCalls.current_page ===
                                                paginatedCalls.last_page
                                            }
                                        >
                                            <Link
                                                href={`${callsUrl}?page=${paginatedCalls.current_page + 1}&limit=${limit}`}
                                                preserveScroll
                                            >
                                                Next
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
