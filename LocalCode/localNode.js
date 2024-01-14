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
const topicPart = ['/INIT/OUT', '/DATA', '/STATUS/OUT', '/CONFIG', '/STATUS/IN'];

//                  0              1          2    3         4     5         6     7
const dataTypes = ['Temperature', 'Humidity','CO','Alcohol','CO2','Toluene','NH4','Acetone',]
let dataArray = [];

let returnDevices = [];

const baseURL = "https://smartviewapi.netlify.app/.netlify/functions/"

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
  console.log('LabSensor LocalNode Connected')
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

// On messages run this function
client.on('message', async (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
  
  // Parse the topic for the lab and topic type
  const returnInfo = await parseTopic(topic.toString());
  incomingLab = returnInfo[0];
  incomingTopic = returnInfo[1];


  if (!labName.includes(incomingLab)) {
    console.log(`ERROR: ${incomingLab} is not in the list of labs`);
  } else {
    // console.log(`SUCESS: ${returnInfo[0]} is in the list of labs`);
  }


  //////////////////////////////
  //          INIT            //
  //////////////////////////////
  if(incomingTopic == topicPart[0]){
    console.log("INIT message detected");

    const initMessageInfo = await parseInitMessage(payload.toString());
    const ipAddress = initMessageInfo[0];
    const macAddress = initMessageInfo[1];

    try {
      const result = await addDeviceAPI(incomingLab, ipAddress, macAddress);
      console.log("Status:", result.status);

      if(result.status){
        console.log("sending an MQTT message to the esp32");
        const data = JSON.parse(result.response);

        if (data.success) {
          const deviceInfo = data.data;
          const resultString = `${macAddress} ${deviceInfo.DeviceID} ${deviceInfo.Frequency} ${deviceInfo.Units}`;
          // console.log(`Sending mqtt message with: ${resultString}`);

          const topicOut = incomingLab + '/INIT/IN' 
          // console.log(`Sending mqtt topic: ${topicOut}`);

          try {
            await publishMessage(topicOut, resultString);
            console.log();
          } catch (error) {
            console.log("error in sending MQTT")
          }

        } 
      }
      else{
        console.log(`ERROR Response code was ${result.status}`);
      }
    } catch (error) {
      console.error("Error in exampleUsage:", error);
    }
  }

  //////////////////////////////
  //          Data            //
  //////////////////////////////
  // Incoming Data Message
  if(returnInfo[1] == topicPart[1]){
    console.log("DATA message detected");

    // debug statement
    if(false){
      console.log(`Intercepted: ${payload.toString()} but in debug mode so not sending a call to the API`);
    }
    else {
      const dataMessageInfo = await parseDataMessage(payload.toString());
      console.log(`datamessage info looks like ${dataMessageInfo}`);
      const DeviceID = dataMessageInfo[0];
      const Time = dataMessageInfo[1];

      dataArray.length = 0;
      for (let index = 2; index <= 9; index++) {
        dataArray.push(parseInt(dataMessageInfo[index]));
      }
  
      const resultRecent = await updateRecentDeviceData(incomingLab, DeviceID, Time, dataArray)
      const resultHistorical = await updateHistoricalDeviceData(incomingLab, DeviceID, Time, dataArray)
      const resultAlarm = await checkDeviceAlarmStatus(incomingLab, DeviceID, Time, dataArray)

      console.log("Recent Sataus:", resultRecent.status);
      console.log("Historical Status:", resultHistorical.status);
      console.log("Alarm Check Status:", resultAlarm.status);

    }
    console.log("")
  }

  //////////////////////////////
  //       Status Request     //
  //////////////////////////////
  if(returnInfo[1] == topicPart[2]){

    // if there is a status message start a timmer.
    // while the timmer is running, get all the messages on tipart /STATUS/IN and push them to an array
    // after the timer is done call call Updatemanydevice with the array of devices.
    console.log("STATUS message detected");
    returnDevices.length = 0;
    console.log("Start listending for messages");
    setTimeout(async function() {
      console.log("Finished listendng to messages");
      console.log(`Now calling API with array ${returnDevices}`);
      const deviceUpdateStatus = await updateManyDeviceStatus(incomingLab, returnDevices);
      console.log("Recent Sataus:", deviceUpdateStatus.status);

    }, 10000);
  }

  //////////////////////////////
  //      Status Response     //
  //////////////////////////////
  if(returnInfo[1] == topicPart[4]){
    // if there is a status message start a timmer.
    // while the timmer is running, get all the messages on tipart /STATUS/IN and push them to an array
    // after the timer is done call call Updatemanydevice with the array of devices.
    console.log(`STATUS message detected from device ${payload.toString()}`);

    if (!returnDevices.includes(parseInt(payload))) {
      returnDevices.push(parseInt(payload));
    }else{
      console.log(`ERROR, Device Number ${payload.toString()} is already added to the array`);
    }
  }
})




//////////////////////////////
//        Functions         //
//////////////////////////////

// parse init message
async function parseInitMessage(message){
  const initMessageInfo = message.split(' ');
  return initMessageInfo;
}

async function parseDataMessage(message){
  const dataMessageInfo = message.split(' ');
  return dataMessageInfo;
}

// 
async function updateManyDeviceStatus(labName, deviceArray) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify(deviceArray);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const functionString = "https://smartviewapi.netlify.app/.netlify/functions/updateManyDeviceStatus?labApi=" + labName;

  try {
    const response = await fetch(functionString, requestOptions);
    const status = response.status;
    const returnResponse = await response.text();
    
    // Return an object containing status and response text
    return { status: status, response: returnResponse };
  } catch (error) {
    console.error('Error in updateManyDeviceStatus:', error);
    throw error; // Rethrow the error to let the caller handle it
  }
}


// start
async function addDeviceAPI(labName, IP, MAC) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "MAC": MAC,
    "IP": IP
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const functionString = "https://smartviewapi.netlify.app/.netlify/functions/addDevice?labApi=" + labName;

  try {
    const response = await fetch(functionString, requestOptions);
    const status = response.status;
    const returnResponse = await response.text();
    
    // Return an object containing status and response text
    return { status: status, response: returnResponse };
  } catch (error) {
    console.error('Error in addDeviceAPI:', error);
    throw error; // Rethrow the error to let the caller handle it
  }
}

// This function will add data to the most recent data table
async function updateRecentDeviceData(labName, DeviceID, Time, dataArray) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "DeviceID": parseInt(DeviceID),
    "Temperature": dataArray[0],
    "Humidity": dataArray[1],
    "CO": dataArray[2],
    "Alcohol": dataArray[3],
    "CO2": dataArray[4],
    "Toluene": dataArray[5],
    "NH4": dataArray[6],
    "Acetone": dataArray[7],
    "Time": parseInt(Time)
  });


  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const functionString = baseURL + "updateRecentDeviceData?labApi=" + labName;

  try {
    const response = await fetch(functionString, requestOptions);
    const status = response.status;
    const returnResponse = await response.text();
    
    // Return an object containing status and response text
    return { status: status, response: returnResponse };
  } catch (error) {
    console.error('Error in addDeviceAPI:', error);
    throw error; // Rethrow the error to let the caller handle it
  }
}

// This function will add data to the historical data collection
async function updateHistoricalDeviceData(labName, DeviceID, Time, dataArray) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "DeviceID": parseInt(DeviceID),
    "Temperature": dataArray[0],
    "Humidity": dataArray[1],
    "CO": dataArray[2],
    "Alcohol": dataArray[3],
    "CO2": dataArray[4],
    "Toluene": dataArray[5],
    "NH4": dataArray[6],
    "Acetone": dataArray[7],
    "Time": parseInt(Time)
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const functionString = baseURL + "updateHistoricalDeviceData?labApi=" + labName;

  try {
    const response = await fetch(functionString, requestOptions);
    const status = response.status;
    const returnResponse = await response.text();
    
    // Return an object containing status and response text
    return { status: status, response: returnResponse };
  } catch (error) {
    console.error('Error in addDeviceAPI:', error);
    throw error; // Rethrow the error to let the caller handle it
  }
}

// This function will check the current alarms
async function checkDeviceAlarmStatus(labName, DeviceID, Time, dataArray) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "DeviceID": parseInt(DeviceID),
    "Temperature": dataArray[0],
    "Humidity": dataArray[1],
    "CO": dataArray[2],
    "Alcohol": dataArray[3],
    "CO2": dataArray[4],
    "Toluene": dataArray[5],
    "NH4": dataArray[6],
    "Acetone": dataArray[7],
    "Time": parseInt(Time)
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  const functionString = baseURL + "checkDeviceAlarmStatus?labApi=" + labName;

  try {
    const response = await fetch(functionString, requestOptions);
    const status = response.status;
    const returnResponse = await response.text();
    
    // Return an object containing status and response text
    return { status: status, response: returnResponse };
  } catch (error) {
    console.error('Error in addDeviceAPI:', error);
    throw error; // Rethrow the error to let the caller handle it
  }
}



// working
async function publishMessage(returnTopic, outMessage){
  client.publish(returnTopic, outMessage, (err) => {
    if (!err) {
      console.log(`Published message to ${returnTopic}: ${outMessage}`);
    } else {
      console.error(`Error publishing message: ${err}`);
    }
  });

}

// working
async function parseTopic(inputString){
  var resultArray = inputString.split('/');

  var lab = resultArray[0];
  var restOfTopic = "/" + resultArray.slice(1).join('/');

  let returnArray = [lab, restOfTopic]

  return returnArray;
}

// working
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