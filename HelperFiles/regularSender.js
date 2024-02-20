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

// Topic Information: Here the lab will be combined with the topic part to create the complete topic
const labName = "nialab" ; // Change this if you want to change labs

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

      client.publish(("emqx/esp32"), message, (err) => {
        if (!err) {
          console.log(`Published message:}: ${message}`);
        } else {
          console.error(`Error publishing message: ${err}`);
        }
        promptUser();
      });
    }
  });
}



// Handle connection event
client.on('connect', () => {
    console.clear();
    console.log('///////////////////////////////////////');
    console.log('Regular Sender connected to MQTT broker');
    console.log('///////////////////////////////////////');
    promptUser();
});

// Handle error event
client.on('error', (error) => {
    console.error(`Error: ${error}`);
});
