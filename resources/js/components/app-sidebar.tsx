import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Bot, Clock3, LayoutGrid, Phone } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage();
    const dashboardUrl = page.props.currentTeam
        ? dashboard(page.props.currentTeam.slug).url
        : '/';
    const agentsUrl = dashboardUrl.replace(/\/dashboard$/, '/agents');
    const phoneNumbersUrl = dashboardUrl.replace(
        /\/dashboard$/,
        '/phone-numbers',
    );
    const knowledgeUrl = dashboardUrl.replace(/\/dashboard$/, '/knowledge');
    const callHistoryUrl = dashboardUrl.replace(
        /\/dashboard$/,
        '/call-history',
    );

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        {
            title: 'Phone numbers',
            href: phoneNumbersUrl,
            icon: Phone,
        },
        {
            title: 'Agents',
            href: agentsUrl,
            icon: Bot,
        },
        {
            title: 'Knowledge',
            href: knowledgeUrl,
            icon: BookOpen,
        },
        {
            title: 'Call history',
            href: callHistoryUrl,
            icon: Clock3,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
