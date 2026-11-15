import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { useHistory, useLocation } from 'react-router';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import { encodePathSegments, hashToPath } from '@/helpers';
import { ServerContext } from '@/state/server';

/* ==========================================================================
   FileTreeSidebar — Explorer ala VS Code untuk file editor panel.
   - Pohon folder lazy-load (buka folder = baru fetch isinya).
   - Klik file = buka di editor (pindah route edit dengan hash path).
   - Folder/file aktif disorot; refresh & collapse-all tersedia di toolbar.
   ========================================================================== */

interface FileTreeSidebarProps {
  /** Dipanggil untuk mengecek apakah ada perubahan yang belum tersimpan. */
  isDirty?: () => Promise<boolean>;
}

const joinPath = (dir: string, name: string): string =>
  dir === '/' ? `/${name}` : `${dir}/${name}`.replace(/\/{2,}/g, '/');

const sortEntries = (files: FileObject[]): FileObject[] =>
  [...files]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--pn-surface, #fcfdff);
  border: 1px solid var(--pn-border, #e5e7f2);
  border-radius: var(--pn-radius-lg, 12px);
  box-shadow:
    var(--pn-shadow-1, 0 1px 2px rgba(17, 23, 51, 0.06)),
    var(--pn-inner-highlight, inset 0 1px 0 rgba(255, 255, 255, 0.6));
  overflow: hidden;
  height: calc(100vh - 20rem);
  min-height: 16rem;
  user-select: none;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--pn-border, #e5e7f2);
  background: var(--pn-surface-2, #f5f6fc);
  letter-spacing: 0.12em;
`;

const ToolbarButton = styled.button<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 6px;
  color: var(--pn-text-muted, #6a7291);
  transition:
    background 120ms ease,
    color 120ms ease;

  &:hover {
    background: rgba(98, 80, 245, 0.1);
    color: var(--pn-primary-600, #4f3de0);
  }

  &:focus-visible {
    outline: 2px solid var(--pn-primary, #6250f5);
    outline-offset: 1px;
  }
`;

const TreeScroll = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.35rem 0.25rem 0.5rem;

  scrollbar-width: thin;
  scrollbar-color: rgba(98, 80, 245, 0.35) transparent;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(98, 80, 245, 0.28);
    border-radius: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const Row = styled.button<{ active?: boolean; depth: number; disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  height: 1.75rem;
  padding-right: 0.5rem;
  padding-left: ${({ depth }) => `${0.35 + depth * 0.85}rem`};
  border: 0;
  background: ${({ active }) => (active ? 'rgba(98, 80, 245, 0.14)' : 'transparent')};
  box-shadow: ${({ active }) => (active ? 'inset 2.5px 0 0 var(--pn-primary, #6250f5)' : 'none')};
  color: ${({ active }) => (active ? 'var(--pn-primary-600, #4f3de0)' : 'var(--pn-text, #111733)')};
  font-size: 0.78rem;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  border-radius: 6px;
  transition:
    background 100ms ease,
    color 100ms ease;

  &:hover {
    background: ${({ active }) => (active ? 'rgba(98, 80, 245, 0.16)' : 'rgba(98, 80, 245, 0.08)')};
  }

  &:focus-visible {
    outline: 2px solid var(--pn-primary, #6250f5);
    outline-offset: -2px;
  }
`;

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox='0 0 16 16'
    width={12}
    height={12}
    aria-hidden
    style={{
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 130ms ease',
      flexShrink: 0,
      color: 'var(--pn-text-muted, #6a7291)',
    }}
    fill='currentColor'
  >
    <path d='M6.293 2.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L10.586 8 6.293 3.707a1 1 0 0 1 0-1.414z' />
  </svg>
);

const ChevronPlaceholder = styled.span`
  display: inline-block;
  width: 12px;
  flex-shrink: 0;
`;

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox='0 0 24 24'
    width={15}
    height={15}
    aria-hidden
    fill={open ? '#f2cd88' : '#e9c987'}
    stroke='#a97a2f'
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    style={{ flexShrink: 0 }}
  >
    <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox='0 0 24 24'
    width={15}
    height={15}
    aria-hidden
    fill='none'
    stroke='#5a648f'
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    style={{ flexShrink: 0 }}
  >
    <path d='M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z' />
    <polyline points='13 2 13 9 20 9' />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    viewBox='0 0 24 24'
    width={13}
    height={13}
    aria-hidden
    className={'animate-spin'}
    fill='none'
    stroke='currentColor'
    strokeWidth={2.4}
    strokeLinecap='round'
  >
    <path d='M21 12a9 9 0 1 1-6.219-8.56' />
  </svg>
);

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyRow = styled.div<{ depth: number }>`
  padding-left: ${({ depth }) => `${0.35 + (depth + 1) * 0.85 + 1.1}rem`};
  height: 1.6rem;
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  color: var(--pn-text-muted, #6a7291);
  font-style: italic;
`;

const ErrorRow = styled.div<{ depth: number }>`
  padding: 0.15rem 0.5rem 0.15rem ${({ depth }) => `${0.35 + (depth + 1) * 0.85}rem`};
  font-size: 0.7rem;
  color: var(--pn-danger, #e0245e);
`;

export default function FileTreeSidebar({ isDirty }: FileTreeSidebarProps) {
  const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
  const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
  const history = useHistory();
  const { hash } = useLocation();

  const activePath = useMemo(() => hashToPath(hash), [hash]);

  const [childrenMap, setChildrenMap] = useState<Record<string, FileObject[]>>({});
  const [loadingDirs, setLoadingDirs] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '/': true });

  // Mencegah setState setelah unmount & race fetch yang sudah usang.
  const mounted = useRef(true);
  const fetchToken = useRef<Record<string, number>>({});
  const childrenRef = useRef(childrenMap);
  childrenRef.current = childrenMap;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchDir = useCallback(
    async (dir: string, force = false) => {
      if (!force && childrenRef.current[dir] !== undefined) {
        return;
      }

      const token = (fetchToken.current[dir] ?? 0) + 1;
      fetchToken.current[dir] = token;
      setLoadingDirs((m) => ({ ...m, [dir]: true }));
      setErrorMap((m) => ({ ...m, [dir]: '' }));

      try {
        const files = await loadDirectory(uuid, dir);
        if (!mounted.current || fetchToken.current[dir] !== token) return;
        setChildrenMap((m) => ({ ...m, [dir]: sortEntries(files) }));
      } catch (error) {
        if (!mounted.current || fetchToken.current[dir] !== token) return;
        console.error(error);
        setErrorMap((m) => ({ ...m, [dir]: 'Gagal memuat folder' }));
      } finally {
        if (mounted.current && fetchToken.current[dir] === token) {
          setLoadingDirs((m) => ({ ...m, [dir]: false }));
        }
      }
    },
    [uuid],
  );

  // Muat root saat mount.
  useEffect(() => {
    fetchDir('/', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDir = useCallback(
    (dir: string) => {
      setExpanded((prev) => {
        const next = { ...prev, [dir]: !prev[dir] };
        if (next[dir]) {
          fetchDir(dir);
        }
        return next;
      });
    },
    [fetchDir],
  );

  const refreshAll = useCallback(() => {
    const dirs = Object.keys(expanded).filter((d) => expanded[d]);
    if (!dirs.includes('/')) dirs.push('/');
    dirs.forEach((dir) => fetchDir(dir, true));
  }, [expanded, fetchDir]);

  const collapseAll = useCallback(() => {
    setExpanded({ '/': true });
  }, []);

  const openFile = useCallback(
    async (file: FileObject, dir: string) => {
      if (!file.isFile) return;
      const target = joinPath(dir, file.name);
      if (target === activePath) return;

      if (isDirty) {
        try {
          if (await isDirty()) {
            const ok = window.confirm('Kamu punya perubahan yang belum tersimpan. Buang perubahan dan buka file lain?');
            if (!ok) return;
          }
        } catch (e) {
          // Jika gagal mengecek, tetap lanjutkan navigasi.
        }
      }

      history.push(`/server/${serverId}/files/edit#${encodePathSegments(target)}`);
    },
    [activePath, history, isDirty, serverId],
  );

  const renderEntries = (dir: string, depth: number): React.ReactNode => {
    const entries = childrenMap[dir];
    const loading = loadingDirs[dir];
    const error = errorMap[dir];

    if (loading && entries === undefined) {
      return (
        <EmptyRow depth={depth}>
          <SpinnerIcon />
        </EmptyRow>
      );
    }

    if (error) {
      return (
        <ErrorRow depth={depth}>
          {error} —{' '}
          <button type={'button'} style={{ textDecoration: 'underline' }} onClick={() => fetchDir(dir, true)}>
            coba lagi
          </button>
        </ErrorRow>
      );
    }

    if (!entries) return null;
    if (entries.length === 0) return <EmptyRow depth={depth}>Folder kosong</EmptyRow>;

    return entries.map((entry) => {
      const fullPath = joinPath(dir, entry.name);
      const isDir = !entry.isFile;
      const isOpen = !!expanded[fullPath];
      const editable = entry.isFile && entry.isEditable();
      const active = !isDir && fullPath === activePath;
      const dirLoading = isDir && !!loadingDirs[fullPath];

      return (
        <React.Fragment key={(isDir ? 'd:' : 'f:') + fullPath}>
          <Row
            type={'button'}
            depth={depth}
            active={active}
            disabled={entry.isFile && !editable}
            title={editable || isDir ? fullPath : `${fullPath} (tidak bisa diedit)`}
            onClick={() => (isDir ? toggleDir(fullPath) : editable ? openFile(entry, dir) : undefined)}
          >
            {isDir ? <Chevron open={isOpen} /> : <ChevronPlaceholder />}
            {isDir ? <FolderIcon open={isOpen} /> : <FileIcon />}
            <Name>{entry.name}</Name>
            {dirLoading ? <SpinnerIcon /> : null}
          </Row>
          {isDir && isOpen ? <div role={'group'}>{renderEntries(fullPath, depth + 1)}</div> : null}
        </React.Fragment>
      );
    });
  };

  return (
    <Wrapper aria-label={'File explorer'}>
      <Toolbar>
        <span
          css={tw`flex-1 text-[0.65rem] font-bold uppercase truncate`}
          style={{ color: 'var(--pn-text-muted, #6a7291)' }}
        >
          Explorer
        </span>
        <ToolbarButton type={'button'} title={'Muat ulang'} aria-label={'Muat ulang pohon file'} onClick={refreshAll}>
          <svg
            viewBox='0 0 24 24'
            width={14}
            height={14}
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='23 4 23 10 17 10' />
            <polyline points='1 20 1 14 7 14' />
            <path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          type={'button'}
          title={'Tutup semua folder'}
          aria-label={'Tutup semua folder'}
          onClick={collapseAll}
        >
          <svg
            viewBox='0 0 24 24'
            width={14}
            height={14}
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='4 14 10 14 10 20' />
            <polyline points='20 10 14 10 14 4' />
            <line x1='14' y1='10' x2='21' y2='3' />
            <line x1='3' y1='21' x2='10' y2='14' />
          </svg>
        </ToolbarButton>
      </Toolbar>
      <TreeScroll>{renderEntries('/', 0)}</TreeScroll>
    </Wrapper>
  );
}
