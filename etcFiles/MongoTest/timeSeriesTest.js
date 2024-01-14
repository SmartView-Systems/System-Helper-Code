const { MongoClient } = require('mongodb');

async function writeToMongoDB(sensor, timestamp, temperature) {
  // Connection URI
  const uri = 'mongodb+srv://bgilb33:GbGb302302!@labsensordb.drzhafh.mongodb.net/?retryWrites=true&w=majority';

  // Create a new MongoClient
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Select the database and collection
    const database = client.db('test');
    const collection = database.collection('niaLab_TimeSeries');

    // Create the data point document
    const dataPoint = {
      metadata: {
        sensor: sensor
      },
      timestamp: timestamp,
      temperature: temperature
    };

    // Insert the document into the collection
    const result = await collection.insertOne(dataPoint);

    // Print the inserted document's ID (optional)
    console.log('Inserted document ID:', result.insertedId);
  } finally {
    // Close the connection
    await client.close();
  }
}

function getCurrentEpochTime() {
    return (Math.floor(Date.now() / 1000).toString()); // Convert milliseconds to seconds
  }

// Example usage
writeToMongoDB(1, getCurrentEpochTime(), (Math.floor(Math.random() * 10)));
