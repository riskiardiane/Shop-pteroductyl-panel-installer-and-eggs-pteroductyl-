import React, { useEffect, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import saveFileContents from '@/api/server/files/saveFileContents';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { useHistory, useLocation, useParams } from 'react-router';
import FileNameModal from '@/components/server/files/FileNameModal';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Select from '@/components/elements/Select';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import MonacoEditor from '@/components/elements/MonacoEditor';
import FileTreeSidebar from '@/components/server/files/FileTreeSidebar';

import BeforeEdit from '@blueprint/components/Server/Files/Edit/BeforeEdit';
import AfterEdit from '@blueprint/components/Server/Files/Edit/AfterEdit';

export default () => {
  const [error, setError] = useState('');
  const { action } = useParams<{ action: 'new' | string }>();
  const [loading, setLoading] = useState(action === 'edit');
  const [content, setContent] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState('text/plain');
  const [showExplorer, setShowExplorer] = useState(true);

  const history = useHistory();
  const { hash } = useLocation();

  const id = ServerContext.useStoreState((state) => state.server.data!.id);
  const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
  const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
  const { addError, clearFlashes } = useFlash();

  let fetchFileContent: null | (() => Promise<string>) = null;

  useEffect(() => {
    if (action === 'new') return;

    setError('');
    setLoading(true);
    const path = hashToPath(hash);
    setDirectory(dirname(path));
    getFileContents(uuid, path)
      .then(setContent)
      .catch((error) => {
        console.error(error);
        setError(httpErrorToHuman(error));
      })
      .then(() => setLoading(false));
  }, [action, uuid, hash]);

  const save = (name?: string) => {
    if (!fetchFileContent) {
      return;
    }

    setLoading(true);
    clearFlashes('files:view');
    fetchFileContent()
      .then((text) => saveFileContents(uuid, name || hashToPath(hash), text).then(() => setContent(text)))
      .then(() => {
        if (name) {
          history.push(`/server/${id}/files/edit#/${encodePathSegments(name)}`);
          return;
        }

        return Promise.resolve();
      })
      .catch((error) => {
        console.error(error);
        addError({ message: httpErrorToHuman(error), key: 'files:view' });
      })
      .then(() => setLoading(false));
  };

  const isDirty = async (): Promise<boolean> => {
    if (!fetchFileContent) {
      return false;
    }

    try {
      const current = await fetchFileContent();
      return current !== content;
    } catch (e) {
      return false;
    }
  };

  if (error) {
    return <ServerError message={error} onBack={() => history.goBack()} />;
  }

  return (
    <PageContentBlock>
      <FlashMessageRender byKey={'files:view'} css={tw`mb-4`} />
      <ErrorBoundary>
        <div css={tw`mb-4`}>
          <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
        </div>
      </ErrorBoundary>
      <BeforeEdit />
      {hash.replace(/^#/, '').endsWith('.pteroignore') && (
        <div
          css={tw`mb-4 p-4 rounded-[var(--pn-radius)]`}
          style={{ background: 'var(--pn-primary-soft)', borderLeft: '4px solid var(--pn-primary)' }}
        >
          <p css={tw`text-sm`} style={{ color: 'var(--pn-text-muted)' }}>
            You&apos;re editing a{' '}
            <code
              style={{
                background: 'var(--pn-surface-3)',
                color: 'var(--pn-primary-600)',
                borderRadius: 6,
                padding: '1px 6px',
                fontSize: '.85em',
              }}
            >
              .pteroignore
            </code>{' '}
            file. Any files or directories listed in here will be excluded from backups. Wildcards are supported by
            using an asterisk (
            <code
              style={{
                background: 'var(--pn-surface-3)',
                color: 'var(--pn-primary-600)',
                borderRadius: 6,
                padding: '1px 6px',
                fontSize: '.85em',
              }}
            >
              *
            </code>
            ). You can negate a prior rule by prepending an exclamation point (
            <code
              style={{
                background: 'var(--pn-surface-3)',
                color: 'var(--pn-primary-600)',
                borderRadius: 6,
                padding: '1px 6px',
                fontSize: '.85em',
              }}
            >
              !
            </code>
            ).
          </p>
        </div>
      )}
      <FileNameModal
        visible={modalVisible}
        onDismissed={() => setModalVisible(false)}
        onFileNamed={(name) => {
          setModalVisible(false);
          save(name);
        }}
      />
      <div css={tw`flex flex-col lg:flex-row gap-4 items-start`}>
        {showExplorer && (
          <div css={tw`w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-4`}>
            <FileTreeSidebar isDirty={isDirty} />
          </div>
        )}
        <div css={tw`flex-1 min-w-0 w-full`}>
          <div css={tw`relative`}>
            <SpinnerOverlay visible={loading} />
            <MonacoEditor
              mode={mode}
              filename={hash.replace(/^#/, '')}
              onModeChanged={setMode}
              initialContent={content}
              fetchContent={(value) => {
                fetchFileContent = value;
              }}
              onContentSaved={() => {
                if (action !== 'edit') {
                  setModalVisible(true);
                } else {
                  save();
                }
              }}
            />
          </div>
          <div css={tw`flex flex-wrap justify-between items-center gap-2 mt-4`}>
            <button
              type={'button'}
              onClick={() => setShowExplorer((value) => !value)}
              title={showExplorer ? 'Sembunyikan Explorer' : 'Tampilkan Explorer'}
              aria-pressed={showExplorer}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.8rem',
                borderRadius: 'var(--pn-radius, 8px)',
                border: '1px solid var(--pn-border-strong, #d5d5e8)',
                background: showExplorer ? 'var(--pn-primary-soft, rgba(98,80,245,.12))' : 'var(--pn-surface, #fcfdff)',
                color: 'var(--pn-primary-600, #4f3de0)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <svg
                viewBox='0 0 24 24'
                width={15}
                height={15}
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden
              >
                <rect x='3' y='3' width='18' height='18' rx='2' />
                <line x1='9' y1='3' x2='9' y2='21' />
              </svg>
              Explorer
            </button>
            <div css={tw`flex items-center flex-wrap`}>
              <div css={tw`flex-1 sm:flex-none mr-4`}>
                <Select value={mode} onChange={(e) => setMode(e.currentTarget.value)}>
                  {modes.map((mode) => (
                    <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                      {mode.name}
                    </option>
                  ))}
                </Select>
              </div>
              {action === 'edit' ? (
                <Can action={'file.update'}>
                  <Button css={tw`flex-1 sm:flex-none`} onClick={() => save()}>
                    Save Content
                  </Button>
                </Can>
              ) : (
                <Can action={'file.create'}>
                  <Button css={tw`flex-1 sm:flex-none`} onClick={() => setModalVisible(true)}>
                    Create File
                  </Button>
                </Can>
              )}
            </div>
          </div>
        </div>
      </div>
      <AfterEdit />
    </PageContentBlock>
  );
};
