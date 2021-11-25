const params = { fullscreen: false }
const elem = document.getElementById('game')
const two = new Two(params).appendTo(elem)
two.renderer.setSize(800, 600)
const socket = new WebSocket('ws://localhost:1428')

let rect
let playerId
let action
let entities = []

setup()

function setup() {
    drawSquare() // First time draw
    window.requestAnimationFrame(loop)

    socket.addEventListener('open', function (event) {
        console.log('Connected to server')
    })
    
    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data)
        let jsonData = JSON.parse(event.data)
        
        if (jsonData.event == 'startup') {
            playerId = jsonData.id
            action = jsonData.action
        } else if (jsonData.event == 'gameUpdate') {
            gameUpdate(jsonData.entities)
        } else {
            console.log('Unexpceted event: ' + jsonData.event)
        }
    })
}

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

function gameUpdate(updateEntities) {
    // remove entities that no longer exist from the server
    entities = entities.filter(entity1 => updateEntities.some(entity2 => entity2.id === entity1.id))

    updateEntities.forEach(entity => {
        let foundEntities = entities.filter(x => x.id == entity.id)
        if (foundEntities.length == 0) {
            // TODO: create new two.js object
            entities.push(entity)
        } else if (foundEntities.length == 1) {
            // TODO: update existing two.js object
        }
    })
}