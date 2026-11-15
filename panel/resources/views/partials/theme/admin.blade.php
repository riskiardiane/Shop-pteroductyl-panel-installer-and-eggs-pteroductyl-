{{--
    Tema admin (AdminLTE) — "AURORA 2.0" LIGHT.
    Di-include dari resources/views/layouts/admin.blade.php.
    Nama variabel --adm-* dipertahankan supaya semua halaman (termasuk Billing)
    mewarisi tampilan baru tanpa ubah markup.
--}}
<style>
    :root {
        --adm-bg: #f4f5fb;
        --adm-bg-soft: #e9eaf3;
        --adm-surface: #ffffff;
        --adm-surface-2: #f6f6fc;
        --adm-surface-3: #ececf5;
        --adm-border: rgba(18, 24, 58, 0.085);
        --adm-border-strong: rgba(18, 24, 58, 0.16);
        --adm-border-accent: rgba(98, 80, 245, 0.34);
        --adm-text: #111733;
        --adm-muted: #3d4560;
        --adm-dim: #6a7291;
        --adm-primary: #6250f5;
        --adm-primary-600: #4f3de0;
        --adm-primary-300: #8a7bff;
        --adm-primary-soft: rgba(98, 80, 245, 0.09);
        --adm-cyan: #0e7d94;
        --adm-success: #049d6c;
        --adm-warning: #c77400;
        --adm-danger: #e0245e;
        --adm-radius: 13px;
        --adm-radius-lg: 17px;
        --adm-radius-xl: 22px;
        --adm-shadow: 0 1px 2px rgba(21, 27, 66, 0.055), 0 10px 30px -14px rgba(21, 27, 66, 0.14);
        --adm-shadow-lg: 0 2px 4px rgba(21, 27, 66, 0.05), 0 24px 54px -20px rgba(33, 28, 84, 0.32);
        --adm-inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.9);
        --adm-font: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        --adm-font-display: 'Outfit', var(--adm-font);
    }

    /* ================= BASE — kanvas aurora ================= */
    body.skin-blue,
    .wrapper,
    .content-wrapper,
    .left-side {
        background-color: var(--adm-bg) !important;
        color: var(--adm-text) !important;
        font-family: var(--adm-font);
    }
    .main-sidebar { background-color: transparent !important; }
    body {
        background-image:
            radial-gradient(1100px 620px at 12% -12%, rgba(98, 80, 245, 0.14), transparent 62%),
            radial-gradient(900px 560px at 88% -8%, rgba(23, 154, 185, 0.13), transparent 58%),
            radial-gradient(760px 720px at 50% 118%, rgba(138, 123, 255, 0.11), transparent 66%) !important;
        background-attachment: fixed;
    }
    a { color: var(--adm-primary-600); }
    a:hover, a:focus { color: #3f2fd0; }
    ::selection { background: rgba(98, 80, 245, 0.22); color: #241a5e; }
    :focus-visible { outline: 2px solid var(--adm-primary); outline-offset: 2px; border-radius: 6px; }

    /* ================= HEADER — glass bar ================= */
    .main-header { border-bottom: 1px solid var(--adm-border) !important; box-shadow: none !important; }
    .main-header .navbar {
        background-color: rgba(255, 255, 255, 0.78) !important;
        backdrop-filter: blur(18px) saturate(1.15);
        -webkit-backdrop-filter: blur(18px) saturate(1.15);
        box-shadow: none !important;
        border-bottom: 1px solid var(--adm-border);
    }
    .main-header .logo {
        background-color: transparent !important;
        border-bottom: 1px solid var(--adm-border) !important;
        color: var(--adm-primary-600) !important;
        font-family: var(--adm-font-display);
        font-weight: 800;
        letter-spacing: -0.02em;
    }
    .main-header .logo:hover, .main-header .logo:active { background-color: rgba(255, 255, 255, 0.6) !important; }
    .main-header .sidebar-toggle { color: var(--adm-primary-600) !important; }
    .main-header .sidebar-toggle:hover { background-color: var(--adm-primary-soft) !important; }
    .navbar-custom-menu > .navbar-nav > li > a { color: var(--adm-muted) !important; border-radius: 10px; }
    .navbar-custom-menu > .navbar-nav > li > a:hover,
    .navbar-custom-menu > .navbar-nav > li > a:focus {
        background-color: var(--adm-primary-soft) !important;
        color: var(--adm-primary-600) !important;
    }
    .user-menu .user-image { border: 2px solid var(--adm-primary) !important; box-shadow: 0 0 0 2px #fff; }

    /* ================= LAYOUT — header non-fixed, sidebar full height ================= */
    .wrapper {
        height: auto !important;
        min-height: 100vh;
        overflow: visible !important;
    }
    .main-header {
        position: relative !important;
        max-height: none !important;
        z-index: 1030 !important;
    }
    .main-header .logo {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 50px;
    }
    .main-header .logo .logo-image { height: 30px; width: auto; max-width: 110px; object-fit: contain; }
    .main-header .logo .logo-text { line-height: 1; }
    .content-wrapper { padding-top: 0 !important; min-height: 100vh !important; }
    .main-footer { margin-left: 230px; }

    /* ================= SIDEBAR — floating panel, full height ================= */
    .main-sidebar {
        position: fixed !important;
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        height: 100vh !important;
        min-height: 100vh !important;
        width: 230px;
        background: transparent !important;
        padding: 12px 0 12px 12px !important;
        overflow-y: auto;
        overflow-x: hidden;
        z-index: 810 !important;
        scrollbar-width: thin;
    }
    .sidebar {
        padding: 12px 10px !important;
        background: linear-gradient(180deg, #ffffff 0%, #fcfcff 100%) !important;
        border: 1px solid var(--adm-border) !important;
        border-radius: var(--adm-radius-xl) !important;
        box-shadow: var(--adm-shadow), var(--adm-inner-highlight) !important;
        height: 100% !important;
        min-height: 100% !important;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }
    .sidebar .sidebar-menu { flex: 1 0 auto; }
    .sidebar-menu > li.header {
        background: transparent !important;
        color: var(--adm-dim) !important;
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        padding: 16px 14px 6px;
    }
    .sidebar-menu > li > a {
        color: var(--adm-muted) !important;
        border-radius: 13px !important;
        margin: 2px 4px !important;
        padding: 10px 13px !important;
        border: 1px solid transparent;
        transition: all 0.16s ease;
        font-size: 13px;
        font-weight: 550;
        box-shadow: none !important;
    }
    .sidebar-menu > li > a:hover {
        background-color: var(--adm-primary-soft) !important;
        color: var(--adm-primary-600) !important;
        border-color: var(--adm-border-accent) !important;
        transform: translateX(2px);
    }
    .sidebar-menu > li.active > a,
    .sidebar-menu > li.menu-open > a {
        background: linear-gradient(135deg, #6d52f7 0%, #4f3de0 60%, #3f2fd0 100%) !important;
        color: #fff !important;
        border-color: transparent !important;
        box-shadow: 0 14px 28px -14px rgba(84, 61, 224, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
        text-shadow: 0 1px 1px rgba(30, 16, 92, 0.35);
    }
    .sidebar-menu > li.active > a .fa,
    .sidebar-menu > li.active > a .fas,
    .sidebar-menu > li.active > a .far,
    .sidebar-menu > li.menu-open > a .fa { color: #fff !important; }
    .sidebar-menu > li > a > .fa,
    .sidebar-menu > li > a > .fas,
    .sidebar-menu > li > a > .far { color: var(--adm-primary-300) !important; width: 20px; }
    .sidebar-menu .treeview-menu { background: transparent !important; }
    .sidebar-menu .treeview-menu > li > a {
        color: var(--adm-muted) !important;
        border-radius: 10px;
        margin: 2px 4px;
        padding: 8px 12px 8px 36px !important;
        font-size: 12px;
    }
    .sidebar-menu .treeview-menu > li > a:hover { color: var(--adm-primary-600) !important; background: var(--adm-primary-soft) !important; }

    /* ================= CONTENT HEADER ================= */
    .content-header { padding: 24px 28px 10px; }
    .content-header > h1 {
        color: var(--adm-text) !important;
        font-family: var(--adm-font-display);
        font-weight: 800;
        font-size: 25px;
        letter-spacing: -0.025em;
    }
    .content-header > h1 small { color: var(--adm-muted) !important; display: block; margin-top: 6px; font-size: 13px; font-weight: 500; }
    .content { padding: 18px 28px 28px; }

    .breadcrumb {
        background: rgba(255, 255, 255, 0.82) !important;
        backdrop-filter: blur(10px);
        border: 1px solid var(--adm-border) !important;
        border-radius: 999px !important;
        padding: 8px 16px !important;
        top: 24px !important;
        right: 28px !important;
        font-size: 12px;
        box-shadow: var(--adm-shadow);
    }
    .breadcrumb > li, .breadcrumb > li > a { color: var(--adm-muted) !important; }
    .breadcrumb > li > a:hover { color: var(--adm-primary-600) !important; }
    .breadcrumb > li.active { color: var(--adm-primary-600) !important; font-weight: 650; }

    /* ================= BOX / CARD ================= */
    .box {
        background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0) 45%) padding-box, var(--adm-surface) !important;
        border: 1px solid var(--adm-border) !important;
        border-radius: var(--adm-radius-xl) !important;
        box-shadow: var(--adm-shadow), var(--adm-inner-highlight) !important;
        color: var(--adm-text);
        overflow: hidden;
    }
    .box.box-primary, .box.box-info { border-top: 1px solid var(--adm-border-accent) !important; }
    .box-header {
        color: var(--adm-text) !important;
        border-bottom: 1px solid var(--adm-border) !important;
        padding: 15px 20px;
        background: linear-gradient(180deg, rgba(18, 24, 58, 0.022), transparent) !important;
    }
    .box-header .box-title {
        color: var(--adm-text) !important;
        font-family: var(--adm-font-display);
        font-weight: 750 !important;
        font-size: 15.5px;
        letter-spacing: -0.015em;
    }
    .box-header > .fa, .box-header > .fas { color: var(--adm-primary) !important; }
    .box-body { padding: 20px; color: var(--adm-muted); }
    .box-footer {
        background-color: var(--adm-surface-2) !important;
        border-top: 1px solid var(--adm-border) !important;
        border-radius: 0 0 var(--adm-radius-xl) var(--adm-radius-xl);
    }
    .box-tools .btn { border-radius: 10px !important; }
    .box-solid.box-primary > .box-header { background: linear-gradient(135deg, #6d52f7, #4f3de0) !important; }
    .callout { border-radius: var(--adm-radius) !important; }

    /* ================= INFO / SMALL BOX ================= */
    .small-box {
        border-radius: var(--adm-radius-xl) !important;
        box-shadow: var(--adm-shadow), var(--adm-inner-highlight) !important;
        overflow: hidden;
        border: 1px solid var(--adm-border);
    }
    .small-box h3 { font-family: var(--adm-font-display); font-weight: 800 !important; letter-spacing: -0.02em; }
    .small-box .icon { opacity: 0.22; }
    .small-box-footer { background: rgba(0, 0, 0, 0.16) !important; color: inherit !important; }
    .bg-aqua, .small-box.bg-aqua { background: linear-gradient(135deg, #0b5d70, #17a2b8) !important; color: #ecfeff !important; }
    .bg-green, .small-box.bg-green { background: linear-gradient(135deg, #037152, #10b981) !important; color: #ecfdf5 !important; }
    .bg-yellow, .small-box.bg-yellow { background: linear-gradient(135deg, #9a5700, #f3a13b) !important; color: #fffbeb !important; }
    .bg-red, .small-box.bg-red { background: linear-gradient(135deg, #b3124f, #f43f5e) !important; color: #fff !important; }
    .bg-purple, .small-box.bg-purple { background: linear-gradient(135deg, #4f3de0, #8a7bff) !important; color: #fff !important; }
    .bg-blue, .small-box.bg-blue { background: linear-gradient(135deg, #3f2fd0, #6d52f7) !important; color: #fff !important; }

    /* ================= STAT / PANEL KUSTOM (overview) ================= */
    .adm-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
    .adm-stat {
        position: relative;
        display: flex; align-items: flex-start; gap: 14px;
        padding: 18px; border-radius: var(--adm-radius-xl);
        background: var(--adm-surface); border: 1px solid var(--adm-border);
        box-shadow: var(--adm-shadow), var(--adm-inner-highlight);
        overflow: hidden;
    }
    .adm-stat::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
        background: linear-gradient(90deg, transparent, rgba(98, 80, 245, 0.5), transparent);
    }
    .adm-stat__icon {
        display: flex; align-items: center; justify-content: center;
        width: 44px; height: 44px; flex-shrink: 0; border-radius: 13px;
        background: linear-gradient(135deg, rgba(98, 80, 245, 0.16), rgba(138, 123, 255, 0.06));
        border: 1px solid var(--adm-border-accent);
        color: var(--adm-primary-600); font-size: 16px;
    }
    .adm-stat__label { font-size: 9.5px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; color: var(--adm-dim); }
    .adm-stat__value { font-family: var(--adm-font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; color: var(--adm-text); font-variant-numeric: tabular-nums; }
    .adm-stat__hint { font-size: 11px; color: var(--adm-muted); }

    .adm-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 11px; border-radius: 999px; font-size: 10.5px; font-weight: 750; letter-spacing: 0.03em;
        border: 1px solid var(--adm-border-strong); background: var(--adm-surface-2); color: var(--adm-muted);
    }
    .adm-badge--success { border-color: rgba(4, 157, 108, 0.36); background: rgba(4, 157, 108, 0.09); color: #037152; }
    .adm-badge--primary { border-color: var(--adm-border-accent); background: var(--adm-primary-soft); color: var(--adm-primary-600); }
    .adm-badge--warning { border-color: rgba(199, 116, 0, 0.36); background: rgba(199, 116, 0, 0.08); color: #9a5700; }
    .adm-badge--danger { border-color: rgba(224, 36, 94, 0.32); background: rgba(224, 36, 94, 0.07); color: #b3124f; }
    .adm-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .adm-panel {
        background: var(--adm-surface); border: 1px solid var(--adm-border);
        border-radius: var(--adm-radius-xl); overflow: hidden;
        box-shadow: var(--adm-shadow), var(--adm-inner-highlight);
    }
    .adm-panel__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 20px; border-bottom: 1px solid var(--adm-border); background: linear-gradient(180deg, rgba(18,24,58,0.022), transparent); }
    .adm-panel__title { font-family: var(--adm-font-display); font-size: 15px; font-weight: 750; letter-spacing: -0.015em; color: var(--adm-text); }
    .adm-panel__body { padding: 20px; }

    /* ================= TABLE ================= */
    .table > thead > tr > th {
        border-bottom: 1px solid var(--adm-border) !important;
        color: var(--adm-dim) !important;
        font-size: 9.5px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase;
        padding: 12px 14px !important;
        background: var(--adm-surface-2);
    }
    .table > tbody > tr > td {
        border-top: 1px solid var(--adm-border) !important;
        color: var(--adm-muted) !important;
        padding: 12px 14px !important;
        vertical-align: middle !important;
    }
    .table > tbody > tr > td:first-child { color: var(--adm-text) !important; }
    .table-hover > tbody > tr:hover { background-color: rgba(98, 80, 245, 0.05) !important; }
    .table-striped > tbody > tr:nth-of-type(odd) { background-color: rgba(18, 24, 58, 0.016) !important; }
    .table-bordered, .table-bordered > tbody > tr > td, .table-bordered > thead > tr > th { border-color: var(--adm-border) !important; }

    /* ================= FORM ================= */
    .form-control, .select2-container .select2-selection--single, .select2-container--default .select2-selection--multiple {
        background-color: var(--adm-surface) !important;
        border: 1px solid var(--adm-border-strong) !important;
        color: var(--adm-text) !important;
        border-radius: 11px !important;
        box-shadow: inset 0 1.5px 3px rgba(18, 24, 58, 0.05) !important;
        min-height: 39px;
        transition: border-color .16s ease, box-shadow .16s ease;
    }
    .form-control:focus {
        border-color: var(--adm-primary) !important;
        box-shadow: 0 0 0 4px rgba(98, 80, 245, 0.15) !important;
    }
    .form-control::placeholder { color: var(--adm-dim) !important; }
    select.form-control option { background: var(--adm-surface); color: var(--adm-text); }
    .input-group-addon { background: var(--adm-surface-2) !important; border-color: var(--adm-border-strong) !important; color: var(--adm-muted) !important; }
    .control-label, label { color: var(--adm-muted); font-weight: 600; font-size: 12px; }
    .help-block { color: var(--adm-dim) !important; }
    .select2-container--default .select2-selection--single .select2-selection__rendered { color: var(--adm-text) !important; line-height: 37px !important; }
    .select2-dropdown { background: var(--adm-surface) !important; border-color: var(--adm-border-strong) !important; border-radius: var(--adm-radius) !important; overflow: hidden; box-shadow: var(--adm-shadow-lg); }
    .select2-results__option--highlighted { background: var(--adm-primary) !important; }
    .checkbox label, .radio label { color: var(--adm-muted); }

    /* ================= BUTTON ================= */
    .btn { border-radius: 11px !important; font-weight: 650; transition: all 0.16s ease; border-width: 1px; letter-spacing: 0.005em; }
    .btn-primary {
        background: linear-gradient(135deg, #6d52f7 0%, #4f3de0 60%, #3f2fd0 100%) !important;
        border-color: transparent !important;
        color: #fff !important;
        box-shadow: 0 14px 28px -14px rgba(84, 61, 224, 0.66), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
        text-shadow: 0 1px 1px rgba(30, 16, 92, 0.35);
    }
    .btn-primary:hover, .btn-primary:focus, .btn-primary:active {
        background: linear-gradient(135deg, #7d64ff 0%, #5b49ee 60%, #4736dc 100%) !important;
        border-color: transparent !important;
        color: #fff !important;
    }
    .btn-default, .btn-gray-alt {
        background: linear-gradient(180deg, #ffffff, #fbfaff) !important;
        border-color: var(--adm-border-strong) !important;
        color: var(--adm-text) !important;
        box-shadow: var(--adm-shadow);
    }
    .btn-default:hover, .btn-gray-alt:hover { background: var(--adm-surface-2) !important; border-color: var(--adm-border-accent) !important; color: var(--adm-primary-600) !important; }
    .btn-danger { background: rgba(224, 36, 94, 0.07) !important; border-color: rgba(224, 36, 94, 0.34) !important; color: #b3124f !important; }
    .btn-success { background: rgba(4, 157, 108, 0.09) !important; border-color: rgba(4, 157, 108, 0.36) !important; color: #037152 !important; }
    .btn-link { color: var(--adm-primary-600) !important; }

    /* ================= MISC ================= */
    .main-footer {
        background: transparent !important;
        border-top: 1px solid var(--adm-border) !important;
        color: var(--adm-dim) !important;
        padding: 16px 28px;
    }
    .main-footer a { color: var(--adm-primary-600) !important; }
    .alert { border-radius: var(--adm-radius) !important; border-width: 1px !important; }
    .alert-danger { background: rgba(224, 36, 94, 0.06) !important; border-color: rgba(224, 36, 94, 0.3) !important; color: #b3124f !important; }
    .alert-success { background: rgba(4, 157, 108, 0.06) !important; border-color: rgba(4, 157, 108, 0.3) !important; color: #037152 !important; }
    .alert-warning { background: rgba(199, 116, 0, 0.07) !important; border-color: rgba(199, 116, 0, 0.3) !important; color: #8a4d00 !important; }
    .alert-info { background: rgba(14, 125, 148, 0.06) !important; border-color: rgba(14, 125, 148, 0.28) !important; color: #0b5d70 !important; }
    .modal-content { background: var(--adm-surface) !important; border: 1px solid var(--adm-border) !important; border-radius: var(--adm-radius-xl) !important; color: var(--adm-text); box-shadow: var(--adm-shadow-lg); }
    .modal-header { border-bottom-color: var(--adm-border) !important; }
    .modal-footer { border-top-color: var(--adm-border) !important; }
    .modal-title { color: var(--adm-text); font-family: var(--adm-font-display); font-weight: 750; }
    .nav-tabs { border-bottom-color: var(--adm-border) !important; }
    .nav-tabs > li > a { color: var(--adm-muted) !important; border-radius: 10px 10px 0 0 !important; }
    .nav-tabs > li.active > a, .nav-tabs > li.active > a:hover, .nav-tabs > li.active > a:focus {
        background: var(--adm-surface) !important;
        border-color: var(--adm-border) var(--adm-border) transparent !important;
        color: var(--adm-primary-600) !important;
        font-weight: 650;
    }
    .pagination > li > a, .pagination > li > span {
        background: var(--adm-surface) !important;
        border-color: var(--adm-border) !important;
        color: var(--adm-muted) !important;
    }
    .pagination > .active > a, .pagination > .active > span {
        background: var(--adm-primary) !important;
        border-color: var(--adm-primary) !important;
        color: #fff !important;
    }
    .progress { background: var(--adm-surface-3) !important; border-radius: 999px !important; height: 8px; box-shadow: inset 0 1.5px 3px rgba(18,24,58,0.1); }
    .progress-bar { background: linear-gradient(90deg, var(--adm-primary), var(--adm-cyan)) !important; }
    .text-muted { color: var(--adm-dim) !important; }
    .text-gray { color: var(--adm-dim) !important; }
    .bg-gray { background: var(--adm-surface-2) !important; }
    .well, .panel { background: var(--adm-surface) !important; border-color: var(--adm-border) !important; border-radius: var(--adm-radius-xl) !important; color: var(--adm-text); }
    .swal-modal { background: var(--adm-surface) !important; border-radius: var(--adm-radius-xl) !important; box-shadow: var(--adm-shadow-lg); }
    .swal-title, .swal-text { color: var(--adm-text) !important; }
    .code, pre, code { background: var(--adm-surface-2); border-color: var(--adm-border); color: #334155; border-radius: 8px; }

    * { scrollbar-width: thin; scrollbar-color: rgba(98, 80, 245, 0.4) transparent; }
    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-thumb { background: rgba(98, 80, 245, 0.34); border: 3px solid transparent; background-clip: padding-box; border-radius: 999px; }

    @media (max-width: 991px) {
        .main-sidebar { padding: 0 !important; transform: translate(-230px, 0); height: 100vh !important; }
        body.sidebar-open .main-sidebar { transform: translate(0, 0) !important; }
        .sidebar { height: 100vh !important; min-height: 100vh !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
        .content-wrapper, .main-footer { margin-left: 0 !important; }
    }
    @media (max-width: 767px) {
        .content-header { padding: 16px 16px 4px; }
        .content { padding: 12px 16px 20px; }
        .breadcrumb { position: static !important; margin-top: 10px; display: inline-block; }
        .adm-grid { grid-template-columns: 1fr; }
    }
</style>
