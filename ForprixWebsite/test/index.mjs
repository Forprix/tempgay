import { send, setHandler } from '../util/communication.mjs'

const client = supabase.createClient(
    'https://fmpyiquamzzzzwwrqzvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcHlpcXVhbXp6enp3d3JxenZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDcyNTEzNTYsImV4cCI6MjAyMjgyNzM1Nn0.5WVOpRXqtgeZ3HXRtTVNdLQ4tRLLpbZdfm5b5PNWkas'
)


const session = (await client.auth.getSession()).data.session

if (session == null) {
    await send('signInWithOAuth', {
        provider: 'discord'
    })
}

// Email, Discord, Github, Gitlab, Google, Twitch, Facebook, Figma

// Зайти через дискорд
// await client.auth.signInWithOAuth({
//     provider: 'discord',
//     options: {
//         redirectTo: `http://localhost/test`
//     }
// })

// console.log('SIGNIIN UPP!!!')
// Зарегаться по почте
// const res = await client.auth.signUp({
//     email: 'forprX@gmail.com',
//     password: 'drgsse4cgioj89s35y'
// })
// console.log('YOOO', res)

// forprX@gmail.com  drgsse4cgioj89s35y
// forprix@mail.ru   eblaqweqwen

// setSession


// const responce = await send('signInWithOAuth', {
//     provider: 'discord'
// }, () => {
//     console.log('STANDALONE')
// })
// console.log(responce)



// top.postMessage()

// const session = (await client.auth.getSession()).data.session

// Зайти по почте
// await client.auth.setSession(oldSession)

// const authRes = await client.auth.signInWithPassword({
//     email: 'forprX@gmail.com',
//     password: 'drgsse4cgioj89s35y'
// })
// const sessionRes = await client.auth.getSession()
// const session = sessionRes.data.session
// console.log(JSON.stringify(session))

// Если после signUp выполнить signInWithPassword не подтверждая email, будет ошибка: "Email not confirmed"

// Добавить сообщение
// await client.from('chat').insert({ user_id: authRes.data.user.id, content: 'Привет!!!' })

// Получить кол-во сообщений
console.log(await client.from('chat').select('*', { count: 'exact' }))

// Получить последнее сообщение
// const lastMsgRes = await client.from('chat')
//     .select('*')
//     .order('created_at', { ascending: false })
//     .limit(1)
// const lastMsg = lastMsgRes.data[0]

// Получить N сообщений идущих перед сообщением X
// const messagesBeforeRes = await client.from('chat')
//     .select('*')
//     .lt('created_at', lastMsg.created_at)
//     .order('created_at', { ascending: false })
//     .limit(2)
// const messagesBefore = messagesBeforeRes.data

// Прослушивать добавления сообщений
// client.channel('public:chat')
//     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat' }, payload => {
//         console.log('New row inserted:', payload.new)
//     })
//     .subscribe()



// console.log(await client.from('chat').select('id'))