import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import modes from '@/modes';

/* ==========================================================================
   Monaco Editor — editor kelas VS Code untuk file manager panel.
   - IntelliSense penuh untuk JS/TS (lib DOM + Node-ish defaults), JSON (schema
     validation bawaan), CSS/SCSS, HTML (termasuk emmet bawaan), plus
     syntax highlight + word-based suggestions untuk bahasa lainnya.
   - Tema "aurora-light" selaras dengan desain panel (AURORA 2.0).
   ========================================================================== */

export const monacoLanguageFromMime = (mime: string, filename?: string): string => {
    const map: Record<string, string> = {
        'text/x-csrc': 'cpp',
        'text/x-c++src': 'cpp',
        'text/x-csharp': 'csharp',
        'text/css': 'css',
        'text/x-cassandra': 'sql',
        'text/x-diff': 'plaintext',
        'text/x-dockerfile': 'dockerfile',
        'text/x-gfm': 'markdown',
        'text/x-go': 'go',
        'text/html': 'html',
        'message/http': 'plaintext',
        'text/javascript': 'javascript',
        'application/json': 'json',
        'text/x-lua': 'lua',
        'text/x-markdown': 'markdown',
        'text/x-mariadb': 'sql',
        'text/x-mssql': 'sql',
        'text/x-mysql': 'mysql',
        'text/x-pgsql': 'pgsql',
        'text/x-sql': 'sql',
        'text/x-sqlite': 'sql',
        'text/x-nginx-conf': 'ini',
        'text/x-php': 'php',
        'application/x-httpd-php': 'php',
        'application/x-httpd-php-open': 'php',
        'text/plain': 'plaintext',
        'text/x-properties': 'ini',
        'text/x-pug': 'pug',
        'text/x-jade': 'pug',
        'text/x-python': 'python',
        'text/x-ruby': 'ruby',
        'text/x-rustsrc': 'rust',
        'text/x-sass': 'scss',
        'text/x-scss': 'scss',
        'text/x-sh': 'shell',
        'application/x-sh': 'shell',
        'text/x-toml': 'ini',
        'application/typescript': 'typescript',
        'script/x-vue': 'html',
        'text/x-vue': 'html',
        'application/xml': 'xml',
        'text/xml': 'xml',
        'text/x-yaml': 'yaml',
        'text/yaml': 'yaml',
    };

    if (filename) {
        // Filename rules menang dari mime (mis. Dockerfile, nginx.conf, .pteroignore).
        if (/^Dockerfile$/i.test(filename)) return 'dockerfile';
        if (/nginx.*\.conf$/i.test(filename)) return 'ini';
        if (/^\.pteroignore$/.test(filename)) return 'plaintext';
        const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : '';
        const byExt: Record<string, string> = {
            ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript',
            js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
            json: 'json', css: 'css', scss: 'scss', less: 'less', html: 'html', htm: 'html',
            md: 'markdown', mdx: 'markdown', yml: 'yaml', yaml: 'yaml', xml: 'xml', svg: 'xml',
            php: 'php', py: 'python', rb: 'ruby', rs: 'rust', go: 'go', lua: 'lua',
            sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'powershell',
            sql: 'sql', ini: 'ini', env: 'ini', conf: 'ini', properties: 'ini',
            dockerfile: 'dockerfile', toml: 'ini', vue: 'html', pug: 'pug', diff: 'plaintext',
            patch: 'plaintext', log: 'plaintext', txt: 'plaintext', lock: 'plaintext',
        };
        if (byExt[ext]) return byExt[ext];
    }

    return map[mime] ?? 'plaintext';
};

let themeDefined = false;
const defineAuroraTheme = () => {
    if (themeDefined) {
        return;
    }
    themeDefined = true;

    monaco.editor.defineTheme('aurora-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: '', foreground: '111733' },
            { token: 'comment', foreground: '6a7291', fontStyle: 'italic' },
            { token: 'keyword', foreground: '6250f5', fontStyle: 'bold' },
            { token: 'keyword.control', foreground: '4f3de0', fontStyle: 'bold' },
            { token: 'string', foreground: '0e7d94' },
            { token: 'string.escape', foreground: '0f9d8f' },
            { token: 'number', foreground: 'c77400' },
            { token: 'regexp', foreground: 'c77400' },
            { token: 'type', foreground: '4f3de0' },
            { token: 'type.identifier', foreground: '4f3de0' },
            { token: 'class', foreground: '4f3de0', fontStyle: 'bold' },
            { token: 'function', foreground: '7c3aed' },
            { token: 'variable', foreground: '111733' },
            { token: 'variable.predefined', foreground: 'b3124f' },
            { token: 'constant', foreground: 'b3124f' },
            { token: 'constant.numeric', foreground: 'c77400' },
            { token: 'operator', foreground: '3d4560' },
            { token: 'delimiter', foreground: '3d4560' },
            { token: 'tag', foreground: 'b3124f' },
            { token: 'attribute.name', foreground: '4f3de0' },
            { token: 'attribute.value', foreground: '0e7d94' },
            { token: 'metatag', foreground: '6250f5' },
            { token: 'delimiter.html', foreground: '6a7291' },
            { token: 'markup.heading', foreground: '6250f5', fontStyle: 'bold' },
            { token: 'markup.bold', foreground: '111733', fontStyle: 'bold' },
            { token: 'markup.italic', foreground: '3d4560', fontStyle: 'italic' },
            { token: 'markup.inline.raw', foreground: '0e7d94' },
        ],
        colors: {
            'editor.background': '#fcfdff',
            'editor.foreground': '#111733',
            'editorLineNumber.foreground': '#a7b1c9',
            'editorLineNumber.activeForeground': '#4f3de0',
            'editorCursor.foreground': '#6250f5',
            'editor.selectionBackground': '#6250f533',
            'editor.inactiveSelectionBackground': '#6250f51f',
            'editor.lineHighlightBackground': '#6250f50d',
            'editor.lineHighlightBorder': '#00000000',
            'editorIndentGuide.background1': '#ececf5',
            'editorIndentGuide.activeBackground1': '#d5d5e8',
            'editorGutter.background': '#f5f6fc',
            'editorBracketMatch.background': '#6250f526',
            'editorBracketMatch.border': '#6250f580',
            'editorBracketPairGuide.activeBackground1': '#6250f540',
            'editorBracketPairGuide.background1': '#d5d5e8',
            'editorSuggestWidget.background': '#ffffff',
            'editorSuggestWidget.border': '#6250f54d',
            'editorSuggestWidget.foreground': '#111733',
            'editorSuggestWidget.selectedBackground': '#6250f51f',
            'editorSuggestWidget.selectedForeground': '#241a5e',
            'editorHoverWidget.background': '#ffffff',
            'editorHoverWidget.border': '#6250f54d',
            'editorHint.foreground': '#049d6c',
            'editorInfo.foreground': '#6250f5',
            'editorWarning.foreground': '#c77400',
            'editorError.foreground': '#e0245e',
            'editorMarkerNavigationError.background': '#e0245e',
            'editorMarkerNavigationWarning.background': '#c77400',
            'editorWidget.border': '#6250f54d',
            'editorGroupHeader.tabsBackground': '#f5f6fc',
            'minimap.background': '#f5f6fc',
            'scrollbarSlider.background': '#6250f522',
            'scrollbarSlider.hoverBackground': '#6250f540',
            'scrollbarSlider.activeBackground': '#6250f566',
            'editorOverviewRuler.border': '#ececf5',
        },
    });

    // ---- IntelliSense defaults: JS/TS/JSON/CSS/HTML ------------------------
    const tsDefaults = monaco.languages.typescript?.typescriptDefaults;
    const jsDefaults = monaco.languages.typescript?.javascriptDefaults;
    const compilerOptions: monaco.languages.typescript.CompilerOptions = {
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowNonTsExtensions: true,
        allowJs: true,
        checkJs: false,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        sourceMap: true,
        allowSyntheticDefaultImports: true,
    };
    const diagnosticsOptions: monaco.languages.typescript.DiagnosticsOptions = {
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: true,
    };

    for (const defaults of [jsDefaults, tsDefaults]) {
        if (!defaults) continue;
        defaults.setCompilerOptions(compilerOptions);
        defaults.setDiagnosticsOptions(diagnosticsOptions);
        defaults.setEagerModelSync(true);
    }
};

/* Snippets ekstra agar saran terasa "lengkap" di luar JS/TS/JSON/CSS/HTML. */
let snippetsRegistered = false;
const registerExtraSnippets = () => {
    if (snippetsRegistered) return;
    snippetsRegistered = true;

    const SNIPPETS: Record<string, Array<{ label: string; insertText: string; detail: string }>> = {
        php: [
            { label: 'phpfile', insertText: '<?php\n\n$1\n', detail: 'PHP file' },
            { label: 'if', insertText: 'if ($1) {\n\t$2\n}', detail: 'if statement' },
            { label: 'elseif', insertText: 'elseif ($1) {\n\t$2\n}', detail: 'elseif statement' },
            { label: 'foreach', insertText: 'foreach ($${1:items} as $${2:item}) {\n\t$3\n}', detail: 'foreach loop' },
            { label: 'for', insertText: 'for ($${1:i} = 0; $$1 < ${2:count}; $$1++) {\n\t$3\n}', detail: 'for loop' },
            { label: 'function', insertText: 'function ${1:name}(${2:params}) {\n\t$3\n}', detail: 'function' },
            { label: 'trycatch', insertText: 'try {\n\t$1\n} catch (\\Throwable $e) {\n\t$2\n}', detail: 'try / catch' },
            { label: 'echo', insertText: 'echo $1;', detail: 'echo' },
            { label: 'json_response', insertText: 'header(\'Content-Type: application/json\');\necho json_encode([\n\t\'status\' => \'$1\',\n\t$2\n]);', detail: 'JSON response' },
        ],
        yaml: [
            { label: 'ptero-egg', insertText: '_format: \'PTDL_v2\'\nmeta:\n  version: PTDL_v2\n  update_url: null\n  exported_at: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATET00:00:00Z\nname: \'${1:Name}\'\ndescription: \'${2:Description}\'\nauthor: \'RizzDevs\'', detail: 'Pterodactyl egg skeleton (PTDL_v2)' },
            { label: 'services', insertText: 'services:\n  ${1:app}:\n    image: ${2:image}\n    restart: unless-stopped\n    ports:\n      - \'${3:3000}:${3:3000}\'', detail: 'docker-compose service' },
        ],
        dockerfile: [
            { label: 'from', insertText: 'FROM ${1:debian:bookworm-slim}\nWORKDIR /app\nCOPY . .\nCMD ["${2:node}", "${3:index.js}"]', detail: 'Basic Dockerfile' },
            { label: 'multi', insertText: 'FROM ${1:node:20-alpine} AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM ${2:nginx:alpine}\nCOPY --from=build /app/dist /usr/share/nginx/html', detail: 'Multi-stage build' },
            { label: 'healthcheck', insertText: 'HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\\n  CMD ${1:wget -qO- http://localhost/ || exit 1}', detail: 'HEALTHCHECK' },
        ],
        shell: [
            { label: 'shebang', insertText: '#!/bin/bash\nset -euo pipefail\n\n$1\n', detail: 'Bash shebang + strict mode' },
            { label: 'if', insertText: 'if [ "$1" = "$2" ]; then\n\t$3\nfi', detail: 'if statement' },
            { label: 'for', insertText: 'for ${1:item} in ${2:list}; do\n\t$3\ndone', detail: 'for loop' },
            { label: 'while', insertText: 'while read -r ${1:line}; do\n\t$2\ndone < ${3:file}', detail: 'while read loop' },
            { label: 'func', insertText: '${1:name}() {\n\t$2\n}', detail: 'function' },
            { label: 'trap', insertText: 'trap \'${1:echo "cleanup"}\' EXIT', detail: 'trap EXIT' },
        ],
        ini: [
            { label: 'section', insertText: '[${1:section}]\n${2:key} = ${3:value}', detail: 'INI section' },
            { label: 'server', insertText: 'server {\n\tlisten ${1:80};\n\tserver_name ${2:_};\n\n\tlocation / {\n\t\troot /var/www/${3:html};\n\t\tindex index.html;\n\t}\n}', detail: 'Nginx server block' },
        ],
        sql: [
            { label: 'select', insertText: 'SELECT ${1:*} FROM ${2:table} WHERE ${3:1=1};', detail: 'SELECT' },
            { label: 'insert', insertText: 'INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values});', detail: 'INSERT' },
            { label: 'update', insertText: 'UPDATE ${1:table} SET ${2:col} = ${3:value} WHERE ${4:1=1};', detail: 'UPDATE' },
            { label: 'cte', insertText: 'WITH ${1:cte} AS (\n\tSELECT $2\n)\nSELECT * FROM $1;', detail: 'Common Table Expression' },
        ],
        xml: [
            { label: 'sitemap', insertText: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\t<url>\n\t\t<loc>${1:https://example.com/}</loc>\n\t</url>\n</urlset>', detail: 'Sitemap skeleton' },
        ],
        markdown: [
            { label: 'frontmatter', insertText: '---\ntitle: \'${1:Judul}\'\ndate: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE\n---\n\n# ${1:Judul}\n\n$2', detail: 'Frontmatter + heading' },
        ],
        pug: [
            { label: 'page', insertText: 'doctype html\nhtml(lang="id")\n  head\n    meta(charset="UTF-8")\n    title ${1:Title}\n  body\n    ${2:p Hello}', detail: 'Pug page skeleton' },
        ],
        python: [
            { label: 'main', insertText: 'def main():\n\t$1\n\nif __name__ == \'__main__\':\n\tmain()', detail: 'main guard' },
            { label: 'aiohttp-app', insertText: 'from aiohttp import web\n\nasync def handle(request):\n\treturn web.json_response({\'status\': \'ok\'})\n\napp = web.Application()\napp.router.add_get(\'/\', handle)\n\nif __name__ == \'__main__\':\n\tweb.run_app(app, port=${1:8080})', detail: 'aiohttp skeleton' },
        ],
        lua: [
            { label: 'hello', insertText: 'print("${1:hello}")', detail: 'print' },
        ],
        rust: [
            { label: 'main', insertText: 'fn main() {\n\t$1\n}', detail: 'main function' },
        ],
        ruby: [
            { label: 'main', insertText: 'def main\n\t$1\nend\n\nmain\n', detail: 'main method' },
        ],
        go: [
            { label: 'main', insertText: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("${1:hello}")\n}', detail: 'main package' },
        ],
    };

    for (const [language, items] of Object.entries(SNIPPETS)) {
        monaco.languages.registerCompletionItemProvider(language, {
            triggerCharacters: ['<', '#', '$'],
            provideCompletionItems(model, position) {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                return {
                    suggestions: items.map((item) => ({
                        label: item.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: item.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: item.detail,
                        range,
                    })),
                };
            },
        });
    }
};

const EditorContainer = styled.div`
    position: relative;
    min-height: 16rem;
    height: calc(100vh - 20rem);
    border: 1px solid var(--pn-border-strong);
    border-radius: var(--pn-radius-lg);
    overflow: hidden;
    box-shadow: var(--pn-shadow-1), var(--pn-inner-highlight);
    background: #fcfdff;

    & > .monaco-wrap {
        width: 100%;
        height: 100%;
    }

    .monaco-editor .margin,
    .monaco-editor .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background: transparent !important;
    }
    .monaco-editor .margin {
        background: #f5f6fc !important;
    }
`;

const StatusBar = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: 1.65rem;
    padding: 0 0.65rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    color: #6a7291;
    background: rgba(245, 246, 252, 0.92);
    border-top: 1px solid var(--pn-border);
    backdrop-filter: blur(8px);
    user-select: none;
`;

export interface Props {
    style?: React.CSSProperties;
    initialContent?: string;
    mode: string;
    filename?: string;
    onModeChanged: (mode: string) => void;
    fetchContent: (callback: () => Promise<string>) => void;
    onContentSaved: () => void;
    onContentChanged?: (content: string) => void;
}

const findModeByFilename = (filename: string) => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 && filename.substring(dot + 1).toLowerCase();

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext && info.ext.some((x) => x.toLowerCase() === ext)) {
                return info;
            }
        }
    }

    return undefined;
};

export default ({
    style,
    initialContent,
    filename,
    mode,
    fetchContent,
    onContentSaved,
    onModeChanged,
    onContentChanged,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
    const modelRef = useRef<monaco.editor.ITextModel>();
    const contentRef = useRef(initialContent ?? '');
    const onContentChangedRef = useRef(onContentChanged);
    const onContentSavedRef = useRef(onContentSaved);
    const onModeChangedRef = useRef(onModeChanged);
    const [cursor, setCursor] = useState({ line: 1, column: 1 });

    onContentChangedRef.current = onContentChanged;
    onContentSavedRef.current = onContentSaved;
    onModeChangedRef.current = onModeChanged;

    /* ---------- Create editor once ---------- */
    useEffect(() => {
        if (!containerRef.current) return;

        defineAuroraTheme();
        registerExtraSnippets();

        const editor = monaco.editor.create(containerRef.current, {
            value: contentRef.current,
            language: monacoLanguageFromMime(mode, filename),
            theme: 'aurora-light',
            automaticLayout: true,
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
            fontSize: 13,
            lineHeight: 21,
            letterSpacing: 0.2,
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: true,
            minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
            scrollBeyondLastLine: false,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'gutter',
            lineNumbers: 'on',
            folding: true,
            showFoldingControls: 'mouseover',
            foldingHighlight: true,
            guides: {
                indentation: true,
                bracketPairs: true,
                bracketPairsHorizontal: true,
                highlightActiveIndentation: true,
                highlightActiveBracketPair: true,
            },
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoClosingComments: 'always',
            autoSurround: 'languageDefined',
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: { other: true, comments: false, strings: true },
            quickSuggestionsDelay: 100,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            tabCompletion: 'on',
            wordBasedSuggestions: 'matchingDocuments',
            suggest: {
                preview: true,
                previewMode: 'subword',
                shareSuggestSelections: true,
                showClasses: true,
                showConstants: true,
                showConstructors: true,
                showDeprecated: true,
                showEnumMembers: true,
                showEnums: true,
                showEvents: true,
                showFields: true,
                showFiles: true,
                showFolders: true,
                showFunctions: true,
                showInlineDetails: true,
                showInterfaces: true,
                showIssues: true,
                showKeywords: true,
                showMethods: true,
                showModules: true,
                showOperators: true,
                showProperties: true,
                showReferences: true,
                showSnippets: true,
                showStructs: true,
                showTypeParameters: true,
                showUnits: true,
                showUsers: true,
                showValues: true,
                showVariables: true,
            },
            parameterHints: { enabled: true, cycle: true },
            hover: { enabled: true, delay: 300 },
            inlayHints: { enabled: 'on' },
            codeLens: true,
            lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.On },
            occurrencesHighlight: 'singleFile',
            selectionHighlight: true,
            links: true,
            contextmenu: true,
            find: { addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: 'always' },
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
            wordWrap: 'on',
            wrappingStrategy: 'advanced',
            unicodeHighlight: { nonBasicASCII: false },
        });

        modelRef.current = editor.getModel() ?? undefined;
        editorRef.current = editor;

        editor.onDidChangeCursorPosition((e) => {
            setCursor({ line: e.position.lineNumber, column: e.position.column });
        });

        editor.onDidChangeModelContent(() => {
            const value = editor.getValue();
            contentRef.current = value;
            onContentChangedRef.current?.(value);
        });

        editor.addAction({
            id: 'rizzdevs.save',
            label: 'Save file',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => onContentSavedRef.current(),
        });

        return () => {
            editor.dispose();
            modelRef.current?.dispose();
            editorRef.current = undefined;
            modelRef.current = undefined;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------- Mode (language) changes ---------- */
    useEffect(() => {
        const model = modelRef.current ?? editorRef.current?.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, monacoLanguageFromMime(mode, filename));
        }
    }, [mode, filename]);

    /* ---------- External content changes ---------- */
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const incoming = initialContent ?? '';
        if (editor.getValue() !== incoming) {
            const position = editor.getPosition();
            editor.setValue(incoming);
            contentRef.current = incoming;
            if (position) {
                editor.setPosition(position);
            }
            editor.pushUndoStop();
        }
    }, [initialContent]);

    /* ---------- Filename -> mode ---------- */
    useEffect(() => {
        if (filename === undefined) return;

        const info = findModeByFilename(filename);
        if (info && info.mime !== mode) {
            onModeChangedRef.current(info.mime);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filename]);

    /* ---------- fetchContent callback registration ---------- */
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            fetchContent(() => Promise.reject(new Error('no editor session has been configured')));
            return;
        }

        fetchContent(() => Promise.resolve(editor.getValue()));
        editor.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchContent]);

    const language = monacoLanguageFromMime(mode, filename);

    return (
        <EditorContainer style={style}>
            <div ref={containerRef} className={'monaco-wrap'} />
            <StatusBar>
                <span>
                    Ln {cursor.line}, Col {cursor.column}
                </span>
                <span>
                    {language.toUpperCase()} · Spaces: 4 · UTF-8 ·{' '}
                    <span style={{ color: 'var(--pn-primary-600)', fontWeight: 700 }}>Ctrl/⌘+S</span> to save
                </span>
            </StatusBar>
        </EditorContainer>
    );
};
