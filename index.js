const runAnimation = ['./assets/run/adventurer-run-00.png', './assets/run/adventurer-run-01.png', './assets/run/adventurer-run-02.png', './assets/run/adventurer-run-03.png', './assets/run/adventurer-run-04.png', './assets/run/adventurer-run-05.png']
const jumpAnimation = ['./assets/jump/adventurer-jump-00.png', './assets/jump/adventurer-jump-01.png', './assets/jump/adventurer-jump-02.png', './assets/jump/adventurer-jump-03.png']
const duckAnimation = ['./assets/duck/adventurer-slide-00.png', './assets/duck/adventurer-slide-01.png']
const attackAnimation = ['./assets/attack/adventurer-attack1-00.png', './assets/attack/adventurer-attack1-01.png', './assets/attack/adventurer-attack1-02.png', './assets/attack/adventurer-attack1-03.png', './assets/attack/adventurer-attack1-04.png']
const deathAnimation = ['./assets/death/adventurer-die-00.png', './assets/death/adventurer-die-01.png', './assets/death/adventurer-die-02.png', './assets/death/adventurer-die-03.png', './assets/death/adventurer-die-04.png', './assets/death/adventurer-die-05.png', './assets/death/adventurer-die-06.png']
const backgroundAsset = ['./assets/background.png']

const params = { fullscreen: false, type: Two.Types.webgl, width: 1200, height: 400 }
const elem = document.getElementById('game')
const two = new Two(params).appendTo(elem)
const socket = new WebSocket('ws://localhost:1428')

let background1 = two.makeImageSequence(backgroundAsset, 0, 200, 1, false)
let background2 = two.makeImageSequence(backgroundAsset, 0, 200, 1, false)

// Used because sprite doesn't quite line up
const playerXOffset = 0
const playerYOffset = -4
const jumpObstacleYOffset = -8
const duckObstacleYOffset = 0
const attackObstacleYOffset = -5

let playerId
let action
let entities = []
let scoreTag = document.getElementById('score')
let playerObject = two.makeImageSequence(runAnimation, 100, 450, 8, true)
playerObject.scale = 3
let lastAction = 'running'

setup()

function setup() {
    window.requestAnimationFrame(loop)

    socket.addEventListener('open', function (event) {
        console.log('Connected to server')
    })

    socket.addEventListener('close', function (event) {
        playerObject.pause()
    })
    
    socket.addEventListener('message', function (event) {
        let jsonData = JSON.parse(event.data)
        
        if (jsonData.event == 'startup') {
            playerId = jsonData.id
            action = jsonData.action
            displayAction(action)
            document.addEventListener('keypress', sendKeyPress)
        } else if (jsonData.event == 'gameUpdate') {
            animationUpdate(jsonData.actions, jsonData.player)
            backgroundUpdate(jsonData.backgroundPosition1, jsonData.backgroundPosition2)
            gameUpdate(jsonData.obstacles)
            displayScore(jsonData.score)
        } else if(jsonData.event == 'death') {
            let playerX = playerObject.translation.x, playerY = playerObject.translation.y
            playerObject.remove()
            playerObject = two.makeImageSequence(deathAnimation, playerX, playerY, 2, false)
            playerObject.scale = 3
            playerObject.play(0, 7, () => {
                playerObject.pause()
            })
            displayEndGame();
        } else {
            console.log('Unexpceted event: ' + jsonData.event)
        }
    })
}

function loop() {
    two.update()
    window.requestAnimationFrame(loop)
}

function animationUpdate(actions, player) {
    if (actions.jumping && lastAction != 'jumping') {
        lastAction = 'jumping'
        playerObject.remove()
        playerObject = two.makeImageSequence(jumpAnimation, player.x + playerXOffset, player.y + playerYOffset, 5, true)
        playerObject.scale = 3
    } else if (actions.ducking && lastAction != 'ducking') {
        lastAction = 'ducking'
        playerObject.remove()
        playerObject = two.makeImageSequence(duckAnimation, player.x + playerXOffset, player.y + playerYOffset, 2, true)
        playerObject.scale = 3
    } else if (actions.attacking && lastAction != 'attacking') {
        lastAction = 'attacking'
        playerObject.remove()
        playerObject = two.makeImageSequence(attackAnimation, player.x + playerXOffset, player.y + playerYOffset, 5, true)
        playerObject.scale = 3
    } else if (lastAction != 'running' && !actions.jumping && !actions.ducking && !actions.attacking) {
        lastAction = 'running'
        playerObject.remove()
        playerObject = two.makeImageSequence(runAnimation, player.x + playerXOffset, player.y + playerYOffset, 8, true);
        playerObject.scale = 3
    } else {
        playerObject.translation.x = player.x + playerXOffset
        playerObject.translation.y = player.y + playerYOffset
    }
}

function backgroundUpdate(position1, position2) {
    background1.translation.x = position1
    background2.translation.x = position2
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
            if (entity.type == 'jumpObstacle') {
                foundEntities[0].twoJsObject.translation.x = entity.x
                foundEntities[0].twoJsObject.translation.y = entity.y + jumpObstacleYOffset
            } else if (entity.type == 'duckObstacle') {
                foundEntities[0].twoJsObject.translation.x = entity.x
                foundEntities[0].twoJsObject.translation.y = entity.y + duckObstacleYOffset
            } else if (entity.type == 'attackObstacle') {
                foundEntities[0].twoJsObject.translation.x = entity.x
                foundEntities[0].twoJsObject.translation.y = entity.y + attackObstacleYOffset
            } else {
                foundEntities[0].twoJsObject.translation.x = entity.x
                foundEntities[0].twoJsObject.translation.y = entity.y
            }
        }
    })
}

function displayScore(score) {
    scoreTag.innerHTML = score
}

function displayEndGame(){
    two.makeText('You Died', two.renderer.width / 2, 200, {
        size: 120,
        family: 'Dracula',
        fill: '#8a0303',
    });
    two.makeText('You Died', two.renderer.width / 2, 200, {
        size: 130,
        family: 'Dracula',
        fill: '#000000',
    });
    two.makeText(`Final Score: ${scoreTag.innerHTML}`, two.renderer.width / 2, 300, {
        size: 50,
        family: 'Dracula',
        fill: '#8a0303'
    });
    two.makeText(`Final Score: ${scoreTag.innerHTML}`, two.renderer.width / 2, 300, {
        size: 60,
        family: 'Dracula',
        fill: '#000000'
    });
}

function displayAction(action) {
    let actionTag = document.getElementById('action')
    actionTag.innerHTML = action
}

function createTwoJsObject(entity) {
    let twoJsObject

    if (entity.type == 'jumpObstacle') {
        twoJsObject = two.makeSprite('./assets/objects.png', entity.x, entity.y + jumpObstacleYOffset, 7, 12, 0, false);
        twoJsObject.scale = 2
    } else if (entity.type == 'duckObstacle') {
        twoJsObject = two.makeSprite('./assets/bat.png', entity.x, entity.y + duckObstacleYOffset, 8, 1, 6, true);
        twoJsObject.scale = 2
    } else if (entity.type == 'attackObstacle') {
        twoJsObject = two.makeSprite('./assets/wolf_attack.png', entity.x, entity.y + attackObstacleYOffset, 16, 1, 10, true);
        twoJsObject.scale = 2
    } else {
        twoJsObject = two.makeRectangle(entity.x, entity.y, entity.width, entity.height)
        twoJsObject.fill = 'rgb(200, 0, 255)'
        twoJsObject.opacity = 0.75
        twoJsObject.noStroke()
    }

    return twoJsObject
}

function sendKeyPress() {
    socket.send(JSON.stringify({
        event: action,
        id: playerId
    }));
}