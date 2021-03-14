const BASE_URL = 'https://videoconvers.herokuapp.com/';
const ONE_MONTH = 30 * 24 * 60 * 60;

const userNameInput = $('.username-input');
const roomIdInput = $('.room-id-input');

const toggleModal = () => {
    $('.modal').toggleClass('hide');
    $('.overlay').toggleClass('hide');
    const userName = Cookie.get('userName') ? Cookie.get('userName') : '';
    userNameInput.val(userName);
}

const joinRoom = () => {
    const roomId = roomIdInput.val().trim();
    const userName = userNameInput.val().trim();
    if (roomId.length === 0) {
        roomIdInput.addClass('invalid');
    } else {
        roomIdInput.removeClass('invalid');
    }
    if (userName.length === 0) {
        userNameInput.addClass('invalid');
    } else {
        userNameInput.removeClass('invalid');
        Cookie.set('userName', userName, ONE_MONTH);
    }
    if (roomId.length > 0 && userName.length > 0) {
        window.location.href = BASE_URL + roomId;
    }
}

$('.join-button').on('click', joinRoom);
$('.join-room').on('click', toggleModal);
$('.close-button').on('click', toggleModal);