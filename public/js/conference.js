const KEY_ENTER = 13;
const ONE_MONTH = 30 * 24 * 60 * 60;

navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

const socket = io('/');
const videoGrid = $('#video-grid');
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '3000'
});
let localMediaStream;
let userMedia;
const defaultConfig = {
    audio: false,
    video: false,
};
const peers = {};

const startListening = () => {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    defaultConfig.audio = true;
                } else if (device.kind === 'videoinput') {
                    defaultConfig.video = true;
                }
            });
            navigator.getUserMedia(defaultConfig,
                stream => {
                    if (defaultConfig.audio) $('.conference__mute_button').removeClass('disabled');
                    if (defaultConfig.video) $('.conference__video_button').removeClass('disabled');
                    localMediaStream = stream;
                    userMedia = renderMediaPlayer();
                    userMedia[0].children[0].muted = true;
                    addVideoStream(userMedia, localMediaStream);
                    myPeer.on('call', call => {
                        call.answer(stream);
                        const localMedia = renderMediaPlayer();
                        call.on('stream', userVideoStream => {
                            addVideoStream(localMedia, userVideoStream);
                        });
                    });

                    socket.on('user-connected', userId => {
                        connectToNewUser(userId, stream);
                    });
                    // input value
                    let text = $('.chat_message');
                    // when press enter send message
                    $('html').keydown(function (e) {
                        if (e.which == KEY_ENTER && text.val().length !== 0) {
                            socket.emit('message', {
                                userName: Cookie.get('userName'),
                                message: text.val()
                            });
                            text.val('');
                        }
                    });
                },
                () => {
                    console.error('Access denied for audio/video');
                    alert('Необходимо предоставить доступ к камере или микрофону');
                });
        })
        .catch(error => {
            console.error(`Error: ${erorr.message}`);
        });
}

if (!Cookie.get('userName')) {
    $('.overlay').addClass('show');
    $('.modal').addClass('show');
} else {
    startListening();
}

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

socket.on('createMessage', ({ userName, message }) => {
    $('ul').append(`<li class="messages__container"><span>${userName}</span><p>${message}</p></li>`);
    scrollToBottom();
});

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const localMedia = renderMediaPlayer();
    call.on('stream', userVideoStream => {
        addVideoStream(localMedia, userVideoStream);
    })
    call.on('close', () => {
        localMedia.remove();
    })

    peers[userId] = call;
}

const addVideoStream = (localMedia, stream) => {
    const media = localMedia[0].children[0];
    media.srcObject = stream;
    media.addEventListener('loadedmetadata', () => {
        media.play();
    });
    videoGrid.append(localMedia);
}


const scrollToBottom = () => {
    var d = $('.conference__chat_window');
    d.scrollTop(d.prop('scrollHeight'));
}

const toggleChat = () => {
    $('.conference__left').toggleClass('fill-space');
    $('.conference__right').toggleClass('hide');
}

const muteUnmute = () => {
    if (!defaultConfig.audio) return;
    const enabled = localMediaStream.getAudioTracks()[0].enabled;
    if (enabled) {
        localMediaStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        localMediaStream.getAudioTracks()[0].enabled = true;
    }
}

const playStop = () => {
    if (!defaultConfig.video) return;
    const enabled = localMediaStream.getVideoTracks()[0].enabled;
    if (enabled) {
        localMediaStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
        userMedia.find('video').addClass('hide');
    } else {
        setStopVideo();
        userMedia.find('video').removeClass('hide');
        localMediaStream.getVideoTracks()[0].enabled = true;

    }
}

const saveUserName = () => {
    const userName = $('.modal__body_input').val().trim();
    if (userName.length > 0) {
        Cookie.set('userName', userName, ONE_MONTH);
        $('.overlay').removeClass('show');
        $('.modal').removeClass('show');
        startListening();
    } else {
        $('.modal__body_input').addClass('invalid');
    }
}

const renderMediaPlayer = () => {
    return $(`<div class="media__container"></div>`)
        .append(`<${defaultConfig.video ? 'video' : 'audio'}/>`)
        .append(`<p class="media__container_title">${Cookie.get('userName')}</p>`);
}

const setMuteButton = () => {
    $('.conference__mute_button').html('<i class="fas fa-microphone"></i>');
}

const setUnmuteButton = () => {
    $('.conference__mute_button').html('<i class="unmute fas fa-microphone-slash"></i>');
}

const setStopVideo = () => {
    $('.conference__video_button').html('<i class="fas fa-video"></i>');
}

const setPlayVideo = () => {
    $('.conference__video_button').html('<i class="stop fas fa-video-slash"></i>');
}

$('.conference__chat_button').on('click', toggleChat);
$('.conference__mute_button').on('click', muteUnmute);
$('.conference__video_button').on('click', playStop);
$('.modal__footer_button').on('click', saveUserName);
