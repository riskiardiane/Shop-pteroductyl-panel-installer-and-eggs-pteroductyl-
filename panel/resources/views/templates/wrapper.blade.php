@include('blueprint.dashboard.dashboard')
@yield('blueprint.lib')

<!DOCTYPE html>
<html>
    <head>
        @php
            $webName = config('web.name') ?: config('app.name', 'RizzDevs');
            $webTitle = config('web.title') ?: $webName;
            $webDescription = config('web.description');
            $webFavicon = config('web.favicon');
            $webThemeColor = config('web.theme_color') ?: '#f5f6fa';
        @endphp
        <title>{{ $webTitle }}</title>

        @yield('head')

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="robots" content="noindex">
        <meta name="description" content="{{ $webDescription ?: $webTitle }}">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://recaptcha.net">
            @if($webFavicon)
                <link rel="icon" href="{{ $webFavicon }}">
                <link rel="shortcut icon" href="{{ $webFavicon }}">
                <link rel="apple-touch-icon" href="{{ $webFavicon }}">
            @else
                <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
                <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
                <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
                <link rel="manifest" href="/favicons/manifest.json">
                <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#6250f5">
                <link rel="shortcut icon" href="/favicons/favicon.ico">
                <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            @endif
            <meta name="theme-color" content="{{ $webThemeColor }}">
        @show

        @section('user-data')
            <script>
                {{-- Statistik publik dipakai landing page & pricing untuk social proof. --}}
                window.SystemStats = {
                    serversCount: {{ \Pterodactyl\Models\Server::count() }},
                    usersCount: {{ \Pterodactyl\Models\User::count() }},
                    nestsCount: {{ \Pterodactyl\Models\Nest::count() }},
                    eggsCount: {{ \Pterodactyl\Models\Egg::count() }},
                    nodesCount: {{ \Pterodactyl\Models\Node::count() }}
                };
            </script>
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif

            @include('partials.theme.plans-bootstrap')
        @show

        @yield('assets')

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? 'bg-neutral-50' }}">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')

            @yield('blueprint.wrappers')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
