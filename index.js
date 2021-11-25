const params = { fullscreen: false }
const elem = document.getElementById('game')
const two = new Two(params).appendTo(elem)
two.renderer.setSize(800, 600)
const socket = new WebSocket('ws://localhost:1428')

let playerId
let action
let entities = []

setup()

function setup() {
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
            document.addEventListener('keypress', sendKeyPress)
        } else if (jsonData.event == 'gameUpdate') {
            gameUpdate([...jsonData.obstacles, jsonData.player])
        } else {
            console.log('Unexpceted event: ' + jsonData.event)
        }
    })
}

function loop() {
    two.update()
    window.requestAnimationFrame(loop)
}

function gameUpdate(updateEntities) {
    // remove entities that no longer exist from the server
    entitiesToRemove = entities.filter(entity1 => !updateEntities.some(entity2 => entity2.id === entity1.id));
    entitiesToRemove.forEach(entity => entity.twoJsObject.remove())
    entities = entities.filter(entity1 => updateEntities.some(entity2 => entity2.id === entity1.id))

    updateEntities.forEach(entity => {
        let foundEntities = entities.filter(x => x.id == entity.id)
        if (foundEntities.length == 0) {
            let twoJsObject = createTwoJsObject(entity)
            entities.push({id: entity.id, twoJsObject: twoJsObject})
        } else if (foundEntities.length == 1) {
            foundEntities[0].twoJsObject.translation.x = entity.x
            foundEntities[0].twoJsObject.translation.y = entity.y
        }
    })
}

function createTwoJsObject(entity) {
    let twoJsObject =  two.makeRectangle(entity.x, entity.y, entity.width, entity.height)
    let colour
    if (entity.type == 'player') {
        colour = 'rgb(0, 200, 255)'
    } else {
        colour = 'rgb(200, 0, 255)'
    }
    twoJsObject.fill = colour
    twoJsObject.opacity = 0.75
    twoJsObject.noStroke()

    return twoJsObject
}

function sendKeyPress(){
    console.log('key pressed');
    socket.send({
        event: action,
        id: playerId
    });
}