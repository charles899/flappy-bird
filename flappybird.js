//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight,
    rotation: 0 // New property for bird rotation
};

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//power-up
let powerUpArray = [];
let powerUpWidth = 30; // Set width for the power-up
let powerUpHeight = 30; // Set height for the power-up
let powerUpX = boardWidth; // Start off-screen
let powerUpY;
let powerUpImg; // Image for the power-up
let powerUpCollected = false; // Track if the power-up is collected

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0; // Get high score from localStorage

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    // Load images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    // Load power-up image
    powerUpImg = new Image();
    powerUpImg.src = "star.png"; // Replace with your star image path

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //every 1.5 seconds
    document.addEventListener("keydown", moveBird);
    // Add touch event listener
    board.addEventListener("touchstart", moveBird);
}

function placePipes() {
    if (gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    }
    pipeArray.push(bottomPipe);

    // Spawn power-up in the middle of the gap between the pipes
    if (Math.random() < 0.2) { // 20% chance to spawn a power-up
        let powerUpY = randomPipeY + pipeHeight + (openingSpace / 2) - (powerUpHeight / 2); // Center in the gap
        let powerUp = {
            img: powerUpImg,
            x: powerUpX,
            y: powerUpY,
            width: powerUpWidth,
            height: powerUpHeight
        };
        powerUpArray.push(powerUp);
    }
}

function update() {
    requestAnimationFrame(update);
    if (gameOver) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //bird physics
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas

    // Rotate bird based on its velocity
    bird.rotation = Math.min(Math.max(bird.rotation + velocityY, -30), 30); // Limit rotation between -30 and 30 degrees

    // Draw the bird with rotation
    context.save(); // Save the current drawing state
    context.translate(bird.x + bird.width / 2, bird.y + bird.height / 2); // Move origin to the center of the bird
    context.rotate(bird.rotation * Math.PI / 180); // Convert degrees to radians
    context.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height); // Draw the bird centered
    context.restore(); // Restore the previous drawing state

    if (bird.y > board.height) {
        gameOver = true;
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Update power-ups
    for (let i = 0; i < powerUpArray.length; i++) {
        let powerUp = powerUpArray[i];
        powerUp.x += velocityX;
        context.drawImage(powerUp.img, powerUp.x, powerUp.y, powerUp.width, powerUp.height);

        // Check for collision with the bird
        if (detectCollision(bird, powerUp)) {
            powerUpCollected = true; // Mark power-up as collected
            powerUpArray.splice(i, 1); // Remove the power-up from the array
            score += 2; // Increment score by 2 when power-up is collected
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //clear off-screen power-ups
    while (powerUpArray.length > 0 && powerUpArray[0].x < -powerUpWidth) {
        powerUpArray.shift(); // removes first element from the array
    }

    //score
    context.fillStyle = "white";
    context.font = "20px sans-serif"; // Font size adjusted
    context.fillText("Score: " + score, 10, 40);
    
    // Display high score
    context.fillText("High Score: " + highScore, 10, 80);

    if (gameOver) {
        // Check if current score is greater than high score
        if (score > highScore) {
            highScore = score; // Update high score
            localStorage.setItem('highScore', highScore); // Save new high score to localStorage
        }
        context.fillText("GAME OVER", boardWidth / 2 - 60, boardHeight / 2); // Center position for Game Over
    }
}

function moveBird(e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX" || e.type === "touchstart") {
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            bird.rotation = 0; // Reset bird rotation when restarting the game
            pipeArray = [];
            powerUpArray = []; // Reset power-ups
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}