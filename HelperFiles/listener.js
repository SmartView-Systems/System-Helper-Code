const mqtt = require('mqtt')

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

const labName = ['nialab', 'anotherlab'];
const topicPart = ['/INIT/OUT', '/DATA', '/STATUS/IN', '/INIT/IN', '/STATUS/OUT', '/CONFIG', ];

const topics = [];

// Nested loops to combine each lab with each topic part
for (let i = 0; i < labName.length; i++) {
  for (let j = 0; j < topicPart.length; j++) {
    const topic = labName[i] + topicPart[j];
    topics.push(topic);
  }
}

client.on('connect', () => {
  console.clear();
  console.log('////////////////////////////');
  console.log('LabSensor Listener Connected')
  console.log('Connected to the Following topics:');
  console.log('////////////////////////////');

  subscribeToTopics(topics)
  .then(() => {
    console.log('////////////////////////////');
  })
  .catch((error) => {
    console.error('Error subscribing to topics:', error);
  });

})

client.on('message', (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
})


// Function to subscribe to topics
function subscribeToTopics(topics) {
  const promises = [];

  for (let i = 0; i < topics.length; i++) {
    const promise = new Promise((resolve) => {
      client.subscribe([topics[i]], () => {
        console.log(`Subscribe to topic '${topics[i]}'`);
        resolve();
      });
    });

    promises.push(promise);
  }

  return Promise.all(promises);
}