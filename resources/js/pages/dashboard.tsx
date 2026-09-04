import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, BookOpen, Bot, Phone } from 'lucide-react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index as agents } from '@/routes/agents';
import { index as knowledge } from '@/routes/knowledge';
import { index as phoneNumbers } from '@/routes/phone-numbers';
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
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Dashboard" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />
            <main className="bg-muted/20 min-h-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6">
                    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-muted-foreground mb-3 text-xs font-medium tracking-[0.18em] uppercase">
                                Team setup
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Make every call count.
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-2xl">
                                Start with a phone number, then configure an
                                agent and its knowledge.
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
                    {telephony.phoneNumbers.length === 0 && (
                        <Card className="border-primary/30">
                            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        Make your first call possible
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Connect a phone number before creating
                                        an agent so callers can reach it
                                        immediately.
                                    </CardDescription>
                                </div>
                                <Button asChild>
                                    <Link href={phoneNumbers(teamSlug).url}>
                                        <Phone data-icon="inline-start" />
                                        Set up phone numbers
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    <section
                        className="grid gap-4 md:grid-cols-3"
                        aria-label="Setup shortcuts"
                    >
                        <SetupCard
                            icon={Phone}
                            title="Phone numbers"
                            description={`${telephony.phoneNumbers.length} connected`}
                            href={phoneNumbers(teamSlug).url}
                            action="Manage numbers"
                        />
                        <SetupCard
                            icon={Bot}
                            title="Agents"
                            description={`${telephony.agents.length} configured`}
                            href={agents(teamSlug).url}
                            action="Configure agents"
                        />
                        <SetupCard
                            icon={BookOpen}
                            title="Knowledge"
                            description="Connect sources to your agents"
                            href={knowledge(teamSlug).url}
                            action="Manage knowledge"
                        />
                    </section>
                </div>
            </main>
        </>
    );
}

function SetupCard({
    icon: Icon,
    title,
    description,
    href,
    action,
}: {
    icon: typeof Phone;
    title: string;
    description: string;
    href: string;
    action: string;
}) {
    return (
        <Card>
            <CardHeader>
                <Icon className="text-primary size-5" aria-hidden="true" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="w-full">
                    <Link href={href}>
                        {action}
                        <ArrowRight data-icon="inline-end" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
