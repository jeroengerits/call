export type TelephonyAgent = {
    id: number;
    name: string;
    language: string;
    greeting: string | null;
    instructions: string | null;
    isActive: boolean;
    phoneNumbersCount: number;
    knowledgeSourcesCount: number;
    updateUrl?: string;
    knowledgeUrl?: string;
};

export type TelephonyPhoneNumber = {
    id: number;
    number: string;
    agentId: number | null;
    agentName: string | null;
    isActive: boolean;
};

export type TelephonyCall = {
    id: number;
    callerNumber: string;
    status: string;
    summary: string | null;
    outcome: string | null;
    agentName: string | null;
    phoneNumber: string | null;
    startedAt: string | null;
    endedAt: string | null;
};

export type TelephonyData = {
    agents: TelephonyAgent[];
    phoneNumbers: TelephonyPhoneNumber[];
    calls: TelephonyCall[];
};

export type KnowledgeAgent = {
    id: number;
    name: string;
    sourceCount: number;
    statuses: Record<'pending' | 'processing' | 'ready' | 'failed', number>;
    sourcesUrl: string;
};
