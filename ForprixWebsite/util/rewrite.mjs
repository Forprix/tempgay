if (window == top) {
    const url = new URL(location)
    url.search = '' + new URLSearchParams({
        path: location.pathname.replace(/(^\/|\/$)/g, ''),
        ...Object.fromEntries([...url.searchParams.entries()])
    })
    url.pathname = '/'
    location.replace(url)
}