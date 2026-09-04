import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock3, Phone, Radio } from 'lucide-react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
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
import { dashboard } from '@/routes';
import type { DashboardInvitation, TelephonyData } from '@/types';

type Props = {
    pendingInvitations?: DashboardInvitation[];
    telephony: TelephonyData;
};

export default function Dashboard({
    pendingInvitations = [],
    telephony,
}: Props) {
    const [showInvitations, setShowInvitations] = useState(true);

    return (
        <>
            <Head title="Call history" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase">
                                <Radio aria-hidden="true" /> Call history
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Every conversation, in one place.
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-2xl">
                                Review your team&apos;s latest calls and follow
                                up where it matters.
                            </p>
                        </div>
                        {pendingInvitations.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowInvitations(true)}
                            >
                                Review invitations
                            </Button>
                        )}
                    </header>

                    <Card>
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock3 aria-hidden="true" /> Recent calls
                                </CardTitle>
                                <CardDescription>
                                    The latest 20 conversations for this team.
                                </CardDescription>
                            </div>
                            <Badge variant="outline">
                                {telephony.calls.length} recorded
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {telephony.calls.length === 0 ? (
                                <Empty className="min-h-72 border-0">
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Phone aria-hidden="true" />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            No calls recorded
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Calls will appear here once your
                                            telephony webhook starts writing
                                            call records.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <Button asChild variant="outline">
                                        <Link href="../agents">
                                            Configure an agent{' '}
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
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {telephony.calls.map((call) => (
                                                <TableRow key={call.id}>
                                                    <TableCell className="font-medium">
                                                        {call.callerNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {call.agentName}
                                                    </TableCell>
                                                    <TableCell>
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
                                                    <TableCell className="text-muted-foreground">
                                                        {call.startedAt
                                                            ? new Date(
                                                                  call.startedAt,
                                                              ).toLocaleString()
                                                            : 'Not started'}
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

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Call history',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
