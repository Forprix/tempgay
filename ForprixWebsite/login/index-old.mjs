import { $sleep, $choice } from "/util.mjs"
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js'
import {
    getAuth,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    setPersistence,
    indexedDBLocalPersistence,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    onIdTokenChanged
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js'
import { getDatabase, ref, set, push, onValue, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js"

const verifyEmailMessageEl = document.querySelector('.message-verify-email')

const app = initializeApp({
    apiKey: "AIzaSyDNrdLrHVZOCdIuFfa7_na8GdwP15duF5M",
    authDomain: "helical-indexer-351400.firebaseapp.com",
    databaseURL: "https://helical-indexer-351400-default-rtdb.firebaseio.com",
    projectId: "helical-indexer-351400",
    storageBucket: "helical-indexer-351400.appspot.com",
    messagingSenderId: "776078909636",
    appId: "1:776078909636:web:07cae773dd6b4a1a356991"
})
const auth = getAuth(app)
let user
onAuthStateChanged(auth, async u => {
    user = u
    if (user) {
        if (u.emailVerified) {
            await user.getIdToken(true)
            location.href = '/chat'
        }
        else {
            verifyEmailMessageEl.innerText = `Verify your email: ${user.email}`
            document.body.classList.remove('form1')
            document.body.classList.add('form2')
        }
    }
})
await setPersistence(auth, indexedDBLocalPersistence)

// Title
{
    const title = document.querySelector('.title')
    const choices = [
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
        while (true) {
            title.innerText = '_'
            await $sleep(0.2)
            choice = $choice(choices)
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
{
    const differentEmailButtonEl = document.querySelector('.another-email-button')
    const emailVerifiedButtonEl = document.querySelector('.email-verified-button')
    const textEl = emailVerifiedButtonEl.querySelector('div')
    let locked = false
    emailVerifiedButtonEl.addEventListener('click', async () => {
        if (locked) return;
        locked = true
        
        textEl.innerText = 'Checking...'
        await user.reload()
        if (user?.emailVerified) {
            await user.getIdToken(true)
            location.href = '/chat'
        }
        else {
            textEl.style = 'color: #F44'
            spawnSplashMessage('Liar!', '#F44')
            textEl.innerText = '...'
            await $sleep(2)
            textEl.style = ''
            textEl.innerText = 'Verified!'
        }
        locked = false
    })
    differentEmailButtonEl.addEventListener('click', async () => {
        await signOut(auth)
        emailInput.value = ''
        passwordInput.value = ''
        document.body.classList.remove('form2')
        document.body.classList.add('form1')
    })
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

{
    emailInput.addEventListener('keypress', e => {
        if (e.code == 'Enter')
            e.preventDefault()
        })
    emailInput.addEventListener('input', () => {
        if (emailInput.value == '')
            document.querySelector('.email-input-placeholder').style = ''
        else
            document.querySelector('.email-input-placeholder').style = 'display: none;'
    })

    passwordInput.addEventListener('keypress', e => {
        if (e.code == 'Enter')
            e.preventDefault()
        })
    passwordInput.addEventListener('input', () => {
        if (passwordInput.value == '')
            document.querySelector('.password-input-placeholder').style = ''
        else
            document.querySelector('.password-input-placeholder').style = 'display: none;'
    })
}

{
    const signUpButtonEl = document.querySelector('.sign-up-button')
    const signInButtonEl = document.querySelector('.sign-in-button')

    signUpButtonEl.addEventListener('click', async () => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
            await sendEmailVerification(credential.user, {
                url: 'http://localhost/authenticate' // TODO
            })
        } catch (e) {
            spawnSplashMessage(({
                'auth/invalid-email': 'Invalid Email',
                'auth/missing-email': 'Missing Email',
                'auth/missing-password': 'Missing Password',
                'auth/email-already-in-use': 'Email Taken',
                'auth/weak-password': 'Password Too Weak'
            })[e.code] ?? 'Unknown Error', '#F84')
        }
    })

    signInButtonEl.addEventListener('click', async () => {
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        } catch (e) {
            spawnSplashMessage(({
                'auth/invalid-email': 'Invalid Email',
                'auth/user-not-found': 'User Not Found',
                'auth/wrong-password': 'Wrong Password',
                'auth/missing-password': 'Missing Password'
            })[e.code] ?? 'Unknown Error', '#F84')
        }
    })
}