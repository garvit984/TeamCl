const socket = io('/')
const videoGrid = document.getElementById('video-grid')
var screshare = false;
var myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.setAttribute("width", "100%");
myVideo.setAttribute("height", "100%");
//myVideo.height="100%";
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream)
    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            console.log(userVideoStream)
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        setTimeout(() => {
            connectToNewUser(userId, stream)
        }, 1000)
    })
    let text = $("input");
    $('html').keydown(function (e) {
        if (e.which == 13 && text.val().length !== 0) {
            socket.emit('message', text.val());
            text.val('')
        }
    });
    socket.on("createMessage", message => {
        $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
        scrollToBottom()
    })
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) 
        peers[userId].close()
    
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    console.log(userId)
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    console.log(video)
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
    let totalUsers = document.getElementsByTagName("video").length;
    /*if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width = 100 / totalUsers + "%";
        }
    }*/
}
const shareScreen = () => {
  if(!screshare)
  {
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
        }
    }).then((stream) => {
        toggleShareIcons(true);

        // disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
        // It will be enabled was user stopped sharing screen
        // toggleVideoBtnDisabled(true);

        // save my screen stream
        screen = stream;
        //const video = document.createElement('video')

        // share the new stream with all partners
        addVideoStream(myVideo, stream);
        screshare=true;
        
        // When the stop sharing button shown by the browser is clicked
        screen.getVideoTracks()[0].addEventListener('ended', () => {
            stopSharingScreen();
        });
    }).catch((e) => {
        console.error(e);
    });
}
else
{
  stopSharingScreen();
}
}
function stopSharingScreen() {
    // enable video toggle btn
    // toggleVideoBtnDisabled(false);

    return new Promise((res, rej) => {
        screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

        res();
    }).then(() => {
        toggleShareIcons(false);
        //const video = document.createElement('video')
        screshare=false;
        // share the new stream with all partners
        addVideoStream(myVideo, myVideoStream);

    }).catch((e) => {
        console.error(e);
    });
}
function toggleShareIcons(share) {
    if (share) {
        const html = `
    <i class="unmute fas fa-desktop"></i>
    <span>Stop Share Screen</span>
  `
        document.querySelector('.main__share_button').innerHTML = html;

    } else {
        const html = `
    <i class="fas fa-desktop"></i>
    <span>Share Screen</span>
  `
        document.querySelector('.main__share_button').innerHTML = html;

    }
}
function toggleVideoBtnDisabled(disabled) {
    document.getElementById('.main__video_button').disabled = disabled;
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {
    console.log('object')
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}
