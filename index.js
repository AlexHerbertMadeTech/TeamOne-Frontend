const params = { fullscreen: false }
const elem = document.getElementById('game')
const two = new Two(params).appendTo(elem)
two.renderer.setSize(800, 600)
const socket = new WebSocket('ws://localhost:1428')

socket.addEventListener('open', function (event) {
    socket.send('Hello Server!')
})

socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data)
})

let rect
drawSquare() // First time draw
window.requestAnimationFrame(loop)

function drawSquare() {
    rect = two.makeRectangle(100, 100, 100, 100)
    rect.fill = 'rgb(0, 200, 255)'
    rect.opacity = 0.75
    rect.noStroke()
}

function loop() {
    rect.translation.x++;
    rect.translation.y++;
    two.update()
    window.requestAnimationFrame(loop)
}