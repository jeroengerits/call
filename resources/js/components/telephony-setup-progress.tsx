import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Bot, CheckCircle2, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { index as agents } from '@/routes/agents';
import { index as knowledge } from '@/routes/knowledge';
import { index as phoneNumbers } from '@/routes/phone-numbers';
import type { TelephonySetupProgressProps } from '@/types';

const steps = [
    {
        key: 'phoneNumbers',
        title: 'Add a phone number',
        description: 'Give callers a number they can reach.',
        action: 'Add a phone number',
        manageAction: 'Manage phone numbers',
        icon: Phone,
        getUrl: (teamSlug: string) => phoneNumbers(teamSlug).url,
    },
    {
        key: 'agents',
        title: 'Create an agent',
        description: 'Set the voice and guidance for your calls.',
        action: 'Create an agent',
        manageAction: 'Manage agents',
        icon: Bot,
        getUrl: (teamSlug: string) => agents(teamSlug).url,
    },
    {
        key: 'knowledgeSources',
        title: 'Add knowledge sources',
        description: 'Help your agent answer with your information.',
        action: 'Add knowledge sources',
        manageAction: 'Manage knowledge',
        icon: BookOpen,
        getUrl: (teamSlug: string) => knowledge(teamSlug).url,
    },
] as const;

export default function TelephonySetupProgress({
    phoneNumbersCount,
    agentsCount,
    knowledgeSourcesCount,
    currentTeamSlug,
}: TelephonySetupProgressProps) {
    const counts = {
        phoneNumbers: phoneNumbersCount,
        agents: agentsCount,
        knowledgeSources: knowledgeSourcesCount,
    };
    const completedCount = steps.filter(({ key }) => counts[key] > 0).length;

    if (completedCount === steps.length) {
        return (
            <Card
                role="region"
                aria-labelledby="telephony-setup-complete-title"
            >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2
                            className="text-primary size-5 shrink-0"
                            aria-hidden="true"
                        />
                        <div>
                            <CardTitle
                                id="telephony-setup-complete-title"
                                className="text-base"
                            >
                                Setup complete
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Your team is ready to handle calls.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 sm:justify-end">
                        {steps.map(({ key, manageAction, getUrl }) => (
                            <Link
                                key={key}
                                href={getUrl(currentTeamSlug)}
                                className="text-primary inline-flex items-center gap-1 text-sm font-medium"
                            >
                                {manageAction}
                                <ArrowRight
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card role="region" aria-labelledby="telephony-setup-title">
            <CardHeader className="gap-2 pb-4">
                <div className="flex items-center justify-between gap-4">
                    <CardTitle id="telephony-setup-title" className="text-base">
                        Set up your calling workspace
                    </CardTitle>
                    <Badge variant="secondary">
                        {completedCount} of {steps.length} complete
                    </Badge>
                </div>
                <CardDescription>
                    Follow these three steps to get your first call ready.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ol className="grid gap-3 md:grid-cols-3">
                    {steps.map(
                        (
                            {
                                key,
                                title,
                                description,
                                action,
                                manageAction,
                                getUrl,
                                icon: Icon,
                            },
                            index,
                        ) => {
                            const isComplete = counts[key] > 0;

                            return (
                                <li
                                    key={key}
                                    className="flex gap-3 rounded-lg border p-3"
                                >
                                    <div
                                        className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                        aria-hidden="true"
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Icon
                                                className="text-muted-foreground size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <h3 className="text-sm font-medium">
                                                {title}
                                            </h3>
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs leading-5">
                                            {isComplete
                                                ? `${title} is ready.`
                                                : description}
                                        </p>
                                        <Badge
                                            variant={
                                                isComplete
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="mt-2"
                                        >
                                            {isComplete ? (
                                                <>
                                                    <CheckCircle2 data-icon="inline-start" />
                                                    Complete
                                                </>
                                            ) : (
                                                'Next step'
                                            )}
                                        </Badge>
                                        <Link
                                            href={getUrl(currentTeamSlug)}
                                            className="text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium"
                                        >
                                            {isComplete ? manageAction : action}
                                            <ArrowRight
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </div>
                                </li>
                            );
                        },
                    )}
                </ol>
            </CardContent>
        </Card>
    );
}
