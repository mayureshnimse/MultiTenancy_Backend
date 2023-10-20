// backend/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5000;
const db = require("./config/db")
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const usersRoutes = require('./routes/users');
const tenantsRoute = require('./routes/tenants');
const cookieParser = require('cookie-parser');
const modulesRoute = require('./routes/modules');
const customerRoute = require("./routes/customer");



// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());



// Test route
app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});


// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tenants', tenantsRoute);
app.use('/api/modules', modulesRoute);
app.use('/api/customer', customerRoute);



// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

