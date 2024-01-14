const express = require('express');
const app = express();
const port = 3003;

// Middleware for logging and parsing JSON in the request body
app.use(express.json());

// Define a POST endpoint
app.post('/api/hello', (req, res) => {
    // Log the data payload

    // Respond with a message
    res.send("Hello Benji, it's a breezy 100 degrees outside");
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
