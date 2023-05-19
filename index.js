

const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000

const app = express();
app.use(express.json());

// Rate Limiting settings
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 100 requests per hour
  message: 'Too many requests. Please try again later.',
});

// we apply rate limiter middleware to all routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    next();
  } else {
    limiter(req, res, next);
  }
});

// route to serve the API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const registeredDevices = []; // array to store registered devices
const secretKey = "the-secret-key"; // secret key for JWT token

// Function to handle device-self-registration
function registerDeviceHandler(req, res, next) {
  const { agent_name, device_type, device_make, device_os, device_os_version, imei_numbers } = req.body;

   // Generate a unique reference for the device
   const device_reference = crypto.randomBytes(16).toString("hex");

  // Store the device information in the array of registered devices
  registeredDevices.push({
    device_reference,
    agent_name,
    device_type,
    device_make,
    device_os,
    device_os_version,
    imei_numbers,
  });

  // Return the device reference to the device
    res.json({ device_reference });
  }
  
// Function to handle QR code scanning and generating authentication token
function scanQRHandler(req, res, next) {
  const { device_reference } = req.body;

  // Check if the device is registered
  const registeredDevice = registeredDevices.find((device) => device.device_reference === device_reference);
  if (!registeredDevice) {
    return res.status(400).json({ error: "Device is not registered" });
  }

  // Generate authentication token
    const payload = { authentication_reference: device_reference };
    const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
  
    // Return the authentication URL, authentication reference, and token
    res.json({
      api_auth_url: "https://appsmsgateway.com/",
      authentication_reference: device_reference,
      authentication_key: token,
    });
  }

// Function to handle token referesh
function refreshTokenHandler(req, res, next) {
  const { authentication_key } = req.headers;

   // Verify the token's authenticity and validity
   jwt.verify(authentication_key, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Generate a new token with an updated expiration time
    const payload = { authentication_reference: decoded.authentication_reference };
    const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

    // Return the new token
    res.json({ authentication_key: token });
  });
}


// Endpoint for device self-registration
app.post("/api/register-device", registerDeviceHandler);

// Endpoint for scanning QR code and generating authentication token
app.post("/api/scan-qr", scanQRHandler);

// Endpoint for token refresh
app.post("/api/refresh-token", refreshTokenHandler);

 
// Start the server
app.listen(PORT, () => 
  console.log("Server Listening on port PORT ${PORT}" ));



