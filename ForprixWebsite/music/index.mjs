import { $download, $clamp } from '/util.mjs'

const trackListEl = document.querySelector('.tracks')
const tracksWrapper = document.querySelector('.tracks-wrapper')
const tracksStagehand = document.querySelector('.tracks-stagehand')
const playerVolumeEl = document.querySelector('.player-volume') 
const volumeSliderEl = document.querySelector('.player-volume-slider-wrapper')
const playerEl = document.querySelector('.bottom-player')
const body = document.querySelector('body')
const playButton = document.querySelector('.player-button-play')

;(async () => {
    const pageDirs = await (await fetch('track-pages/pages.json')).json()
    const pages = {}

    let currentPageIndex
    let tracksEnded = false


    let paused = true
    let currentTrackIndex
    let currentAudio = null
    let volume
    let eventPositionChanged = []
    let eventTrackChanged = []
    function volumeChanged() {
        if (currentAudio)
            currentAudio.volume = volume
    }
    let position = 0
    function positionClicked() {
        const pos = position
        if (currentAudio) {
            if (isNaN(currentAudio.duration)) {
                const ev = () => {
                    currentAudio.currentTime = pos * currentAudio.duration
                    currentAudio.removeEventListener('loadeddata', ev)
                }
                currentAudio.addEventListener('loadeddata', ev)
            }
            else
                currentAudio.currentTime = pos * currentAudio.duration
        }
    }

    const progressEl = document.querySelector('.player-bar-progress')

    let prevPos
    setInterval(() => {
        if (currentAudio) {
            position = currentAudio.currentTime / currentAudio.duration
            progressEl.style = `width: ${~~(position * 100 * 100) / 100}%`
        }
        if (!isNaN(position) && prevPos != position)
            for (const cb of eventPositionChanged)
                cb()
        prevPos = position
    }, 1000 / 60)

    function playPressed() {
        if (currentTrackIndex == null)
            return
        playButton.children[0].style.visibility = 'hidden'
        playButton.children[1].style.visibility = 'visible'
        trackListEl.children[currentTrackIndex].querySelector('.play-button').classList.add('playing')
        // download Audio and save in 'track' only when played
        const track = Object.values(Object.values(pages)[currentPageIndex])[currentTrackIndex]
        if (!track.audio_)
           track.audio_ = new Audio(`${track.dir}/${track.audio}`)
        track.audio_.play()
        track.audio_.volume = volume
        currentAudio?.removeEventListener('ended', nextPressed)
        currentAudio = track.audio_
        currentAudio.addEventListener('ended', nextPressed)
    }
    function pausePressed(stop) {
        if (currentAudio) {
            currentAudio.pause()
            if (stop)
                currentAudio.currentTime = 0
        }
        playButton.children[0].style.visibility = 'visible'
        playButton.children[1].style.visibility = 'hidden'
        for (const el of document.querySelectorAll('.play-button.playing'))
            el.classList.remove('playing')
    }
    function trackSelected() {
        for (const el of document.querySelectorAll('.track'))
            el.classList.remove('selected')
        trackListEl.children[currentTrackIndex].classList.add('selected')
        for (const cb of eventTrackChanged)
            cb()
        // currentTrackIndex
    }
    async function nextPressed() {
        if (!paused)
            pausePressed(true)
        if (currentAudio)
            currentAudio.currentTime = 0
        const currentPage = Object.keys(Object.values(pages)[currentPageIndex])
        currentTrackIndex++
        if (currentTrackIndex >= trackListEl.children.length) {
            if (currentTrackIndex < currentPage.length) {
                trackListEl.appendChild(createTrackEl(await requestTrack(currentTrackIndex), currentTrackIndex))
            }
            else currentTrackIndex = 0
        }
        if (!paused)
            playPressed()
        trackSelected()
    }
    function prevPressed() {
        if (!paused)
            pausePressed(true)
        if (currentAudio)
            currentAudio.currentTime = 0
        currentTrackIndex = (currentTrackIndex - 1) % trackListEl.children.length
        if (currentTrackIndex < 0)
            currentTrackIndex += trackListEl.children.length
        if (!paused)
            playPressed()
        trackSelected()
    }

    // Volume
    {
        let prevVolume
        let volumeSliderVisible = false
        let changing = false
        function updateVolumeSliderLocation() {
            volumeSliderEl.style = ''
            const volumeSliderRect = volumeSliderEl.getBoundingClientRect()
            const volumeRect = playerVolumeEl.getBoundingClientRect()
            volumeSliderEl.style.bottom = `${playerEl.getBoundingClientRect().height}px`
            volumeSliderEl.style.left = `${volumeRect.left - volumeSliderRect.width / 2 + volumeRect.width / 2}px`
        }
        let timeout
        const enter = () => {
            clearTimeout(timeout)
            volumeSliderVisible = true
            if (!volumeSliderEl.classList.contains('visible'))
                volumeSliderEl.classList.add('visible')
            updateVolumeSliderLocation()
        }
        const leave = () => {
            clearTimeout(timeout)
            if (!changing)
                timeout = setTimeout(() => {
                    volumeSliderVisible = false
                    while (volumeSliderEl.classList.contains('visible'))
                        volumeSliderEl.classList.remove('visible')
                }, 200)
        }
        playerVolumeEl.addEventListener('mouseenter', enter)
        volumeSliderEl.addEventListener('mouseenter', enter)
        playerVolumeEl.addEventListener('mouseleave', leave)
        volumeSliderEl.addEventListener('mouseleave', leave)
        playerVolumeEl.addEventListener('click', () => {
            if (volume != 0) {
                if (0 != volume) {
                    prevVolume = volume
                    volume = 0
                    volumeChanged()
                }
                func1() 
            }
            else {
                if (prevVolume != volume) {
                    volume = prevVolume
                    volumeChanged()
                }
                func1()
            }
        })

        new ResizeObserver(updateVolumeSliderLocation).observe(body)
    

        volume = localStorage.getItem('audio-volume')
        volume ??= 0.5

        addEventListener('beforeunload', () => {
            localStorage.setItem('audio-volume', volume)
        })
        volumeChanged()
        const sliderEl = document.querySelector('.player-volume-slider')
        const progressEl = document.querySelector('.player-volume-slider-progress')
        const circleEl = document.querySelector('.player-volume-slider-circle')
        function func1() {
            for (const el of document.querySelectorAll('.player-volume-icon'))
                el.style.visibility = 'hidden'
            if (volume > 0.5)
                playerVolumeEl.children[2].style.visibility = 'visible'
            else if (volume > 0)
                playerVolumeEl.children[1].style.visibility = 'visible'
            else
                playerVolumeEl.children[0].style.visibility = 'visible'
            const rect1 = volumeSliderEl.getBoundingClientRect()
            const rect2 = progressEl.getBoundingClientRect()
            const percents = ~~(volume * 100 * 100) / 100
            progressEl.style = `height: ${percents}%`
            //circleEl.style = `margin-bottom: ${rect1.bottom - rect2.top-16}px`
        }
        function func2(e) {
            if (!changing) return
            const rect = sliderEl.getBoundingClientRect()
            const newVolume = $clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1)
            if (newVolume != volume) {
                volume = newVolume
                volumeChanged()
            }
            func1() 
        }
        func1() 

        volumeSliderEl.addEventListener('mousedown', (e) => {
            changing = true
            func2(e) 
        })
        addEventListener('mouseup', (e) => {
            func2(e) 
            changing = false
            leave()
        })
        addEventListener('mousemove', (e) => {
            func2(e) 
        })
    }
    // Play button
    {
        playButton.addEventListener('click', () => {
            paused = !paused
            if (paused) {
                pausePressed()
            }
            else {
                playPressed()
            }
        })
    }
    // Next button
    {
        const nextButton = document.querySelector('.player-button-next')
        nextButton.addEventListener('click', () => nextPressed())
    }
    // Prev button
    {
        const prevButton = document.querySelector('.player-button-prev')
        prevButton.addEventListener('click', () => prevPressed())
    }
    // Player Bar
    {
        let changing = false
        const el = document.querySelector('.player-bar-wrapper')
        const sliderEl = document.querySelector('.player-bar')
        const progressEl = document.querySelector('.player-bar-progress')

        function func1() {
            progressEl.style = `width: ${~~(position * 100 * 100) / 100}%`
        }
        function func2(e) {
            if (!changing) return
            const rect = sliderEl.getBoundingClientRect()
            const newPosition = $clamp((e.clientX - rect.left) / rect.width, 0, 1)
            if (newPosition != position) {
                position = newPosition
                positionClicked()
            }
            func1()
        }

        el.addEventListener('mousedown', (e) => {
            changing = true
            func2(e) 
        })
        addEventListener('mouseup', (e) => {
            changing = false
        })
        addEventListener('mousemove', (e) => {
            func2(e) 
        })
    }

    

    async function requestTrack(index) {
        if (currentPageIndex == null) {
            currentPageIndex = 0
        }
        const pageDir = pageDirs[currentPageIndex]

        if (!pages[pageDir])
            pages[pageDir] = (async () =>{
                pages[pageDir] = Object.fromEntries((await (await fetch(`track-pages/${pageDir}/tracks.json`)).json()).map(x => [x, null]))
                
            })()
        if (pages[pageDir] instanceof Promise)
            await pages[pageDir]

        const pageTracks = pages[pageDir]
        const trackDir = Object.keys(pageTracks)[index]
        if (trackDir == null) {
            tracksEnded = true
            return
        }

        if (!pageTracks[trackDir])
            pageTracks[trackDir] = (async () => {
                pageTracks[trackDir] = await (await fetch(`track-pages/${pageDir}/${trackDir}/track.json`)).json()
                pageTracks[trackDir].dir = `track-pages/${pageDir}/${trackDir}`
            })()
        if (pageTracks[trackDir] instanceof Promise)
            await pageTracks[trackDir]
        
        const track = pageTracks[trackDir]
        
        return track
    }
    function createTrackEl(track, thisTrackIndex) {
        if (!track) return
        const trackEl = createTrackComponent()

        // currentTrackIndex
        
        let loadedCounter = 0
        const loaded = () => {
            loadedCounter++
            if (loadedCounter == 2) {
                trackEl.classList.remove('loading')
            }
        }
        const img1 = new Image(); img1.src = track.picture ? `${track.dir}/${track.picture}` : `id.png`
        const img2 = new Image(); img2.src = `${track.dir}/${track.wave}` //

        {
            const canvas = trackEl.querySelector('.track-wave-child')
            /** @type {CanvasRenderingContext2D} */
            const ctx = canvas.getContext('2d')
            function render(bypass) {
                if (!bypass && currentTrackIndex != thisTrackIndex) {
                    return
                }
                const rect = trackWave.getBoundingClientRect()
                canvas.width = rect.width
                canvas.height = rect.height
                ctx.fillStyle = 'white'
                ctx.fillRect(0, canvas.height / 2, canvas.width, 1)
                ctx.filter = 'contrast(0)'
                if (currentTrackIndex == thisTrackIndex && currentAudio && !isNaN(currentAudio.duration)) {
                    ctx.drawImage(img2, img2.width * position, 0, img2.width, img2.height, canvas.width * position, 0, canvas.width, canvas.height)
                    if (currentTrackIndex == thisTrackIndex) {
                        ctx.filter = `contrast(50%) brightness(300%) hue-rotate(${~~(performance.now() / 3)}deg)`
                        ctx.drawImage(img2, 0, 0, img2.width * position, img2.height, 0, 0, canvas.width * position, canvas.height)
                    }
                }
                else {
                    ctx.drawImage(img2, 0, 0, img2.width, img2.height, 0, 0, canvas.width, canvas.height)
                }
            }
            eventPositionChanged.push(render)
            eventTrackChanged.push(() => {
                render(true)
            })
            img2.addEventListener('load', () => { render(true) })
            const trackWave = trackEl.querySelector('.track-wave')
            new ResizeObserver(() => {
                render(true)
            }).observe(trackWave)
        }


        img1.addEventListener('load', loaded)
        img2.addEventListener('load', () => {



            // ...
            loaded()
        })

        trackEl.querySelector('.track-image').style = `--track-image: url("${img1.src}")`
        trackEl.querySelector('.track-title').innerText = track.name

        trackEl.querySelector('.play-button').addEventListener('click', () => {
            if (thisTrackIndex == currentTrackIndex) {
                if (paused) {
                    paused = false
                    playPressed()
                }
                else {
                    paused = true
                    pausePressed()
                }
            }
            else {
                if (!paused) {
                    paused = true
                }
                pausePressed(true)
                if (currentAudio)
                    currentAudio.currentTime = 0
                currentTrackIndex = thisTrackIndex
                paused = false
                playPressed()
                trackSelected()
            }
        })

        const tagsEl = trackEl.querySelector('.track-tags')
        for (const tag of track.tags) {
            const tagEl = document.createElement('div')
            tagEl.classList.add('track-tag')
            tagEl.innerText = `#${tag.toUpperCase()}`
            tagsEl.appendChild(tagEl)
        }

        trackEl.querySelector('.track-link-button').addEventListener('click', () => {
            open(`${track.dir}/${track.audio}`, 'Track')
        })
        trackEl.querySelector('.track-download-button').addEventListener('click', () => {
            $download(`${track.dir}/${track.audio}`, track.name)
        })

        {
            let changing = false
            const trackWave = trackEl.querySelector('.track-wave')
            function func1() {
                progressEl.style = `width: ${~~(position * 100 * 100) / 100}%`
            }
            function func2(e) {
                if (!changing) return
                const rect = trackWave.getBoundingClientRect()
                const newPosition = $clamp((e.clientX - rect.left) / rect.width, 0, 1)
                if (newPosition != position) {
                    position = newPosition
                    positionClicked()
                }
                func1()
            }
            
            trackWave.addEventListener('mousedown', (e) => {
                if (currentTrackIndex != thisTrackIndex) {
                    if (!paused) {
                        paused = true
                    }
                    pausePressed()
                    if (currentAudio)
                        currentAudio.currentTime = 0
                    currentTrackIndex = thisTrackIndex
                    paused = false
                    playPressed()
                    trackSelected()
                } else if (paused) {
                    paused = false
                    playPressed()
                }
                changing = true
                func2(e) 
            })
            addEventListener('mouseup', (e) => {
                changing = false
            })
            addEventListener('mousemove', (e) => {
                func2(e) 
            })
        }
        
        return trackEl
    }
    async function addTrackIfNeeded() {
        const tracksCount = trackListEl.children.length
        const needed = (Math.ceil((tracksWrapper.scrollTop + tracksWrapper.getBoundingClientRect().height - 27 + 1) / (137 + 22)) > tracksCount)
        if (!needed || tracksEnded) return
        let thisTrackIndex = trackListEl.children.length
        const track = await requestTrack(thisTrackIndex)
        trackListEl.appendChild(createTrackEl(track, thisTrackIndex))
        if (currentTrackIndex == null) {
            currentTrackIndex = thisTrackIndex
            trackSelected()
        }
        addTrackIfNeeded()
    }
    function createTrackComponent() {
        const el = document.createElement('div')
        el.innerHTML = `<div class="track loading">
            <div class="track-left">
                <div class="track-image"></div>
            </div>
            <div class="track-right">
                <div class="track-top">
                    <div class="track-title">Forprix - I Love You</div>
                    <div class="track-tags"></div>
                </div>
                <div class="track-wrapper">
                    <div class="track-middle">
                        <div class="play-button"></div>
                        <div class="track-wave">
                            <canvas class="track-wave-child"></canvas>
                        </div>
                    </div>
                    <div class="track-bottom">
                        <div class="track-bottom-button track-like-button"><div class="track-like-icon"></div>NICE</div>
                        <div class="track-bottom-button track-dislike-button"><div class="track-dislike-icon"></div>BULLSHIT</div>
                        <div class="track-bottom-button track-link-button"><div class="track-link-icon"></div>LINK</div>
                        <div class="track-bottom-button track-download-button"><div class="track-download-icon"></div>DOWNLOAD</div>
                    </div>
                </div>
            </div>
        </div>`
        return el.firstChild
    }

    // 1 добавляются пустые ячейки на свободное пространство
    // 2 каждой ячейке вызывается loadTrack
    // 3 внутри loadTrack: если текущая страница не выбрана, выбирается 0
    // 4 при смене страницы: удалить нахуй все ячейки и выполнить шаги начиная с 1


    new ResizeObserver(addTrackIfNeeded).observe(tracksWrapper)
    tracksWrapper.addEventListener('scroll', addTrackIfNeeded)

    // Search
    // {
    //     onmessage = function(e) {
    //         if (e.data?.type == 'search') {
    //             const query = e.data.data.toLowerCase().trim()
    //             for (const el of trackListEl.children) {
    //                 const toTest = (el.querySelector('.track-title').innerText + el.querySelector('.track-tags').innerText).toLowerCase()
    //                 if (toTest.indexOf(query) == -1)
    //                     el.classList.add('unsearch')
    //                 else
    //                     el.classList.remove('unsearch')
    //             }
    //         }
    //     }
    // }


})()
