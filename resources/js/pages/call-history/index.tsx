import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock3, Phone } from 'lucide-react';
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

type Props = { calls: TelephonyCall[]; limit: number };

export default function CallHistoryIndex({ calls, limit }: Props) {
    return (
        <>
            <Head title="Call history" />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <header className="border-b pb-6">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Call history
                        </h1>
                        <p className="text-muted-foreground mt-2">
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
                                <CardDescription>
                                    Showing up to the latest {limit} calls.
                                </CardDescription>
                            </div>
                            <Badge variant="outline">
                                {calls.length} recorded
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {calls.length === 0 ? (
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
                                        <Link href="../phone-numbers">
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
                                            {calls.map((call) => (
                                                <TableRow key={call.id}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {call.callerNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {call.agentName}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {call.phoneNumber}
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
                                                            {call.status}
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
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
