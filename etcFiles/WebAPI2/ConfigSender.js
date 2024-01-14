const mqtt = require('mqtt');

// MQTT broker URL
const mqttBrokerUrl = 'mqtt://192.168.1.7'; // Replace with your MQTT broker URL

// MQTT topic to publish the data
const mqttTopic = 'CONFIG'; // Replace with your desired MQTT topic

function sendConfigData(data) {
  // Create an MQTT client
  const client = mqtt.connect(mqttBrokerUrl);

  // Convert the data object to a space-separated string
  let dataString = Object.entries(data).map(([key, value]) => `${value}`).join(' ');
  dataString = "EDIT " + dataString
  // Publish the data string to the MQTT topic
  client.publish(mqttTopic, dataString, (err) => {
    if (err) {
      console.error('Error publishing data via MQTT:', err);
    } else {
      console.log('Data published via MQTT:', dataString);
    }

    // End the MQTT connection after publishing
    client.end();
  });
}

module.exports = sendConfigData;
