let piece = 2;
let peicesPlaced = 0;
let pieces = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//2  3  4  5  6  7  8
//O  T  L  J  S  Z  I
var c = document.getElementById("gameCanvas");
var bg = document.getElementById("bgCanvas");
var h = document.getElementById("heldCanvas");
var nextCanvasElement = document.getElementById("nextCanvas");
var ctx = c.getContext("2d");
var bgCanvas = bg.getContext("2d");
var heldCanvas = h.getContext("2d");
var nextCanvas = nextCanvasElement.getContext("2d");

var downPressed = false;
var leftPressed = false;
var rightPressed = false;

var leftCooldown = 0;
var rightCooldown = 0;
var downCooldown = 0;

var millis;

var dasSlider = document.getElementById("das");
var arrSlider = document.getElementById("arr");
var sdfSlider = document.getElementById("sdf");

var arr = 30  //rate of shifting to the side
var das = 150 // how long before it starts shifting
var kdc = 300; // how long before it changes direction
var sdf = 0;   // how long between falls for soft dropping, 0 for soft drop

var dasValue = document.getElementById("dasValue");
var arrValue = document.getElementById("arrValue");
var sdfValue = document.getElementById("sdfValue");

dasSlider.oninput = function() {
    dasValue.innerHTML = this.value;
    das = parseInt(this.value);
}
arrSlider.oninput = function() {
    arrValue.innerHTML = this.value;
    arr = parseInt(this.value);
}
sdfSlider.oninput = function() {
    sdfValue.innerHTML = this.value;
    sdf = parseInt(this.value);
}

var gravitySlider = document.getElementById("gravity");
var gravity = 0;
var gravityValue = document.getElementById("gravityValue");

gravitySlider.oninput = function() {
    if (!playWithLevels) {
        gravityValue.innerHTML = this.value;
        gravity = parseInt(this.value);
        console.log("yes");
    }
}

var playWithLevelsCheckbox = document.getElementById("playWithLevelsCheckBox");
var playWithLevels = true;
playWithLevelsCheckbox.oninput = function() {
    playWithLevels = this.value;
    restartGame();
}
playWithLevelsCheckbox.addEventListener('change', () => {
    if(playWithLevelsCheckbox.checked) {
        playWithLevels = true;
    } else {
        playWithLevels = false;
    }
    restartGame();
  });
var restartGameButton = document.getElementById("restartGame");

restartGameButton.onclick = function() {
    restartGame();
}

var timeToFall = 0;

var pieceRot = 0; //0, 1, 2, 3
var pieceCenterX;
var pieceCenterY;

const d = new Date();

var lockDelay = 500;
var timeToSolidify = 0;
var lockDelayOver = false;

let game = [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0]
];

for (var x = 0; x < 10; x++) {
    for (var y = 0; y < 40; y++) {
        game[x][y] = 0;
    }
}

let score = 0;
let threeCorners = false;
let tstKick = false;
let isLastMoveTurn;

let btb = 0;
let combo = 0;
let level = 1;
let linesCleared = 0;

var heldPiece = 0;
var canHold = true;

const howLongAnnounce = 2000;
let announceTime = 0;
let announcement = "";

solidifyPiece();

rend();
rendHeld();

var announcementContainer = document.getElementById("announcementContainer");
announce("Modern Tetris!");
/*
    ||MAIN LOOP||
*/

let justin = document.getElementById("justin");
let justinRotation = 0;
window.main = function () { 
    justinRotation += 5;
    justin.style.filter = "hue-rotate(" + (2 * justinRotation) + "deg)";
    justin.style.transform = 'rotate(' + justinRotation + 'deg)'
    if (playWithLevels) {
        level = Math.ceil(linesCleared / 10);
        gravity = Math.pow((0.8-((level-1)*0.007)), level-1)*1000;
    } else {
        level = 0;
    }
    window.requestAnimationFrame( main );
    millis = new Date().getTime();
    if (leftPressed) {
        if (leftCooldown < millis) {
            left();
            leftCooldown = millis + arr;
        }
    }
    if (rightPressed) {
        if (rightCooldown < millis) {
            right();
            rightCooldown = millis + arr;
        }
    }
    if (downPressed && downCooldown < millis) {
        down();
        downCooldown = millis + sdf;
    }
    if (gravity > 0 && timeToFall < millis) {
        timeToFall = millis + gravity;
        gravityFall();
    }
    if (announceTime + howLongAnnounce > millis) {
        announcementContainer.style.opacity = -(((millis - announceTime) / howLongAnnounce)-1).toString();
    } else {
        announcementContainer.style.opacity = "0";
    }
};

main();

/*
    ||UI FUNCTIONS||
*/

function announce(toAnnounce) {
    announceTime = new Date().getTime();
    announcement = toAnnounce;
    document.getElementById("announcement").innerHTML = announcement;
}

/*
    ||GAMEPLAY FUNCTIONS||
*/

function restartGame() {
    score = 0;
    threeCorners = false;
    tstKick = false;
    piece = 2;
    peicesPlaced = 0;
    pieces = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    heldPiece = 0;
    canHold = true;
    linesCleared = 0;
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            game[x][y] = 0;
        }
    }
    solidifyPiece();
}

/*
    ||AUTO MOVEMENT FUNCTIONS||
*/

function gravityFall() {
    let piecesX = [0, 0, 0, 0]
    let piecesY = [0, 0, 0, 0]
    let counter = 0;
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 24; y++) {
            if (game[x][y] == 1) {
                piecesX[counter] = x;
                piecesY[counter] = y;
                counter++;
            }
        }
    }
    let canMove = true;
    let madeFirstMove = false;
    for (var i = 0; i < 4; i++) {
        if (piecesY[i] <= 0 || game[piecesX[i]][piecesY[i] - 1] > 1) {
            canMove = false;
        }
    }
    if (canMove) {
        for (var i = 0; i < 4; i++) {
            game[piecesX[i]][piecesY[i]] = 0;
        }
        for (var i = 0; i < 4; i++) {
            game[piecesX[i]][piecesY[i] - 1] = 1;
        }
        madeFirstMove = true;
        rend();
        pieceCenterY = pieceCenterY - 1;
        lockDelayOver = false;
    } else if (!madeFirstMove) {
        if (!lockDelayOver) {
            millis = new Date().getTime();
            timeToFall = millis + lockDelay;
            lockDelayOver = true;
        } else {
            solidifyPiece();
        }
    }
}

/*
    ||MOVEMENT FUNCTIONS||
*/

window.addEventListener("keydown", function (event) { //Bindings
    if (event.defaultPrevented) {
      return;
    }
  
    switch (event.key) {
        case "ArrowDown":
            if (sdf > 0) {
                downPressed = true;
            } else {
                down();
            }
            break;
        case "ArrowUp":
            turn();
            break;
        case "ArrowLeft":
            left();
            leftPressed = true;
            leftCooldown = millis + das;
            break;
        case "ArrowRight":
            right();
            rightPressed = true;
            rightCooldown = millis + das;
            break;
        case " ":
            hardDrop();
            break;
        case "z":
            invTurn();
            break;
        case "c":
            hold();
            break;
        case "Shift":
            hold();
            break;
      default:
        return;
    }

    event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) { //Bindings
    if (event.defaultPrevented) {
      return;
    }
  
    switch (event.key) {
        case "ArrowDown":
            downPressed = false;
            break;
        case "ArrowUp":
            // code for "up arrow" key press.
            break;
        case "ArrowLeft":
            leftPressed = false;
            rightCooldown = millis + kdc;
            break;
        case "ArrowRight":
            rightPressed = false;
            rightCooldown = millis + kdc;
            break;
      default:
        return;
    }

    event.preventDefault();
}, true);

function left() {
    let piecesX = [0, 0, 0, 0]
    let piecesY = [0, 0, 0, 0]
    let counter = 0;
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            if (game[x][y] == 1) {
                piecesX[counter] = x;
                piecesY[counter] = y;
                counter++;
            }
        }
    }
    let canMove = true;
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] <= 0 || game[piecesX[i] - 1][piecesY[i]] > 1) {
            canMove = false;
        }
    }
    if (canMove) {
        for (var i = 0; i < 4; i++) {
            game[piecesX[i]][piecesY[i]] = 0;
        }
        for (var i = 0; i < 4; i++) {
            game[piecesX[i] - 1][piecesY[i]] = 1;
        }
        rend();
        isLastMoveTurn = false;
        pieceCenterX = pieceCenterX - 1;
    }
}

function right() {
    let piecesX = [0, 0, 0, 0]
    let piecesY = [0, 0, 0, 0]
    let counter = 0;
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            if (game[x][y] == 1) {
                piecesX[counter] = x;
                piecesY[counter] = y;
                counter++;
            }
        }
    }
    let canMove = true;
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] >= 9 || game[piecesX[i] + 1][piecesY[i]] > 1) {
            canMove = false;
        }
    }
    if (canMove) {
        for (var i = 0; i < 4; i++) {
            game[piecesX[i]][piecesY[i]] = 0;
        }
        for (var i = 0; i < 4; i++) {
            game[piecesX[i] + 1][piecesY[i]] = 1;
        }
        rend();
        isLastMoveTurn = false;
        pieceCenterX = pieceCenterX + 1;
    }
}

function down() {
    if (sdf == 0) { 
        let madeFirstMove = false;
        let canMove = true;
        while (canMove) {
            let piecesX = [0, 0, 0, 0];
            let piecesY = [0, 0, 0, 0];
            let counter = 0;
            for (var x = 0; x < 10; x++) {
                for (var y = 0; y < 40; y++) {
                    if (game[x][y] == 1) {
                        piecesX[counter] = x;
                        piecesY[counter] = y;
                        counter++;
                    }
                }
            }
            
            for (var i = 0; i < 4; i++) {
                if (piecesY[i] <= 0 || game[piecesX[i]][piecesY[i] - 1] > 1) {
                    canMove = false;
                }
            }
            if (canMove) {
                for (var i = 0; i < 4; i++) {
                    game[piecesX[i]][piecesY[i]] = 0;
                }
                for (var i = 0; i < 4; i++) {
                    game[piecesX[i]][piecesY[i] - 1] = 1;
                }
                score++;
                rend();
                isLastMoveTurn = false;
                madeFirstMove = true;
                pieceCenterY = pieceCenterY - 1;
                if (!lockDelayOver) {
                    millis = new Date().getTime();
                    timeToFall = millis + lockDelay;
                    lockDelayOver = true;
                }
            } else if (!madeFirstMove) {
                solidifyPiece();
            }
        }
    } else {
        let piecesX = [0, 0, 0, 0];
        let piecesY = [0, 0, 0, 0];
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    piecesX[counter] = x;
                    piecesY[counter] = y;
                    counter++;
                }
            }
        }
        let canMove = true;
        let madeFirstMove = false;
        for (var i = 0; i < 4; i++) {
            if (piecesY[i] <= 0 || game[piecesX[i]][piecesY[i] - 1] > 1) {
                canMove = false;
            }
        }
        if (canMove) {
            for (var i = 0; i < 4; i++) {
                game[piecesX[i]][piecesY[i]] = 0;
            }
            for (var i = 0; i < 4; i++) {
                game[piecesX[i]][piecesY[i] - 1] = 1;
            }
            madeFirstMove = true;
            score++;
            rend();
            isLastMoveTurn = false;
            pieceCenterY = pieceCenterY - 1;
            lockDelayOver = false;
        } else if (!madeFirstMove) {
            if (!lockDelayOver) {
                millis = new Date().getTime();
                timeToFall = millis + lockDelay;
                lockDelayOver = true;
            } else {solidifyPiece();}
        }
    }
}

function hardDrop() {
    let canMove = true;
    while (canMove) {
        let piecesX = [0, 0, 0, 0]
        let piecesY = [0, 0, 0, 0]
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    piecesX[counter] = x;
                    piecesY[counter] = y;
                    counter++;
                }
            }
        }
        
        for (var i = 0; i < 4; i++) {
            if (piecesY[i] <= 0 || game[piecesX[i]][piecesY[i] - 1] > 1) {
                canMove = false;
            }
        }
        if (canMove) {
            for (var i = 0; i < 4; i++) {
                game[piecesX[i]][piecesY[i]] = 0;
            }
            for (var i = 0; i < 4; i++) {
                game[piecesX[i]][piecesY[i] - 1] = 1;
            }
            score += 2;
            rend();
            isLastMoveTurn = false;
            pieceCenterY = pieceCenterY - 1;
        } else {
            solidifyPiece();
        }
    }
}

function turn() {
    if (piece > 2 && piece != 8) {
        var prePiecesX = [];
        var prePiecesY = [];
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    prePiecesX[counter] = x;
                    prePiecesY[counter] = y;
                    counter++;
                }
            }
        }
        var piecesX = [];
        var piecesY = [];
        for (var i = 0; i < 4; i++) {
            piecesX[i] = (prePiecesY[i]-pieceCenterY) + pieceCenterX;
            piecesY[i] = -(prePiecesX[i]-pieceCenterX) + pieceCenterY;
        }
        if(testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 0)) {}
        else if (pieceRot == 0) {
            if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 1)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, -2)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -2)) {tstKick = true}
        } else if (pieceRot == 1) {
            if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -1)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 2)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 2)) {tstKick = true}
        } else if (pieceRot == 2) {
            if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 1)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, -2)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -2)) {tstKick = true}
        } else if (pieceRot == 3) {
            if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -1)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 2)) {}
            else if (testTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 2)) {tstKick = true}
        }
        
        rend();
    } else if (piece == 8) { //I piece has a different kick table
        var prePiecesX = [];
        var prePiecesY = [];
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    prePiecesX[counter] = x;
                    prePiecesY[counter] = y;
                    counter++;
                }
            }
        }
        var piecesX = [];
        var piecesY = [];
        for (var i = 0; i < 4; i++) {
            piecesX[i] = (prePiecesY[i]-pieceCenterY) + pieceCenterX;
            piecesY[i] = -(prePiecesX[i]-pieceCenterX) + pieceCenterY;
        }
        for (var i = 0; i < 4; i++) {
            if (pieceRot == 0) {
                piecesX[i]++;
            }
            if (pieceRot == 1) {
                piecesY[i] = piecesY[i] - 1;
            }
            if (pieceRot == 2) {
                piecesX[i] = piecesX[i] - 1;
            }
            if (pieceRot == 3) {
                piecesY[i]++;
            }
        }
        if(iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 0)) {}
        else if (pieceRot == 0) {
            if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, -1)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 2)) {}
        } else if (pieceRot == 1) {
            if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 2)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, -1)) {}
        } else if (pieceRot == 2) {
            if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 1)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -2)) {}
        } else if (pieceRot == 3) {
            if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 0)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -2)) {}
            else if (iTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 1)) {}
        }
        rend();
    }
}

function invTurn() {
    if (piece > 2 && piece != 8) {
        var prePiecesX = [];
        var prePiecesY = [];
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    prePiecesX[counter] = x;
                    prePiecesY[counter] = y;
                    counter++;
                }
            }
        }
        var piecesX = [];
        var piecesY = [];
        for (var i = 0; i < 4; i++) {
            piecesX[i] = -(prePiecesY[i]-pieceCenterY) + pieceCenterX;
            piecesY[i] = (prePiecesX[i]-pieceCenterX) + pieceCenterY;
        }
        if(inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 0)) {}
        else if (pieceRot == 2) {
            if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 1)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, -2)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -2)) {tstKick = true}
        } else if (pieceRot == 1) {
            if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -1)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 2)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 2)) {tstKick = true}
        } else if (pieceRot == 0) {
            if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 1)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, -2)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -2)) {tstKick = true}
        } else if (pieceRot == 3) {
            if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -1)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 2)) {}
            else if (inverseTestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 2)) {tstKick = true}
        }
        rend();
    } else if (piece == 8) { //I piece has a different kick table
        var prePiecesX = [];
        var prePiecesY = [];
        let counter = 0;
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 40; y++) {
                if (game[x][y] == 1) {
                    prePiecesX[counter] = x;
                    prePiecesY[counter] = y;
                    counter++;
                }
            }
        }
        var piecesX = [];
        var piecesY = [];
        for (var i = 0; i < 4; i++) {
            piecesX[i] = -(prePiecesY[i]-pieceCenterY) + pieceCenterX;
            piecesY[i] = (prePiecesX[i]-pieceCenterX) + pieceCenterY;
        }
        for (var i = 0; i < 4; i++) {
            if (pieceRot == 0) {
                piecesX[i]++;
            }
            if (pieceRot == 1) {
                piecesY[i] = piecesY[i] - 1;
            }
            if (pieceRot == 2) {
                piecesX[i] = piecesX[i] - 1;
            }
            if (pieceRot == 3) {
                piecesY[i]++;
            }
        }
        if(inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 0, 0)) {}
        else if (pieceRot == 3) {
            if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, -1)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 2)) {}
        } else if (pieceRot == 0) {
            if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 2)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, -1)) {}
        } else if (pieceRot == 1) {
            if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 2, 1)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -1, -2)) {}
        } else if (pieceRot == 2) {
            if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 0)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], 1, -2)) {}
            else if (inverseITestTurn(piecesX[0], piecesY[0], piecesX[1], piecesY[1], piecesX[2], piecesY[2], piecesX[3], piecesY[3], -2, 1)) {}
        }
        rend();
    }
}

/*
    ||TURNING FUNCTIONS||
*/

function testTurn(piecesXa, piecesYa, piecesXb, piecesYb, piecesXc, piecesYc, piecesXd, piecesYd, offsetX, offsetY ) {
    var piecesX = [piecesXa, piecesXb, piecesXc, piecesXd]; //silly stuff because cant put array in params
    var piecesY = [piecesYa, piecesYb, piecesYc, piecesYd];
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] + offsetX > 9 || piecesX[i] + offsetX < 0) {
            return false;
        } 
        if (piecesY[i] + offsetY < 0) {
            return false;
        }
        if (game[piecesX[i] + offsetX][piecesY[i] + offsetY] > 1) {
            return false;
        }
    }

    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40 ; y++) {
            if (game[x][y] == 1) {
                game[x][y] = 0;
            }
        }
    }
    for (var i = 0; i < 4; i++) {
        game[piecesX[i] + offsetX][piecesY[i] + offsetY] = 1;
    }

    pieceRot++;
    if (pieceRot == 4) {
        pieceRot = 0;
    }

    pieceCenterX = pieceCenterX + offsetX;
    pieceCenterY = pieceCenterY + offsetY;

    tstKick = false; //will be disproved when return true if true
    isLastMoveTurn = true;
    return true;
}

function iTestTurn(piecesXa, piecesYa, piecesXb, piecesYb, piecesXc, piecesYc, piecesXd, piecesYd, offsetX, offsetY ) {
    var piecesX = [piecesXa, piecesXb, piecesXc, piecesXd]; //silly stuff because cant put array in params
    var piecesY = [piecesYa, piecesYb, piecesYc, piecesYd];
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] + offsetX > 9 || piecesX[i] + offsetX < 0) {
            return false;
        } 
        if (piecesY[i] + offsetY < 0) {
            return false;
        }
        if (game[piecesX[i] + offsetX][piecesY[i] + offsetY] > 1) {
            return false;
        }
    }

    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            if (game[x][y] == 1) {
                game[x][y] = 0;
            }
        }
    }
    for (var i = 0; i < 4; i++) {
        game[piecesX[i] + offsetX][piecesY[i] + offsetY] = 1;
    }

    pieceCenterX = pieceCenterX + offsetX;
    pieceCenterY = pieceCenterY + offsetY;

    if (pieceRot == 0) {
        pieceCenterX++;
    }
    if (pieceRot == 1) {
        pieceCenterY = pieceCenterY - 1;
    }
    if (pieceRot == 2) {
        pieceCenterX = pieceCenterX - 1;
    }
    if (pieceRot == 3) {
        pieceCenterY++;
    }

    pieceRot++;
    if (pieceRot == 4) {
        pieceRot = 0;
    }
    isLastMoveTurn = true;
    return true;
}

function inverseTestTurn(piecesXa, piecesYa, piecesXb, piecesYb, piecesXc, piecesYc, piecesXd, piecesYd, offsetX, offsetY ) {
    var piecesX = [piecesXa, piecesXb, piecesXc, piecesXd]; //silly stuff because cant put array in params
    var piecesY = [piecesYa, piecesYb, piecesYc, piecesYd];
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] + offsetX > 9 || piecesX[i] + offsetX < 0) {
            return false;
        } 
        if (piecesY[i] + offsetY < 0) {
            return false;
        }
        if (game[piecesX[i] + offsetX][piecesY[i] + offsetY] > 1) {
            return false;
        }
    }

    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            if (game[x][y] == 1) {
                game[x][y] = 0;
            }
        }
    }
    for (var i = 0; i < 4; i++) {
        game[piecesX[i] + offsetX][piecesY[i] + offsetY] = 1;
    }

    pieceRot = pieceRot - 1;
    if (pieceRot == -1) {
        pieceRot = 3;
    }

    pieceCenterX = pieceCenterX + offsetX;
    pieceCenterY = pieceCenterY + offsetY;

    tstKick = false; //will be disproved when return true if true
    isLastMoveTurn = true;
    return true;
}

function inverseITestTurn(piecesXa, piecesYa, piecesXb, piecesYb, piecesXc, piecesYc, piecesXd, piecesYd, offsetX, offsetY ) {
    var piecesX = [piecesXa, piecesXb, piecesXc, piecesXd]; //silly stuff because cant put array in params
    var piecesY = [piecesYa, piecesYb, piecesYc, piecesYd];
    for (var i = 0; i < 4; i++) {
        if (piecesX[i] + offsetX > 9 || piecesX[i] + offsetX < 0) {
            return false;
        } 
        if (piecesY[i] + offsetY < 0) {
            return false;
        }
        if (game[piecesX[i] + offsetX][piecesY[i] + offsetY] > 1) {
            return false;
        }
    }

    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 40; y++) {
            if (game[x][y] == 1) {
                game[x][y] = 0;
            }
        }
    }
    for (var i = 0; i < 4; i++) {
        game[piecesX[i] + offsetX][piecesY[i] + offsetY] = 1;
    }

    pieceCenterX = pieceCenterX + offsetX;
    pieceCenterY = pieceCenterY + offsetY;

    if (pieceRot == 0) {
        pieceCenterX++;
    }
    if (pieceRot == 1) {
        pieceCenterY = pieceCenterY - 1;
    }
    if (pieceRot == 2) {
        pieceCenterX = pieceCenterX - 1;
    }
    if (pieceRot == 3) {
        pieceCenterY++;
    }

    pieceRot = pieceRot - 1;
    if (pieceRot == -1) {
        pieceRot = 3;
    }
    isLastMoveTurn = true;
    return true;
}


/*
    ||PIECE CONTROL FUNCTIONS||
*/

function generateBag() {
    if (pieces[0] == 0) {
        let bag = [2, 3, 4, 5, 6, 7, 8];
    
        for (var i = 0; i < 30; i++) {
            let swapPosA = Math.floor(Math.random()*7);
            let swapPosB = Math.floor(Math.random()*7);
            let swapPieceA = bag[swapPosA];
            bag[swapPosA] = bag[swapPosB];
            bag[swapPosB] = swapPieceA;
        }
        for (var i = 0; i < 7; i++) {
            pieces[i] = bag[i];
            
        }
    } 
    
    if (pieces[7] == null || pieces[7] == 0) {
        let bag = [2, 3, 4, 5, 6, 7, 8];
        
        for (var i = 0; i < 30; i++) {
            let swapPosA = Math.floor(Math.random()*7);
            let swapPosB = Math.floor(Math.random()*7);
            let swapPieceA = bag[swapPosA];
            bag[swapPosA] = bag[swapPosB];
            bag[swapPosB] = swapPieceA;
        }
        for (var i = 0; i < 7; i++) {
            pieces[i + 7] = bag[i];
        }
    }
}

function solidifyPiece() {  
    for (var i = 0; i < 14; i++) {
        pieces[i] = pieces[i + 1];
    } 
    generateBag(); 
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 24; y++) {
            if (game[x][y] == 1) {
                game[x][y] = piece;
            }
        }
    }
    lineClear();
    pieces[13] = 0;
    piece = pieces[0];
    //2  3  4  5  6  7  8
    //O  T  L  J  S  Z  I
    if (piece == 2) { //0
        if (game[4][20] == 0 && game[5][20] == 0 && game[4][21] == 0 && game[5][21] == 0) {
            game[4][20] = 1;
            game[5][20] = 1;
            game[4][21] = 1;
            game[5][21] = 1;
            pieceCenterX = 5;
            pieceCenterY = 21;
        } else {
            restartGame();
        }
    } else if (piece == 3) { //T
        if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[4][21] == 0) {
            game[3][20] = 1;
            game[4][20] = 1;
            game[5][20] = 1;
            game[4][21] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    } else if (piece == 4) { //L
        if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[5][21] == 0) {
            game[3][20] = 1;
            game[4][20] = 1;
            game[5][20] = 1;
            game[5][21] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    } else if (piece == 5) { //J
        if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[3][21] == 0) {
            game[3][20] = 1;
            game[4][20] = 1;
            game[5][20] = 1;
            game[3][21] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    } else if (piece == 6) { //S
        if (game[3][20] == 0 && game[4][20] == 0 && game[5][21] == 0 && game[4][21] == 0) {
            game[3][20] = 1;
            game[4][20] = 1;
            game[5][21] = 1;
            game[4][21] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    } else if (piece == 7) { //Z
        if (game[3][21] == 0 && game[4][21] == 0 && game[5][20] == 0 && game[4][20] == 0) {
            game[3][21] = 1;
            game[4][21] = 1;
            game[5][20] = 1;
            game[4][20] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    } else if (piece == 8) {//I
        if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[6][20] == 0) {
            game[3][20] = 1;
            game[4][20] = 1;
            game[5][20] = 1;
            game[6][20] = 1;
            pieceCenterX = 4;
            pieceCenterY = 20;
        } else {
            restartGame();
        }
    }
    pieceRot = 0;
    canHold = true;
    rend();
    rendNext();
    rendHeld();
}


function lineClear() {
    let tSpin = false;
    let tSpinMini = false;
    if (piece == 3 && isLastMoveTurn) {
        let backCorners = 0;
        if (pieceCenterX == 0) {
            backCorners += 2; 
        } else if (pieceCenterX == 9) {
            backCorners += 2;
        } else if (pieceCenterY == 0) {
            backCorners += 2;
        } else if (pieceRot == 0) {
            if (game[pieceCenterX + 1][pieceCenterY - 1] > 1) {
                backCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY - 1] > 1) {
                backCorners++;
            }
        } else if (pieceRot == 1) {
            if (game[pieceCenterX - 1][pieceCenterY + 1] > 1) {
                backCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY - 1] > 1) {
                backCorners++;
            }
        } else if (pieceRot == 2) {
            if (game[pieceCenterX + 1][pieceCenterY + 1] > 1) {
                backCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY + 1] > 1) {
                backCorners++;
            }
        } else if (pieceRot == 3) {
            if (game[pieceCenterX + 1][pieceCenterY + 1] > 1) {
                backCorners++;
            }
            if (game[pieceCenterX + 1][pieceCenterY - 1] > 1) {
                backCorners++;
            }
        }
        let frontCorners = 0;
        if (pieceRot == 0) {
            if (game[pieceCenterX + 1][pieceCenterY + 1] > 1) {
                frontCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY + 1] > 1) {
                frontCorners++;
            }
        } else if (pieceRot == 1) {
            if (game[pieceCenterX + 1][pieceCenterY + 1] > 1) {
                frontCorners++;
            }
            if (game[pieceCenterX + 1][pieceCenterY - 1] > 1) {
                frontCorners++;
            }
        } else if (pieceRot == 2) {
            if (game[pieceCenterX + 1][pieceCenterY - 1] > 1) {
                frontCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY - 1] > 1) {
                frontCorners++;
            }
        } else if (pieceRot == 3) {
            if (game[pieceCenterX - 1][pieceCenterY + 1] > 1) {
                frontCorners++;
            }
            if (game[pieceCenterX - 1][pieceCenterY - 1] > 1) {
                frontCorners++;
            }
        }
        if (backCorners == 1 && frontCorners == 2) {
            tSpin = true;
        } else if (backCorners == 2 && frontCorners == 1) {
            if (tstKick) {
                tSpin = true;
            } else {
                tSpinMini = true;
            }
        } else if (backCorners == 2 && frontCorners == 2) {
            tSpin = true;
        }
    }
    let thisLinesCleared = 0;
    for (var y = 24; y >= 0; y = y-1) {
        let isLineClear = true;
        for (var x = 0; x < 10 && isLineClear; x++) {
            if (game[x][y] == 0) {
                isLineClear = false;
            }
        }
        if (isLineClear) {
            for (var i = y; i < 23; i++) {
                for (var x = 0; x < 10 && isLineClear; x++) {
                    game[x][i] = game[x][i+1];
                } 
            }
            thisLinesCleared++;
        }
    }
    // T-Spin Scoring
    
    let pointsToAdd = 0;
    if (tSpin) {
        if (thisLinesCleared == 0) {
            pointsToAdd += 400;
        } else if (thisLinesCleared == 1) {
            pointsToAdd += 800;
            btb++;
            announce("TSpin Single!");
        } else if (thisLinesCleared == 2) {
            pointsToAdd += 1200;
            btb++;
            announce("TSpin Double!");
        } else if (thisLinesCleared == 3) {
            pointsToAdd += 1600;
            btb++;
            announce("TSpin Tripple!")
        }
    } else if (tSpinMini) {
        if (thisLinesCleared == 0) {
            pointsToAdd += 100;
        } else if (thisLinesCleared == 1) {
            pointsToAdd += 200;
            btb++;
            announce("TSpin Mini Single!");
        } else if (thisLinesCleared == 2) {
            pointsToAdd += 400;
            btb++;
            announce("TSpin Mini Double!");
        }
    } else {
        if (thisLinesCleared == 1) {
            pointsToAdd += 100;
            btb = 0;
        } else if (thisLinesCleared == 2) {
            pointsToAdd += 300;
            btb = 0;
        } else if (thisLinesCleared == 3) {
            pointsToAdd += 500;
            btb = 0;
        } else if (thisLinesCleared == 4) {
            pointsToAdd += 800;
            btb++;
            announce("Tetris!");
        } else if (thisLinesCleared == 0) {
            combo = 0;
        }
    }
    pointsToAdd = (((btb > 1 ? 1.5 : 1)*pointsToAdd) + (combo*50))*level;
    score += pointsToAdd;
    linesCleared = linesCleared + thisLinesCleared;
}

function hold() {
    if (canHold) {
        generateBag(); 
        for (var x = 0; x < 10; x++) {
            for (var y = 0; y < 24; y++) {
                if (game[x][y] == 1) {
                    game[x][y] = 0;
                }
            }
        }
        if (heldPiece == 0) {
            for (var i = 0; i < 14; i++) {
                pieces[i] = pieces[i + 1];
            }
        
            heldPiece = piece;
            
            pieces[13] = 0;
            piece = pieces[0];
        } else {
            piece = heldPiece;
            heldPiece = pieces[0];
        }
        if (piece == 2) { //0
            if (game[4][20] == 0 && game[5][20] == 0 && game[4][21] == 0 && game[5][21] == 0) {
                game[4][20] = 1;
                game[5][20] = 1;
                game[4][21] = 1;
                game[5][21] = 1;
                pieceCenterX = 5;
                pieceCenterY = 21;
            } else {
                restartGame();
            }
        } else if (piece == 3) { //T
            if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[4][21] == 0) {
                game[3][20] = 1;
                game[4][20] = 1;
                game[5][20] = 1;
                game[4][21] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        } else if (piece == 4) { //L
            if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[5][21] == 0) {
                game[3][20] = 1;
                game[4][20] = 1;
                game[5][20] = 1;
                game[5][21] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        } else if (piece == 5) { //J
            if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[3][21] == 0) {
                game[3][20] = 1;
                game[4][20] = 1;
                game[5][20] = 1;
                game[3][21] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        } else if (piece == 6) { //S
            if (game[3][20] == 0 && game[4][20] == 0 && game[5][21] == 0 && game[4][21] == 0) {
                game[3][20] = 1;
                game[4][20] = 1;
                game[5][21] = 1;
                game[4][21] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        } else if (piece == 7) { //Z
            if (game[3][21] == 0 && game[4][21] == 0 && game[5][20] == 0 && game[4][20] == 0) {
                game[3][21] = 1;
                game[4][21] = 1;
                game[5][20] = 1;
                game[4][20] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        } else if (piece == 8) {//I
            if (game[3][20] == 0 && game[4][20] == 0 && game[5][20] == 0 && game[6][20] == 0) {
                game[3][20] = 1;
                game[4][20] = 1;
                game[5][20] = 1;
                game[6][20] = 1;
                pieceCenterX = 4;
                pieceCenterY = 20;
            } else {
                restartGame();
            }
        }
        pieceRot = 0;
        canHold = false;
        rendHeld();
        rendNext();
        rend();
    }
}

/*
    ||RENDER FUNCTIONS||
*/

function rendNext() {
    nextCanvas.clearRect(0, 0, 100, 500);
    nextCanvas.fill();
    nextCanvas.fillStyle = "#1D1D1D";
    nextCanvas.fillRect(0, 0, 100, 500);
    //2  3  4  5  6  7  8
    //O  T  L  J  S  Z  I
    for (var i = 1; i < 6; i++) {
        if (pieces[i] == 2) { //O
            nextCanvas.fillStyle = "#E18F19";
            nextCanvas.fillRect(30, 30 + (60 * (i - 1)), 40, 40);
        } else if (pieces[i] == 3) { //T
            nextCanvas.fillStyle = "#CF19E1";
            nextCanvas.fillRect(20, 50 + (60 * (i - 1)), 60, 20);
            nextCanvas.fillRect(40, 30 + (60 * (i - 1)), 20, 20);
        } else if (pieces[i] == 4) { //L
            nextCanvas.fillStyle = "#E1C619";
            nextCanvas.fillRect(20, 50 + (60 * (i - 1)), 60, 20);
            nextCanvas.fillRect(60, 30 + (60 * (i - 1)), 20, 20);
        } else if (pieces[i] == 5) { //J
            nextCanvas.fillStyle = "#1928E1";
            nextCanvas.fillRect(20, 50 + (60 * (i - 1)), 60, 20);
            nextCanvas.fillRect(20, 30 + (60 * (i - 1)), 20, 20);
        } else if (pieces[i] == 6) { //S
            nextCanvas.fillStyle = "#53E119";
            nextCanvas.fillRect(20, 50 + (60 * (i - 1)), 40, 20);
            nextCanvas.fillRect(40, 30 + (60 * (i - 1)), 40, 20);
        } else if (pieces[i] == 7) { //Z
            nextCanvas.fillStyle = "#E11919";
            nextCanvas.fillRect(40, 50 + (60 * (i - 1)), 40, 20);
            nextCanvas.fillRect(20, 30 + (60 * (i - 1)), 40, 20);
        } else if (pieces[i] == 8) { //I
            nextCanvas.fillStyle = "#19E1CC";
            nextCanvas.fillRect(10, 40 + (60 * (i - 1)), 80, 20);
        }
    }
}

function rendHeld() {
    heldCanvas.clearRect(0, 0, 125, 125);
    heldCanvas.fill();
    heldCanvas.fillStyle = "#1D1D1D";
    heldCanvas.fillRect(0, 0, 125, 125);
    //2  3  4  5  6  7  8
    //O  T  L  J  S  Z  I
    if (canHold) {
        if (heldPiece == 2) { //O
            heldCanvas.fillStyle = "#E18F19";
            heldCanvas.fillRect(30, 30, 40, 40);
        } else if (heldPiece == 3) { //T
            heldCanvas.fillStyle = "#CF19E1";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(40, 30, 20, 20);
        } else if (heldPiece == 4) { //L
            heldCanvas.fillStyle = "#E1C619";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(60, 30, 20, 20);
        } else if (heldPiece == 5) { //J
            heldCanvas.fillStyle = "#1928E1";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(20, 30, 20, 20);
        } else if (heldPiece == 6) { //S
            heldCanvas.fillStyle = "#53E119";
            heldCanvas.fillRect(20, 50, 40, 20);
            heldCanvas.fillRect(40, 30, 40, 20);
        } else if (heldPiece == 7) { //Z
            heldCanvas.fillStyle = "#E11919";
            heldCanvas.fillRect(40, 50, 40, 20);
            heldCanvas.fillRect(20, 30, 40, 20);
        } else if (heldPiece == 8) { //I
            heldCanvas.fillStyle = "#19E1CC";
            heldCanvas.fillRect(10, 40, 80, 20);
        } 
    } else {
        if (heldPiece == 2) { //O
            heldCanvas.fillStyle = "#E18F1980";
            heldCanvas.fillRect(30, 30, 40, 40);
        } else if (heldPiece == 3) { //T
            heldCanvas.fillStyle = "#CF19E180";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(40, 30, 20, 20);
        } else if (heldPiece == 4) { //L
            heldCanvas.fillStyle = "#E1C61980";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(60, 30, 20, 20);
        } else if (heldPiece == 5) { //J
            heldCanvas.fillStyle = "#1928E180";
            heldCanvas.fillRect(20, 50, 60, 20);
            heldCanvas.fillRect(20, 30, 20, 20);
        } else if (heldPiece == 6) { //S
            heldCanvas.fillStyle = "#53E11980";
            heldCanvas.fillRect(20, 50, 40, 20);
            heldCanvas.fillRect(40, 30, 40, 20);
        } else if (heldPiece == 7) { //Z
            heldCanvas.fillStyle = "#E1191980";
            heldCanvas.fillRect(40, 50, 40, 20);
            heldCanvas.fillRect(20, 30, 40, 20);
        } else if (heldPiece == 8) { //I
            heldCanvas.fillStyle = "#19E1CC80";
            heldCanvas.fillRect(10, 40, 80, 20);
        } 
    }
}

function rend() {
    ctx.clearRect(0, 0, 250, 600);
    bgCanvas.clearRect(0, 0, 250, 600);
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 24; y++) {
            bgCanvas.fill();
            if(game[x][y] == 0) {
                if (x % 2 == 0) {
                    bgCanvas.fillStyle = "#1D1D1D";
                } else {
                    bgCanvas.fillStyle = "#202020";
                }
            }
            bgCanvas.fillRect(x*20,460-y*20, 20, 20);
        }
    }
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 24; y++) {
            ctx.fill();
            if (game[x][y] == 1) { //Active can be different pieces
                if (piece == 2) { //O
                    ctx.fillStyle = "#E18F19";
                } else if (piece == 3) { //T
                    ctx.fillStyle = "#CF19E1";
                } else if (piece == 4) { //L
                    ctx.fillStyle = "#E1C619";
                } else if (piece == 5) { //J
                    ctx.fillStyle = "#1928E1";
                } else if (piece == 6) { //S
                    ctx.fillStyle = "#53E119";
                } else if (piece == 7) { //Z
                    ctx.fillStyle = "#E11919";
                } else if (piece == 8) { //I
                    ctx.fillStyle = "#19E1CC";
                }
            } else if (game[x][y] == 2) { //O
                ctx.fillStyle = "#E18F19";
            } else if (game[x][y] == 3) { //T
                ctx.fillStyle = "#CF19E1";
            } else if (game[x][y] == 4) { //L
                ctx.fillStyle = "#E1C619";
            } else if (game[x][y] == 5) { //J
                ctx.fillStyle = "#1928E1";
            } else if (game[x][y] == 6) { //S
                ctx.fillStyle = "#53E119";
            } else if (game[x][y] == 7) { //Z
                ctx.fillStyle = "#E11919";
            } else if (game[x][y] == 8) { //I
                ctx.fillStyle = "#19E1CC";
            }
            if (game[x][y] > 0) {
                ctx.fillRect(x*20,460-y*20, 20, 20);
            }
        }
    }
    var canMove = false;
    var counter = 0
    var piecesX = [0,0,0,0];
    var piecesY = [0,0,0,0];
    for (var x = 0; x < 10; x++) {
        for (var y = 0; y < 24; y++) {
            if (game[x][y] == 1) {
                piecesY[counter] = y;
                piecesX[counter] = x;
                
                counter++;
                canMove = true;
            }
        }
    }
   
    for (var j = 0; j < 24 && canMove && piecesY[0] != 0; j++) {
        for (var i = 0; i < 4; i++) {
            if (piecesY[i] <= 0 || game[piecesX[i]][piecesY[i] - 1] > 1) {
                canMove = false;
            }
        }
        if (canMove) {
            for (var i = 0; i < 4; i++) {
                piecesY[i] = piecesY[i] - 1;
            }
        }
    }
    for (var i = 0; i < 4; i++) {
        ctx.fill();
        //Active can be different pieces
        if (piece == 2) { //O
            ctx.fillStyle = "#E18F1995";
        } else if (piece == 3) { //T
            ctx.fillStyle = "#CF19E195";
        } else if (piece == 4) { //L
            ctx.fillStyle = "#E1C61995";
        } else if (piece == 5) { //J
            ctx.fillStyle = "#1928E195";
        } else if (piece == 6) { //S
            ctx.fillStyle = "#53E11995";
        } else if (piece == 7) { //Z
            ctx.fillStyle = "#E1191995";
        } else if (piece == 8) { //I
            ctx.fillStyle = "#19E1CC95";
        }
        ctx.fillRect(piecesX[i]*20,460-piecesY[i]*20, 20, 20);
    }
    if (localStorage.getItem("highScore") < score) {
        localStorage.setItem("highScore", score);
    }
    document.getElementById("highscore").innerHTML = localStorage.getItem("highScore");
    document.getElementById("score").innerHTML = score;
    document.getElementById("linesCleared").innerHTML = linesCleared;
    document.getElementById("level").innerHTML = level;
}