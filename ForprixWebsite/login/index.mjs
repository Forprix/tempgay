import { $1, $url, $sleep, $choice, $shuffle } from '../util.mjs'
import { send, setHandler } from '../util/communication.mjs'

const query = new URLSearchParams(location.search)
const redirect = $url('/' + query.get('redirect'))

// Title
const title = $1('.title')
{
    let choices = [
        'Authenticate',
        "Prove It's You",
        'Pass the Security Check',
        'Prove Your Worth',
        'Assert Your Identity',
        'Confirm Your Existence',
        'Authenticate Your Awesomeness',
        'Verify Your Coolness',
        'Certify Your Radness',
        'Validate Your Swagger',
        'Affirm Your Fabulousness',
        'Confirm Your Epicness',
        'Assert Your Superpower',
        'Verify Your Uniqueness',
        'Certify Your Brilliance',
        'Validate Your Geek Cred',
        'Authenticate Your Inner Rockstar',
        "Prove You're the Real Deal",
        'Confirm Your Quirkiness',
        'Assert Your Ninja Status',
        'Validate Your Magic',
        'Certify Your Geek Chic',
        'Authenticate Your Unicorn Nature'
    ]

    let cursorVisible = false
    
    let choice
    ;(async () => {
        let i = 0
        while (true) {
            title.innerText = '_'
            await $sleep(0.2)
            if (i == 0) choices = $shuffle(choices)
            choice = choices[i]
            i = (i + 1) % choices.length
            for (let i = 1; i <= choice.length; ++i) {
                title.innerText = choice.slice(0, i) + '_'
                if (choice[i - 1] == ' ')
                    await $sleep(0.05 * Math.random() ** 4 + 0.1)
                else
                    await $sleep(0.02 * Math.random() ** 4 + 0.06)
            }
            for (let i = 0; i < 3; ++i) {
                await $sleep(0.5)
                title.innerText = choice
                await $sleep(0.5)
                title.innerText = choice + '_'
            }
            title.innerText = choice.slice(0, -1) + '_'
            await $sleep(0.5)
            for (let i = 2; i < choice.length; ++i) {
                title.innerText = choice.slice(0, -i) + '_'
                await $sleep(0.03)
            }
        }
    })()
}

const emailInput = document.querySelector('.email-input')
const passwordInput = document.querySelector('.password-input')

const emailReminder = document.querySelector('.email-reminder')

const knownEmailWebsites = {
    'gmail.com': 'https://mail.google.com/',
    'mail.ru': 'https://e.mail.ru/'
}
const mousePos = { x: 0, y: 0 }
addEventListener('mousemove', e => {
    mousePos.x = e.clientX / document.body.clientWidth
    mousePos.y = e.clientY / document.body.clientHeight
})
function spawnSplashMessage(text, color) {
    const el = document.createElement('div')
    el.classList.add('splashMessage')
    el.style.color = color ?? 'white'
    el.innerText = text
    const x = mousePos.x
    const y = mousePos.y
    const angle = Math.round(Math.random() * 80 - 40)
    ;(async () => {
        for (let i = 0; i < 300; ++i) {
            const f = (Math.cos(i / 300 * Math.PI) / 2 + 0.5)
            el.style.transform = `translate(${Math.round(x * document.body.clientWidth)}px, ${Math.round(y * document.body.clientHeight)}px) translate(-50%, -50%) scale(${f * 100}%) translate(${Math.round(Math.random() * 4 - 2)}px, ${Math.round(Math.random() * 4 - 2)}px) scale(${f * 100}%) rotate(${angle}deg)`
            await $sleep(1 / 60)
        }
        el.remove()
    })()
    document.body.append(el)
}

$1('.sign-up-button').on('click', async () => {
    const res = await send('signUp', {
        email: emailInput.value,
        password: passwordInput.value,
        redirect
    })
    if (res.error != null) {
        spawnSplashMessage(res.error.message, '#F33')
        return
    }
    const website = knownEmailWebsites[emailInput.value.split('@')[1].toLowerCase()]
    if (website != null) {
        emailReminder.href = website
        emailReminder.classList.add('clickable')
        emailReminder.addEventListener('click', () => send('replaceLocation', website))
    }
    emailReminder.innerText = emailInput.value
    $1('.form1').classList.add('hidden')
    $1('.form2').classList.remove('hidden')
})
$1('.sign-in-button').on('click', async () => {
    const res = await send('signIn', {
        email: emailInput.value,
        password: passwordInput.value
    })
    if (res.error != null) {
        spawnSplashMessage(res.error.message, '#F33')
        return
    }
    location.href = redirect
})

$1('.email-icon').on('click', () => {
    $1('.form1').classList.remove('hidden')
    $1('.form3').classList.add('hidden')
    title.classList.remove('hidden')
})
$1('.discord-icon').on('click', () => send('signInWithOAuth', { provider: 'discord', redirect }))
$1('.google-icon').on('click', () => send('signInWithOAuth', { provider: 'google', redirect }))
$1('.github-icon').on('click', () => send('signInWithOAuth', { provider: 'github', redirect }))
$1('.figma-icon').on('click', () => send('signInWithOAuth', { provider: 'figma', redirect }))
$1('.gitlab-icon').on('click', () => send('signInWithOAuth', { provider: 'gitlab', redirect }))
$1('.facebook-icon').on('click', () => spawnSplashMessage('stop the war', '#F33'))
$1('.twitch-icon').on('click', () => send('signInWithOAuth', { provider: 'twitch', redirect }))

{
    emailInput.addEventListener('keypress', e => {
        if (e.code == 'Enter') e.preventDefault()
    })

    emailInput.addEventListener('input', () => {
        if (emailInput.value == '')
            document.querySelector('.email-input-placeholder').style = ''
        else
            document.querySelector('.email-input-placeholder').style = 'display: none;'
    })

    passwordInput.addEventListener('keypress', e => {
        if (e.code == 'Enter') e.preventDefault()
    })

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value == '')
            document.querySelector('.password-input-placeholder').style = ''
        else
            document.querySelector('.password-input-placeholder').style = 'display: none;'
    })
}