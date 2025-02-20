import { $el } from '../util.mjs'
import { send, setHandler } from '../util/communication.mjs'

const client = supabase.createClient(
    'https://fmpyiquamzzzzwwrqzvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcHlpcXVhbXp6enp3d3JxenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcyNTEzNTYsImV4cCI6MjAyMjgyNzM1Nn0.5WVOpRXqtgeZ3HXRtTVNdLQ4tRLLpbZdfm5b5PNWkas'
)

const session = (await client.auth.getSession()).data.session

if (session == null) await send('login')


const messagesEl = document.querySelector('.messages')
function createMessageEl(msg) {
    return $el('div', {
        content: msg.content,
        class: 'message'
    })
}
function messageCreated(msg) {
    messagesEl.append(createMessageEl(msg))
}

client.channel('public:chat')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat' }, payload => {
        messageCreated({ content: payload.new.content })
    })
    .subscribe()



let lastMsg = (await client.from('chat').select('*').order('created_at', { ascending: false }).limit(1)).data?.[0]

if (lastMsg != null) {
    messagesEl.append(createMessageEl({
        content: lastMsg.content
    }))
}

function elementInvisible(el) {
    const rect1 = el.getBoundingClientRect()
    const rect2 = document.body.getBoundingClientRect()
    return rect1.bottom < rect2.top
}

;(async () => {
    while (true) {
        const messages = (await client.from('chat')
            .select('*')
            .lt('created_at', lastMsg.created_at)
            .order('created_at', { ascending: false })
            .limit(5)).data ?? []
    
        let anyInvisible = false
        for (const message of messages) {
            const el = createMessageEl({
                content: message.content
            })
            messagesEl.insertBefore(el, messagesEl.firstChild)
            if (!anyInvisible && elementInvisible(el)) {
                anyInvisible = true
            }
        }
        if (anyInvisible) {
            console.log('XYECOC')
            break
        }
        lastMsg = messages[messages.length - 1]
        if (messages.length < 5) break
    }
})()


{
    
    // for (const msg of allMsgs) {
    //     const div = document.createElement('div')
    //     div.innerText = msg.content
    //     messagesEl.append(div)
    // }

}

{
    const messageInput = document.querySelector('.message-input')
    messageInput.addEventListener('keydown', async e => {
        if (e.code != 'Enter') return
        await client.from('chat').insert({ user_id: session.user.id, content: messageInput.innerText })
        messageInput.innerText = ''
        document.querySelector('.message-input-placeholder').style = ''
        e.preventDefault()
    })
    
    messageInput.addEventListener('input', () => {
        if (messageInput.innerText == '')
            document.querySelector('.message-input-placeholder').style = ''
        else
            document.querySelector('.message-input-placeholder').style = 'display: none;'
    })
}



// await push(ref(db, 'messages'), 'daun6')
// ref(db, 'your/path')

// const credential = await createUserWithEmailAndPassword(auth, 'forprix@mail.ru', 'PidorasGayChlen')
// await sendEmailVerification(credential.user)