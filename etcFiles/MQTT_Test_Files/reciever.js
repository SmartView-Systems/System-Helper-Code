const mqtt = require('mqtt');

// MQTT broker connection options
const brokerUrl = 'http://192.168.1.7'; // Replace with your broker URL
const options = {
  clientId: 'mqtt-receiver',
};

const device1Topic = 'INIT/OUT';
const device2Topic = 'DATA';

// Connect to the MQTT broker
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
  console.log("//////////////////////////////////////")
  console.log('LabSensor.us Data Subscriber Connected to MQTT broker');

  subscribeToTopic(device1Topic, () => {
    subscribeToTopic(device2Topic, () => {
      // This block will be executed after both subscriptions are complete
      console.log("//////////////////////////////////////");
    });
  });
});

function subscribeToTopic(topic, callback) {
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Subscribed to: ${topic}`);
      callback(); // Invoke the callback once the subscription is complete
    } else {
      console.error(`Error subscribing to ${topic}: ${err}`);
      callback(); // Invoke the callback even if there is an error
    }
  });
}

// Handle incoming messages
client.on('message', (topic, message) => {
  console.log(`Received message on topic: ${topic} / ${message.toString()}`);
  switch (topic) {
    case device1Topic:
        break;
    case device2Topic:
        break;
  
    default:
        console.log("error unknown topic")
        break;
  }
});

// Handle error event
client.on('error', (error) => {
  console.error(`Error: ${error}`);
});

// Handle close event
client.on('close', () => {
  console.log('Connection closed');
});

