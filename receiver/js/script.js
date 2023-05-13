/**
Vandalizers
by Alexander MacKinnon & Anthony Bourgeois
*/

/**
 * THIS IS THE JS FILE FOR THE RECEIVER END OF THE GAME.
 */

// -------------- MQTT setup --------------

let thisScreen = "receiver";
let receivingScreen = "player";
let dataToSend;

// MQTT client details. We are using a public server called shiftr.io. Don't change this.
let broker = {
  hostname: "public.cloud.shiftr.io",
  port: 443,
};
let client;

let gameInProgress = false;

let creds = {
  clientID: Math.random().toString(16).slice(3),
  userName: "public",
  password: "public",
};
let topic = "vandalizersServer1"; // This is the topic we are all subscribed to

// End of MQTT client details

// -------------- General Variables --------------
// Canvas Size
let canvasW = 1200;
let canvasH = 800;

// Colors
let colors = {
  white: {
    main: "#fff",
  },
  black: {
    main: "#23242C",
    accent: "#363844",
  },
  red: {
    main: "#F45B69",
    accent: "#F2404F",
  },
  yellow: {
    main: "#FBCB89",
    accent: "#F9BA62",
  },
  blue: {
    main: "#4994FD",
    accent: "#217CFD",
  },
  green: {
    main: "#7CB685",
    accent: "#62A76D",
  },
};

// Layout to display on screen
// 0 - Start Screen
// 1 - Lobby Screen
// 2 - Game Screen
let currentLayout = "start";

// -------------- Intro Screen Variables --------------
let qr;
let playercard;
let drawFont;

// Title anim
let textSizeDelta = 0.1;
let textSizeMax = 100;
let textSizeMin = 90;
let textSizeCurrent = textSizeMin;
// Player list
playersSizeFont = 40;
// are the players connected?
isP1Connected = true;
isP2Connected = true;
isP3Connected = true;
isP4Connected = true;
//the size of the character icons
iconSize = 75;
//the intro to the beggining of the screen

// Event Handlers
let showStartScreen = true;
let showLobbyScreen = false;
let showGameScreen = false;

// is the home screenshowing?
let countdown = 3;
//is music playing?
let introMusic;

// -------------- Game variables --------------
// Array containing our bricks
let bricks = [];

// Brick properties
let rows;
let columns;
let brickW = 44;
let brickH = 20;
let brickControl = 0; // 0 is inactive, 1-4 correspond to player possession

// Ball properties
let ball;
let ballX;
let ballY;
let ballR = 40;

// Frame counter
let frameCounter = 0;

// Game length (in amount of frames)
// 60 frames per second
let gameLength = 1600;

// Player Score Handles
let p1Score = 0;
let p2Score = 0;
let p3Score = 0;
let p4Score = 0;

/* -------------- Preload Function -------------- */
// All projects assets are loaded in the page preload.
function preload() {
  drawFont = loadFont("../assets/font/brutality.regular.ttf");
  drawFontFull = loadFont("../assets/font/brutality.extra.ttf");
  qr = loadImage("../assets/images/QRCODE.png");
  playercard = loadImage("../assets/images/tag.png");
  paint1 = loadImage("../assets/images/paint2.png");
  paint2 = loadImage("../assets/images/paint3.png");
  scally = loadImage("../assets/images/scally.png");
  rascal = loadImage("../assets/images/rascal.png");
  tricks = loadImage("../assets/images/tricks.png");
  loafer = loadImage("../assets/images/loafer.png");
  blacktape = loadImage("../assets/images/tape2.png");
  cleartape = loadImage("../assets/images/tape6.png");
  introMusic = loadSound("../assets/sounds/cheesy.mp3"); // Taken from https://www.zapsplat.com/music/easy-cheesy-fun-up-tempo-funky-retro-action-arcade-game-music-great-for-menu-or-pause-sections/
  gameMusic = loadSound("../assets/sounds/1UP.mp3"); //Courtesy of Panda Beats (https://pandabeatsmusic.com/)
}

/* -------------- Setup Function -------------- */
function setup() {
  // Setup the MQTT client
  MQTTsetup();

  // Canvas properties
  createCanvas(canvasW, canvasH);
  background(colors.black.accent);
  noStroke();
  rectMode(CENTER);
  imageMode(CENTER);
  textAlign(CENTER);
  textFont(drawFontFull);

  // Draw press to start to screen
  drawBrickWall();
  updateBrickWall();
  drawStartScreen();
}

/* -------------- Draw Function -------------- */
// The draw function is used during the game to track frames and show countdown.
function draw() {
  if (gameInProgress) {
    console.log(frameCounter);
    if (frameCounter < gameLength) {
      frameCounter++;
      rectMode(CENTER);
      fill(colors.white.main);
      timerRectSize = map(frameCounter, 0, gameLength, width - 120, 0);
      rect(width / 2, height - 60, timerRectSize, 5);
    } else {
      gameInProgress = false;
      fill(colors.white.main);
      countScore();
      showEndScreen();
      console.log(p1Score, p2Score, p3Score, p4Score);
    }
  }
}

/* -------------- Mouse Pressed Function -------------- */
// Events that occur when mouse is clicked.
function mousePressed() {
  // On mouse click when start screen is showing, go to lobby
  if (currentLayout == "start") {
    console.log("Entered lobby");
    currentLayout = "lobby";
    console.log(currentLayout);
    drawLobbyScreen();
  }

  // On mouse click when game is over, return to lobby
  if (currentLayout == "game" && !gameInProgress) {
    console.log("Return to lobby");
    currentLayout = "lobby";
    console.log(currentLayout);
    for (let i = 0; i < bricks.length; i++) {
      bricks[i].display();
    }
    frameCounter = 0;
    drawLobbyScreen();
  }
}

/* -------------- Key Pressed Function -------------- */
// Events that occur when any key is pressed.
function keyPressed() {
  if (currentLayout == "lobby") {
    console.log("Starting game");
    currentLayout = "game";
    gameInProgress = true;
    // console.log(currentLayout);
    drawGameScreen();
  }
}

/* -------------- Draw Press to Start Screen -------------- */
// Draws the start screen.
function drawStartScreen() {
  noStroke();
  textSize(30);
  fill(colors.white.main);
  text("Click anywhere to launch game", width / 2, height / 2);
  textSize(10);
  textFont("Helvetica");
  textAlign(LEFT, CENTER);
  text("Vandalizers, an interactive party game", 60, height - 60);
  textAlign(RIGHT, CENTER);
  text("By Alexander MacKinnon and Anthony Bourgeois", width - 60, height - 60);
  textAlign(CENTER);
}

/* -------------- Draw Lobby Screen -------------- */
// Draws the lobby screen.
function drawLobbyScreen() {
  if (!introMusic.isPlaying()) {
    // play music
    introMusic.loop();
  }
  if (gameMusic.isPlaying()) {
    // play music
    gameMusic.stop();
  }
  playerCard();
  qrCode();
  drawTitle();
  tape();
  /*
  } else {
    if (countdown > 0) {
      textSize(100);
      text(countdown, width / 2, height / 2);
      introMusic.stop();
    } else {
      // call functions that start the game
    }
  }
  */
}

function drawTitle() {
  textSize(textSizeCurrent);
  textAlign(CENTER);
  fill(colors.black.accent);
  text("VANDALIZERS", canvasW / 2, canvasH / 4 - 40);
  textSizeCurrent += textSizeDelta;
  if (textSizeCurrent > textSizeMax || textSizeCurrent < textSizeMin) {
    textSizeDelta *= -1;
  }
  textSize(30);
  text("Waiting for players", canvasW / 2, canvasH / 4 + 60);
}

function qrCode() {
  qr.resize(500, 0);
  image(qr, canvasW / 3 - 20, canvasH / 2 + 30);
  paint1.resize(800, 0);
  image(paint1, canvasW / 2 - 20, canvasH / 4);
  paint2.resize(450, 0);
  image(paint2, canvasW / 2 - 10, canvasH / 4 + 80);
}

function playerCard() {
  playercard.resize(750, 0);
  image(playercard, canvasW / 2, canvasH / 2 + 120);
  textFont(drawFontFull);
  if (isP1Connected) {
    textSize(playersSizeFont);
    fill(colors.black.accent);
    textAlign(CENTER);
    text("Rascal", canvasW / 2 + 220, canvasH / 2 + 23);
    rascal.resize(iconSize, 0);
    image(rascal, canvasW / 2 + 100, canvasH / 2 + 10);
  }

  if (isP2Connected) {
    textSize(playersSizeFont);
    fill(colors.black.accent);
    textAlign(CENTER);
    text("Scally", canvasW / 2 + 220, canvasH / 2 + 103);
    scally.resize(iconSize, 0);
    image(scally, canvasW / 2 + 100, canvasH / 2 + 90);
  }

  if (isP3Connected) {
    textSize(playersSizeFont);
    fill(colors.black.accent);
    textAlign(CENTER);
    text("Loafer", canvasW / 2 + 220, canvasH / 2 + 183);
    loafer.resize(iconSize, 0);
    image(loafer, canvasW / 2 + 100, canvasH / 2 + 170);
  }

  if (isP4Connected) {
    textSize(playersSizeFont);
    fill(colors.black.accent);
    textAlign(CENTER);
    text("Tricks", canvasW / 2 + 220, canvasH / 2 + 263);
    tricks.resize(iconSize, 0);
    image(tricks, canvasW / 2 + 100, canvasH / 2 + 250);
  }
}

function tape() {
  blacktape.resize(200, 0);
  image(blacktape, canvasW / 2 + 340, canvasH / 2 - 50);
  cleartape.resize(200, 0);
  image(cleartape, canvasW / 4 - 80, canvasH - 140);
}

/* -------------- Draw Game Screen -------------- */
// Draws the game screen.
function drawGameScreen() {
  if (introMusic.isPlaying()) {
    // play music
    introMusic.stop();
  }
  gameMusic.play();
  drawBrickWall();
  updateBrickWall();
}

/* -------------- Draw Brick Wall -------------- */
// Loops through as many rows and columns that can fit into the canvas, respecting the brick size, and draws the brick wall accoridngly.
function drawBrickWall() {
  rows = floor(windowHeight / brickH);
  columns = floor(windowWidth / brickW);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      if (j % 2) {
        bricks[i * columns + j] = new Brick(
          i * brickW + brickW / 2,
          j * brickH,
          brickW,
          brickH,
          brickControl
        );
      } else {
        bricks[i * columns + j] = new Brick(
          i * brickW,
          j * brickH,
          brickW,
          brickH,
          brickControl
        );
      }
    }
  }
}
/* -------------- Update Brick Wall Function -------------- */
// Updates the brick wall everytime a signal is received.
function updateBrickWall(playerNo, ballLandedX, ballLandedY) {
  background(colors.black.accent);

  ballX = ballLandedX;
  ballY = ballLandedY;

  for (let i = 0; i < bricks.length; i++) {
    bricks[i].display();
    let hit = bricks[i].detectHit(ballX, ballY, ballR);
    if (hit) {
      bricks[i].control = playerNo;
    }
    if (bricks[i].control == 1) {
      bricks[i].p1Claim();
    }
    if (bricks[i].control == 2) {
      bricks[i].p2Claim();
    }
    if (bricks[i].control == 3) {
      bricks[i].p3Claim();
    }
    if (bricks[i].control == 4) {
      bricks[i].p4Claim();
    }
  }
}

/* -------------- Count Score -------------- */
// Counts each brick and their control status, and increments a variable to count score at the end of the game.
function countScore() {
  for (let i = 0; i < bricks.length; i++) {
    if (bricks[i].control == 1) {
      p1Score++;
    }
    if (bricks[i].control == 2) {
      p2Score++;
    }
    if (bricks[i].control == 3) {
      p3Score++;
    }
    if (bricks[i].control == 4) {
      p4Score++;
    }
  }
}

/* -------------- Show End Screen -------------- */
// Draws the end screen.
function showEndScreen() {
  // Player 1
  text(p1Score, canvasW / 2 - 120, canvasH / 2 + 30);
  tricks.resize(iconSize, 0);
  image(rascal, canvasW / 2 - 120, canvasH / 2 - 30);
  // Player 2
  text(p2Score, canvasW / 2 - 40, canvasH / 2 + 30);
  tricks.resize(iconSize, 0);
  image(scally, canvasW / 2 - 40, canvasH / 2 - 30);
  // Player 3
  text(p3Score, canvasW / 2 + 40, canvasH / 2 + 30);
  tricks.resize(iconSize, 0);
  image(loafer, canvasW / 2 + 40, canvasH / 2 - 30);
  // Player 4
  text(p4Score, canvasW / 2 + 120, canvasH / 2 + 30);
  tricks.resize(iconSize, 0);
  image(tricks, canvasW / 2 + 120, canvasH / 2 - 30);
}

/* -------------- On Message Arrived Function -------------- */
// When a signal is received, do this:
function onMessageArrived(message) {
  let dataReceive = split(trim(message.payloadString), "/"); // Split the incoming message into an array deliniated by "/"
  console.log("Signal received:");

  // 0 is who its from
  // 1 is who its for
  // 2 is X of the ball
  // 3 is Y of the ball

  // If message is for me
  if (dataReceive[1] == thisScreen) {
    console.log(dataReceive[2]);
    console.log(dataReceive[3]);
    // Update brick wall with where latest thrown ball landed, ONLY if game in progress
    if (gameInProgress) {
      updateBrickWall(dataReceive[0], dataReceive[2], dataReceive[3]);
    }
    // If message is for NOT me
  } else {
    console.log("The received signal was not sent to this screen.");
  }
}

/* -------------- Sending a Message Function -------------- */
// When sending a signal, do this:
function sendMQTTMessage(msg, msg2) {
  message = new Paho.MQTT.Message(
    thisScreen + "/" + receivingScreen + "/" + msg + "/" + msg2
  ); // add messages together:
  // My name + Next name + data separated by /
  message.destinationName = topic;
  console.log("Message Sent!");
  client.send(message);
}

/* -------------- MQTT Callback Functions -------------- */
// These functions are called to ensure to functioning of MQTT connection.
function onConnect() {
  client.subscribe(topic);
  console.log("connected");
  // is working
}

function onConnectionLost(response) {
  if (response.errorCode !== 0) {
    // If it stops working
  }
}

function MQTTsetup() {
  client = new Paho.MQTT.Client(
    broker.hostname,
    Number(broker.port),
    creds.clientID
  );
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;
  client.connect({
    onSuccess: onConnect,
    userName: creds.userName, // username
    password: creds.password, // password
    useSSL: true,
  });
}

/* -------------- Brick Object -------------- */
// Brick object, containing the location (x & y), the size (w & h), and who the brick belongs to (control).
class Brick {
  constructor(x, y, w, h, control) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.control = control;
  }

  display() {
    fill(colors.black.main);
    stroke(colors.black.accent);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 3, 3, 3, 3);
  }

  p1Claim() {
    this.control = 1;
    fill(colors.red.main);
    stroke(colors.red.accent);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 3, 3, 3, 3);
  }

  p2Claim() {
    this.control = 2;
    fill(colors.blue.main);
    stroke(colors.blue.accent);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 3, 3, 3, 3);
  }

  p3Claim() {
    this.control = 3;
    fill(colors.yellow.main);
    stroke(colors.yellow.accent);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 3, 3, 3, 3);
  }

  p4Claim() {
    this.control = 4;
    fill(colors.green.main);
    stroke(colors.green.accent);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 3, 3, 3, 3);
  }

  /* -------------- Detect Bricks -------------- */
  detectHit(ballXPos, ballYPos, ballRad) {
    let testX = ballX;
    let testY = ballY;

    if (ballXPos < this.x) testX = this.x; // test left edge
    else if (ballXPos > this.x + this.w) testX = this.x + this.w; // right edge
    if (ballYPos < this.y) testY = this.y; // top edge
    else if (ballYPos > this.y + this.h) testY = this.y + this.h; // bottom edge

    let d = dist(ballXPos, ballYPos, testX, testY);

    if (d <= ballRad) {
      return true;
    }
    return false;
  }
}
