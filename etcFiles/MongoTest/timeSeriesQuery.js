const { MongoClient } = require('mongodb');

async function getRecentTemperatureReadings(sensorValue, limit = 20) {
  const uri = 'mongodb+srv://bgilb33:GbGb302302!@labsensordb.drzhafh.mongodb.net/?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('test');
    const collection = database.collection('niaLab_TimeSeries');

    // Query for the most recent 20 temperature readings for the specified sensor value
    const query = {
      'metadata.sensor': sensorValue
    };

    const options = {
      sort: { timestamp: -1 }, // Sort by timestamp in descending order
      limit: limit // Limit the result to the specified number of documents
    };

    const result = await collection.find(query, options).toArray();

        // Extract timestamps and temperatures into separate arrays
    const timestamps = result.map(entry => entry.timestamp);
    const temperatures = result.map(entry => entry.temperature);

    // Print the arrays (optional)
    console.log('Timestamps:', timestamps);
    console.log('Temperatures:', temperatures);

    return result;
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Example usage
getRecentTemperatureReadings(1);
