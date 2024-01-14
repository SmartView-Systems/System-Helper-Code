const mqtt = require('mqtt');
const readline = require('readline');

const fs = require('fs')
const protocol = 'mqtts'
// Set the host and port based on the connection information.
const host = 'u88196e4.ala.us-east-1.emqxsl.com'
const port = '8883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'mqttservice',
  password: 'password3',
  reconnectPeriod: 1000,
  // If the server is using a self-signed certificate, you need to pass the CA.
  ca: fs.readFileSync('./broker.emqx.io-ca.crt'),
})

// Messages:
// (1) <lab>/INIT/OUT <IP> <MAC>
// (2) <lab>/DATA <DeviceID> <Time> <Temp> <Humidity>
// (6) <lab>/STATUS/IN <deviceID>

// (1) <lab>/INIT/OUT <IP> <MAC>
const initMessage = "192.168.9.1 0C:DC:7E:CB:6C:D0";
// (2) <lab>/DATA <DeviceID> <Time> <Temp> <Humidity>
const dataPoint = "2 1703704262 0 0 29 0 39 0 29 11"
// (6) <lab>/STATUS/IN <deviceID>
const statusMessage = "9";

// (4) nialab/CONFIG <DeviceID> <Frequency> <Units>
const configMessage = "9 60 Minute";

// (5) nialab//STATUS/OUT STATUS
const statusOutMessage = "STATUS";

// Topic Information: Here the lab will be combined with the topic part to create the complete topic
const labName = "nialab" ; // Change this if you want to change labs
const topicPart = ['/INIT/OUT', '/DATA', '/STATUS/IN', '/CONFIG' ,'/STATUS/OUT' ];


// Interface for reading user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt the user for input
function promptUser() {
  // Ask the user for input
  rl.question('Enter Command(type "quit" to exit): ', (message) => {
    // Check if the user wants to quit
    if (message.toLowerCase() === 'quit') {
      // Close the connection and the readline interface
      client.end();
      rl.close();
    } else {
      var outMessage;
      switch (parseInt(message)) {
        case 1:
          outMessage = initMessage;
          topic = labName + topicPart[0]
          break;
        case 2:
          outMessage = dataPoint;
          topic = labName + topicPart[1]
          break;
        case 4:
            outMessage = configMessage;
            topic = labName + topicPart[3]
            break;
        case 5:
            outMessage = statusOutMessage;
            topic = labName + topicPart[4]
            break;
        case 6:
          outMessage = statusMessage;
          topic = labName + topicPart[2]
          break;

        default:
          outMessage = message;
          topic = "default?"
          break;
      }

      // Publish the user's message to a topic
      client.publish(topic, outMessage, (err) => {
        if (!err) {
          console.log(`Published message to ${topic}: ${outMessage}`);
        } else {
          console.error(`Error publishing message: ${err}`);
        }

        console.log();
        // Recursively prompt the user for the next input
        promptUser();
      });
    }
  });
}

function initFunction(){
  console.log('////////////////////////////');
  console.log("Welcome to the MQTT Sender");
  console.log("Below are your Options:");
  console.log("1 -> Will send a INIT Connection Message: ESP32 -> Broker");
  console.log("2 -> Will send a DATA Point: ESP32 -> Broker");
  console.log("4 -> Will send a CONFIG Message: API -> Broker");
  console.log("5 -> Will send a STATUS Message: API -> Broker");
  console.log("6 -> Will send a STATUS Message: ESP32 -> Broker");
  console.log('////////////////////////////');
  console.log();

}

// Handle connection event
client.on('connect', () => {
  console.clear();
  initFunction();
  // console.log('Sender connected to MQTT broker');
  promptUser();
});

// Handle error event
client.on('error', (error) => {
    console.error(`Error: ${error}`);
});
