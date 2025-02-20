import { $, $1, $el, $url } from './util.mjs'
import { send, setHandler, setRemoteTarget } from './util/communication.mjs'

const client = supabase.createClient(
    'https://fmpyiquamzzzzwwrqzvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcHlpcXVhbXp6enp3d3JxenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcyNTEzNTYsImV4cCI6MjAyMjgyNzM1Nn0.5WVOpRXqtgeZ3HXRtTVNdLQ4tRLLpbZdfm5b5PNWkas'
)

// const client = supabase.createClient(
//     'https://slhjhcwpdvfawqpfogec.supabase.co',
//     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsaGpoY3dwZHZmYXdxcGZvZ2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQzNzcyNTYsImV4cCI6MjAzOTk1MzI1Nn0.pyOdPXew6xHPxa6daUV__df_BqcuGbhwnRpH_xXslGs'
// )

const iframe = $1('.body > .body-iframe')


const searchDoesntWork = new Audio('./assets/search-doesnt-work.ogg')
const joinPleaseAudio = new Audio('./assets/please-join.ogg')
joinPleaseAudio.loop = true

//document.title = '👁️👄👁️ 𝗙𝗢𝗥𝗣𝗥𝗜𝗫'
const defaultTitle = 'Forprix'

document.title = defaultTitle

let pages

// Location Navigation Function
const switchBodyPage = (() => {
    const headerTitleEl = $1('.header-title')
    const menuTitleEl = $1('.menu-title-text')

    setRemoteTarget(iframe.contentWindow || iframe.contentDocument.defaultView)

    iframe.addEventListener('load', () => {
        const win = iframe.contentWindow || iframe.contentDocument.defaultView
        const path = win.location.pathname.replace(/\/$/, '')
        const page = pages.find(x => x.path == path)
        if (page) {
            headerTitleEl.innerHTML = `FORPRIX /&nbsp;<div style="color:${page.color}">${page.name.toUpperCase()}</div>`
            menuTitleEl.innerHTML = `FORPRIX /&nbsp;<div style="color:${page.color}">${page.name.toUpperCase()}</div>`
        }
        const href = win.location.href
        const titleEl = iframe.contentDocument.querySelector('head > title')
        document.title = titleEl?.innerText ?? 'Forprix'
        history.replaceState(href, href, href)
    })
    return function(path, search) {
        return new Promise(res => {
            $1('.menu').classList.remove('open')
            if (iframe.src && $url(iframe.src) == $url(path))
                return

            $('.menu-location-selected').forEach(el => el.classList.remove('menu-location-selected'))
            const menuLocationEl = $1(`.menu-location[data-path="${path}"]`)
            // Элемент menu-location не успевает создаться при первой загрузке страницы
            if (menuLocationEl)
                menuLocationEl.classList.add('menu-location-selected')
        
            const listener = () => {
                $1('.body').classList.remove('loading')
                res()
                iframe.removeEventListener('load', listener)
                iframe.removeEventListener('error', listener)
            }
            iframe.addEventListener('load', listener)
            iframe.addEventListener('error', listener)
            $1('.body').classList.add('loading')
            const url_ = new URL($url(path))
            url_.search = search ?? ''
            iframe.src = url_
        })
    }
})()

setHandler('login', async msg => {
    const params = { }
    if (msg?.redirect != null)
        params.redirect = msg.redirect
    else
        params.redirect = new URL($url(iframe.src)).pathname.replace(/(^\/|\/$)/g, '')
    switchBodyPage('/login', '' + new URLSearchParams(params))
    await new Promise(()=>{})
})

setHandler('test', async () => {
    console.log('user', await client.auth.getUser())
    console.log('session', await client.auth.getSession())
    console.log('userIdentities', await client.auth.getUserIdentities())
    console.log('updateUser', await client.auth.updateUser())
    console.log('auth', client.auth)
})
setHandler('replaceLocation', async location => {
    window.location.href = $url(location)
    return Promise(()=>{})
})
setHandler('getUser', async () => {
    return await client.auth.getUser()
})
setHandler('getSession', async () => {
    return await client.auth.getSession()
})
setHandler('signUp', async msg => {
    const arg = {
        email: msg.email,
        password: msg.password,
    }
    if (msg.redirect != null) arg.redirectTo = msg.redirect
    return await client.auth.signUp(arg)
})
setHandler('signIn', async msg => {
    return await client.auth.signInWithPassword({
        email: msg.email,
        password: msg.password
    })

})
setHandler('signInWithOAuth', async msg => {
    const arg = { provider: msg.provider }
    if (msg.redirect != null) {
        arg.options = { redirectTo: msg.redirect }
    }
    return await client.auth.signInWithOAuth(arg)
})


// Locations
;(async () => {
    pages = await (await fetch('locations.json')).json()
    const menuLocationsEl = document.querySelector('.menu-locations')
    for (const page of pages) {
        const el = $el('div', {
            content: 'FORPRIX /\u00A0',
            class: 'menu-location',
            data: { path: page.path },
            child: $el('div', {
                content: page.name.toUpperCase(),
                style: { color: page.color }
            })
        })
        el.addEventListener('click', () => switchBodyPage(el.getAttribute('data-path')))
        el.addEventListener('auxclick', (e) => {
            if (e.button == 1) {
                open(el.getAttribute('data-path'))
                e.preventDefault()
            }
        })
        menuLocationsEl.append(el)
    }


    let pageChosen = false
    const query = new URL(document.location).searchParams
    const search = '' + new URLSearchParams(Object.fromEntries([...query.entries()].filter(x => x[0] != 'path')))
    const queryPath = query.get('path')
    if (queryPath) {
        switchBodyPage(`/${queryPath}`, search)
        pageChosen = true
    }
    if (!pageChosen) {
        const url = localStorage.getItem('path')
        if (url) {
            switchBodyPage(url)
            pageChosen = true
        }
    }
    if (!pageChosen) switchBodyPage(pages.find(x => x.main).path)
})()

addEventListener('beforeunload', () => {
    const selectedLocationEl = $1(`.menu-location-selected`)
    if (selectedLocationEl)
        localStorage.setItem('path', selectedLocationEl.getAttribute('data-path'))
})

// Menu
{
    const menu = $1('.menu')
    $('.menu-button').on('click', () => {
        if (menu.classList.contains('open'))
            menu.classList.remove('open')
        else
            menu.classList.add('open')
    })

    const iframeEl = $1('.body > .body-iframe')
    const menuEl = $1('.menu')

    iframeEl.addEventListener('load', () =>
        iframeEl.contentDocument.addEventListener('mousedown', () =>
            menuEl.classList.remove('open')
        )
    )

    // Menu Bottom Media Buttons
    {
        $('.menu-bottom-media-discord').on('click', () => open('https://discord.gg/QjwC5Gs936', 'forprix-discord'))
        $('.menu-bottom-media-soundcloud').on('click', () => open('https://soundcloud.com/forprix', 'forprix-soundcloud'))
        $('.menu-bottom-media-github').on('click', () => open('https://github.com/Forprix', 'forprix-github'))
        $('.menu-bottom-media-youtube').on('click', () => open('https://www.youtube.com/@forprix', 'forprix-youtube'))
    }
}

// Header 
{
    // Header Discord Button
    {
        const el = $1('.discord-button')
        el.addEventListener('click', () => window.open('https://discord.gg/QjwC5Gs936', 'Discord'))
        setInterval(() => {
            if (e)
                el.style = `transform: scale(1.4) translate(${Math.floor(Math.random() * 20 - 10)}px, ${Math.floor(Math.random() * 20 - 10)}px)`
            else
                el.style = ``
        }, 1000 / 60)
        let e = false
        el.addEventListener('mouseleave', () => {
            e = false
            joinPleaseAudio.pause()
        })
        let ready = false
        addEventListener('mousedown', () => ready = true)
        addEventListener('keydown', () => ready = true )
        el.addEventListener('mouseenter', () => {
            e = true
            if (ready)
                joinPleaseAudio.play()
        })
    }
    
    // Header Search Bar
    {
        document.querySelector('.search-bar-button').addEventListener('click', () => {
            searchDoesntWork.currentTime = 0
            searchDoesntWork.play()
        })
    
        const input = document.querySelector('.search-bar-input')
        input.addEventListener('keypress', (evt) => {
            if (evt.code == 'Enter') {
                evt.preventDefault();
            }
        })
        input.addEventListener('input', () => {
            document.querySelector('.body .body-iframe').contentWindow.postMessage({
                type: 'search',
                data: input.innerText
            }, '*')
            if (input.innerText == '' || input.innerText == '\n') {
                document.querySelector('.search-bar-placeholder').style = ''
            }
            else {
                document.querySelector('.search-bar-placeholder').style = 'display: none;'
            }
        })
    }
}
