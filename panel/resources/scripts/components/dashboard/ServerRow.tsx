import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faDesktop, faEllipsisH, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString } from '@/lib/formatters';
import Spinner from '@/components/elements/Spinner';

import BeforeEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryName';
import AfterEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryName';
import BeforeEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryDescription';
import AfterEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryDescription';
import ResourceLimits from '@blueprint/components/Dashboard/Serverlist/ServerRow/ResourceLimits';

type Timer = ReturnType<typeof setInterval>;

const formatUptime = (ms: number): string => {
    if (!ms || ms <= 0) return '0m';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
};

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const isRunning = stats?.status === 'running';
    const isStarting = stats?.status === 'starting';
    const isStopping = stats?.status === 'stopping';

    return (
        <div
            className={`w-full bg-white hover:bg-white border border-violet-200 hover:border-violet-400/70 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-violet-600/10 ${className || ''}`}
        >
            {/* Left info: Icon, Name, Identifier, Description */}
            <div className={'flex items-center gap-3.5 min-w-[200px]'}>
                <div className={'w-11 h-11 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center text-lg flex-shrink-0'}>
                    <FontAwesomeIcon icon={faServer} />
                </div>
                <div>
                    <div className={'flex items-center gap-2'}>
                        <BeforeEntryName />
                        <Link
                            to={`/server/${server.id}`}
                            className={'text-base sm:text-lg font-bold pn-text-strong hover:text-violet-700 transition-colors no-underline'}
                        >
                            {server.name}
                        </Link>
                        <AfterEntryName />
                    </div>
                    <div className={'flex items-center gap-1.5 text-xs text-gray-400 mt-0.5'}>
                        <FontAwesomeIcon icon={faServer} className={'text-[10px] text-violet-300'} />
                        <span className={'font-mono'}>{server.identifier}</span>
                    </div>
                    {!!server.description && (
                        <div className={'mt-1'}>
                            <BeforeEntryDescription />
                            <p className={'text-xs text-gray-400 line-clamp-1'}>{server.description}</p>
                            <AfterEntryDescription />
                        </div>
                    )}
                </div>
            </div>

            {/* Middle: Status Badge */}
            <div className={'flex items-center'}>
                {isSuspended ? (
                    <span className={'px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400'}>
                        Suspended
                    </span>
                ) : isRunning ? (
                    <span className={'px-3.5 py-1 rounded-full text-xs font-medium bg-green-500/15 border border-green-500/30 text-green-400 flex items-center gap-1.5 shadow-sm'}>
                        <span className={'w-2 h-2 rounded-full bg-green-400 animate-pulse'} />
                        Running
                    </span>
                ) : isStarting ? (
                    <span className={'px-3.5 py-1 rounded-full text-xs font-medium bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5'}>
                        <span className={'w-2 h-2 rounded-full bg-yellow-400'} />
                        Starting
                    </span>
                ) : isStopping ? (
                    <span className={'px-3.5 py-1 rounded-full text-xs font-medium bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center gap-1.5'}>
                        <span className={'w-2 h-2 rounded-full bg-orange-400'} />
                        Stopping
                    </span>
                ) : (
                    <span className={'px-3.5 py-1 rounded-full text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1.5'}>
                        <span className={'w-2 h-2 rounded-full bg-red-400'} />
                        Offline
                    </span>
                )}
            </div>

            {/* Metrics: CPU, RAM, Uptime */}
            <div className={'flex items-center gap-6 sm:gap-8'}>
                {!stats && !isSuspended ? (
                    <div className={'w-28 flex justify-center'}>
                        <Spinner size={'small'} />
                    </div>
                ) : (
                    <>
                        {/* CPU */}
                        <div className={'text-center'}>
                            <div className={'flex items-center justify-center gap-1.5 text-xs font-bold text-gray-200'}>
                                <FontAwesomeIcon icon={faMicrochip} className={'text-violet-600 text-xs'} />
                                <span>{stats ? stats.cpuUsagePercent.toFixed(2) : '0.00'}%</span>
                            </div>
                            <span className={'text-[10px] uppercase font-semibold text-gray-400 tracking-wider'}>CPU</span>
                        </div>

                        {/* RAM */}
                        <div className={'text-center'}>
                            <div className={'flex items-center justify-center gap-1.5 text-xs font-bold text-gray-200'}>
                                <FontAwesomeIcon icon={faMemory} className={'text-violet-600 text-xs'} />
                                <span>{stats ? bytesToString(stats.memoryUsageInBytes) : '0 MB'}</span>
                            </div>
                            <span className={'text-[10px] uppercase font-semibold text-gray-400 tracking-wider'}>RAM</span>
                        </div>

                        {/* Uptime */}
                        <div className={'text-center'}>
                            <div className={'flex items-center justify-center gap-1.5 text-xs font-bold text-gray-200'}>
                                <FontAwesomeIcon icon={faClock} className={'text-violet-600 text-xs'} />
                                <span>{stats && isRunning ? formatUptime(stats.uptime) : '0m'}</span>
                            </div>
                            <span className={'text-[10px] uppercase font-semibold text-gray-400 tracking-wider'}>Uptime</span>
                        </div>
                        <ResourceLimits />
                    </>
                )}
            </div>

            {/* Right: Actions */}
            <div className={'flex items-center gap-2 self-end md:self-center'}>
                <Link
                    to={`/server/${server.id}`}
                    className={'px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#6d4df2] hover:bg-[#5a35e0] text-white font-medium text-xs sm:text-sm shadow-md shadow-violet-600/25 flex items-center gap-2 transition-all duration-150 no-underline cursor-pointer'}
                >
                    <FontAwesomeIcon icon={faDesktop} />
                    <span>Manage</span>
                </Link>
                <Link
                    to={`/server/${server.id}`}
                    className={'w-9 h-9 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-slate-500 hover:text-violet-700 flex items-center justify-center transition-colors no-underline'}
                >
                    <FontAwesomeIcon icon={faEllipsisH} />
                </Link>
            </div>
        </div>
    );
};
