export type TelephonyAgent = {
    id: number;
    name: string;
    language: string;
    greeting: string | null;
    instructions: string | null;
    knowledge: string | null;
    isActive: boolean;
    phoneNumbersCount: number;
    updateUrl?: string;
};

export type TelephonyPhoneNumber = {
    id: number;
    number: string;
    agentId: number;
    agentName: string;
    isActive: boolean;
};

export type TelephonyCall = {
    id: number;
    callerNumber: string;
    status: string;
    summary: string | null;
    outcome: string | null;
    agentName: string;
    phoneNumber: string;
    startedAt: string | null;
    endedAt: string | null;
};

export type TelephonyData = {
    agents: TelephonyAgent[];
    phoneNumbers: TelephonyPhoneNumber[];
    calls: TelephonyCall[];
};
