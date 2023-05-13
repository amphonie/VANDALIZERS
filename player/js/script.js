/**
Vandalizers
by Alexander MacKinnon & Anthony Bourgeois
*/

/**
 * THIS IS THE JS FILE FOR THE PLAYER END OF THE GAME.
 */

// ------- MQTT setup -------

let thisScreen = null; // Who are you? Make sure it matches the previous person's variable!
let receivingScreen = "receiver"; // Who is next on the list? Make sure it matches the next person's variable!
let dataToSend; // Variable to hold the data to send to the next person on the list

// MQTT client details. We are using a public server called shiftr.io. Don't change this.
let broker = {
  hostname: "public.cloud.shiftr.io",
  port: 443,
};
let client;

let creds = {
  clientID: Math.random().toString(16).slice(3),
  userName: "public",
  password: "public",
};
let topic = "vandalizersServer1"; // This is the topic we are all subscribed to

// End of MQTT client details

// ------- Game variables -------

// Main Screen Size
let canvasW = 1200;
let canvasH = 800;

// Gyroscope Permission
let permissionGranted = false;

// playerchosen
let playerChosen;

// Shooting Display
let shootingDisplay = {
  w: 480,
  h: 320,
  ball: {
    x: null,
    y: null,
    mappedX: null,
    mappedY: null,
    size: 20,
  },
  edges: {
    top: null,
    right: null,
    bottom: null,
    left: null,
  },
};

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

/* ------- Setup Function ------- */
function preload() {
  brutalityRegFont = loadFont("../assets/font/brutality.regular.ttf");
  brutalityExtraFont = loadFont("../assets/font/brutality.extra.ttf");
}

/* ------- Setup Function ------- */
function setup() {
  // Setup the MQTT client
  MQTTsetup();

  // Canvas properties
  createCanvas(windowWidth, windowHeight);
  noStroke();
  rectMode(CENTER);
  shootingDisplay.ball.x = width / 2;
  shootingDisplay.ball.y = height / 2;

  // DeviceOrientationEvent, DeviceMotionEvent
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    // ios 13 device

    DeviceOrientationEvent.requestPermission()
      .catch(() => {
        // show permission dialog only the first time
        let button = createButton("Click to allow sensors.");
        button.style("font-size", "24px");
        button.center();
        button.mousePressed(requestAccess);
        throw error;
      })
      .then(() => {
        // on any subsequent visits
        permissionGranted = true;
      });
  } else {
    // non ios 13 device
    textSize(48);
    // text("non ios 13 device", 100, 100);
    permissionGranted = true;
  }
}

function requestAccess() {
  DeviceOrientationEvent.requestPermission()
    .then((response) => {
      if (response == "granted") {
        permissionGranted = true;
      } else {
        permissionGranted = false;
      }
    })
    .catch(console.error);

  this.remove();
}

/* ------- Choose Player Screen ------- */

function choosePlayer() {
  background(colors.black.main);
  textFont(brutalityExtraFont);
  textAlign(CENTER, CENTER);
  textSize(54);

  // Player Card Properties
  const choosePlayerCards = {
    w: 400,
    h: 100,
    p1: {
      x: width / 2 + 10,
      y: height / 2 - 165,
      edges: {
        top: null,
        bottom: null,
      },
    },
    p2: {
      x: width / 2 - 10,
      y: height / 2 - 55,
      edges: {
        top: null,
        bottom: null,
      },
    },
    p3: {
      x: width / 2 + 10,
      y: height / 2 + 55,
      edges: {
        top: null,
        bottom: null,
      },
    },
    p4: {
      x: width / 2 - 10,
      y: height / 2 + 165,
      edges: {
        top: null,
        bottom: null,
      },
    },
  };

  // Draw Player Cards
  // Player Card #1
  fill(colors.red.main);
  rect(
    choosePlayerCards.p1.x,
    choosePlayerCards.p1.y,
    choosePlayerCards.w,
    choosePlayerCards.h,
    10
  );
  fill(colors.white.main);
  text("Rascal", choosePlayerCards.p1.x, choosePlayerCards.p1.y - 5);
  // Player Card #2
  fill(colors.blue.main);
  rect(
    choosePlayerCards.p2.x,
    choosePlayerCards.p2.y,
    choosePlayerCards.w,
    choosePlayerCards.h,
    10
  );
  fill(colors.white.main);
  text("Scally", choosePlayerCards.p2.x, choosePlayerCards.p2.y - 5);
  // Player Card #3
  fill(colors.yellow.main);
  rect(
    choosePlayerCards.p3.x,
    choosePlayerCards.p3.y,
    choosePlayerCards.w,
    choosePlayerCards.h,
    10
  );
  fill(colors.white.main);
  text("Loafer", choosePlayerCards.p3.x, choosePlayerCards.p3.y - 5);
  // Player Card #4
  fill(colors.green.main);
  rect(
    choosePlayerCards.p4.x,
    choosePlayerCards.p4.y,
    choosePlayerCards.w,
    choosePlayerCards.h,
    10
  );
  fill(colors.white.main);
  text("Tricks", choosePlayerCards.p4.x, choosePlayerCards.p4.y - 5);

  // Find edges of player cards (for clicking)
  choosePlayerCards.p1.edges.top =
    choosePlayerCards.p1.y - choosePlayerCards.h / 2;
  choosePlayerCards.p1.edges.bottom =
    choosePlayerCards.p1.y + choosePlayerCards.h / 2;
  choosePlayerCards.p2.edges.top =
    choosePlayerCards.p2.y - choosePlayerCards.h / 2;
  choosePlayerCards.p2.edges.bottom =
    choosePlayerCards.p2.y + choosePlayerCards.h / 2;
  choosePlayerCards.p3.edges.top =
    choosePlayerCards.p3.y - choosePlayerCards.h / 2;
  choosePlayerCards.p3.edges.bottom =
    choosePlayerCards.p3.y + choosePlayerCards.h / 2;
  choosePlayerCards.p4.edges.top =
    choosePlayerCards.p4.y - choosePlayerCards.h / 2;
  choosePlayerCards.p4.edges.bottom =
    choosePlayerCards.p4.y + choosePlayerCards.h / 2;

  if (mouseIsPressed === true) {
    if (
      mouseY > choosePlayerCards.p1.edges.top &&
      mouseY < choosePlayerCards.p1.edges.bottom
    ) {
      thisScreen = 1;
      playerChosen = true;
    } else if (
      mouseY > choosePlayerCards.p2.edges.top &&
      mouseY < choosePlayerCards.p2.edges.bottom
    ) {
      thisScreen = 2;
      playerChosen = true;
    } else if (
      mouseY > choosePlayerCards.p3.edges.top &&
      mouseY < choosePlayerCards.p3.edges.bottom
    ) {
      thisScreen = 3;
      playerChosen = true;
    } else if (
      mouseY > choosePlayerCards.p4.edges.top &&
      mouseY < choosePlayerCards.p4.edges.bottom
    ) {
      thisScreen = 4;
      playerChosen = true;
    }
  }
}

/* ------- Draw Function ------- */
function draw() {
  if (!playerChosen) {
    choosePlayer();
  } else {
    // Draw bg
    fill(colors.black.accent);
    rect(width / 2, height / 2, width, height);
    // Draw mini shooting display
    fill(colors.black.main);
    rect(width / 2, height / 2, shootingDisplay.w, shootingDisplay.h);

    // Check if sensor permission is true
    if (!permissionGranted) return;

    // Move ball based on phone rotation
    const dx = constrain(rotationY, -3, 3);
    const dy = constrain(rotationX, -3, 3);
    shootingDisplay.ball.x += dx * 2;
    shootingDisplay.ball.y += dy * 2;

    // Find edges of shooting display
    shootingDisplay.edges.top =
      height / 2 - shootingDisplay.h / 2 + shootingDisplay.ball.size / 2;
    shootingDisplay.edges.right =
      width / 2 + shootingDisplay.w / 2 - shootingDisplay.ball.size / 2;
    shootingDisplay.edges.bottom =
      height / 2 + shootingDisplay.h / 2 - shootingDisplay.ball.size / 2;
    shootingDisplay.edges.left =
      width / 2 - shootingDisplay.w / 2 + shootingDisplay.ball.size / 2;

    // Constrain values of the ball to the mini shooting display
    // x values
    shootingDisplay.ball.x = constrain(
      shootingDisplay.ball.x,
      shootingDisplay.edges.left,
      shootingDisplay.edges.right
    );
    // y values
    shootingDisplay.ball.y = constrain(
      shootingDisplay.ball.y,
      shootingDisplay.edges.top,
      shootingDisplay.edges.bottom
    );

    // Draw ball on shooting display
    fill(colors.red.main);
    ellipse(
      shootingDisplay.ball.x,
      shootingDisplay.ball.y,
      shootingDisplay.ball.size
    );
    shootingDisplay.ball.mappedX = map(
      shootingDisplay.ball.x,
      shootingDisplay.edges.left,
      shootingDisplay.edges.right,
      0,
      canvasW
    );
    shootingDisplay.ball.mappedY = map(
      shootingDisplay.ball.y,
      shootingDisplay.edges.top,
      shootingDisplay.edges.bottom,
      0,
      canvasH
    );
  }
}

/* ------- Mouse Pressed Function ------- */

function mousePressed() {
  if (playerChosen) {
    sendMQTTMessage(shootingDisplay.ball.mappedX, shootingDisplay.ball.mappedY);
  }
}

/* ------- On Message Arrived Function ------- */
// When a message arrives, do this:
function onMessageArrived(message) {
  let dataReceive = split(trim(message.payloadString), "/"); // Split the incoming message into an array deliniated by "/"
  console.log("Message Received:");
  console.log(String(dataReceive[1]));

  // 0 is who its from
  // 1 is who its for
  // 2 is the data

  // If message is for me
  if (dataReceive[1] == thisScreen) {
    // Check if its for me
    console.log("Its for me! :) ");
    console.log(dataReceive[2]);
    console.log(dataReceive[3]);

    // If message is for NOT me
  } else {
    console.log("Not for me! :( ");
  }
}

/* ------- Sending a Message Function ------- */
function sendMQTTMessage(msg, msg2) {
  message = new Paho.MQTT.Message(
    thisScreen + "/" + receivingScreen + "/" + msg + "/" + msg2
  ); // add messages together:
  // My name + Next name + data separated by /
  message.destinationName = topic;
  console.log("Message Sent!");
  client.send(message);
}

/* ------- Callback Functions ------- */
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
