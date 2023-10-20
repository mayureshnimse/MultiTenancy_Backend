// backend/controllers/tenants.js


const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const Tenant = require('../models/Tenant');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');



// Create a new tenant
exports.createTenant = async (req, res) => {
    try {
        const { name, username, role, description, databaseName, permissions, password } = req.body;
        const dbUri = `mongodb://127.0.0.1:27017/${databaseName}`;

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a connection to the MongoDB server using the provided dbUri
        const mongooseConnection = mongoose.createConnection(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        mongooseConnection.on('connected', async () => {
            console.log('Connected to tenant database');



            // Create a new MongoDB database using the extracted dbName
            const db = mongooseConnection.db;


            // Create a collection (e.g., 'tenants') in the new database and store the name and description
            const tenantsCollection = db.collection('tenants');
            const tenantData = { name, username, password: hashedPassword, description, role, permissions, };
            await tenantsCollection.insertOne(tenantData);

            // Respond with a success message
            res.status(201).json({ message: 'Tenant and database connection created successfully' });
        });

        // Handle potential errors during connection
        mongooseConnection.on('error', (err) => {
            console.error('Error creating tenant DB connection:', err);
            res.status(500).json({ message: 'Error creating tenant database connection' });
        });

        // Save the tenant document
        const newTenant = await Tenant.create({ name, username, password: hashedPassword, description, role, permissions, databaseName });


    } catch (error) {
        console.error('Error creating tenant:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};


//for superadmin
exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find();
        res.status(200).json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

//for tenants
// exports.getTenantData = async (req, res) => {
//     try {
//         // Obtain the username from the JWT token
//         const token = req.cookies.jwtToken; // Assuming the JWT token is stored in a cookie

//         if (!token) {
//             return res.status(401).json({ message: 'JWT token is missing.' });
//         }

//         const decoded = jwt.verify(token, jwtSecret);
//         console.log(decoded);
//         const username = decoded.username;
//         console.log(username)

//     // Fetch the tenant data based on the username
//         const tenant = await Tenant.findOne({ username });
//         // console.log(tenant);

//         if (!tenant) {
//             return res.status(404).json({ message: 'Tenant not found.' });
//         }
//         // Return the tenant data
//         res.status(200).json(tenant);
//     } catch (error) {
//         console.error('Error fetching tenant data:', error);
//         res.status(500).json({ message: 'Internal server error.' });
//     }
// };

exports.getTenantData = async (req, res) => {
    try {
        // Obtain the username from the JWT token
        // const token = req.cookies.jwtToken; // Assuming the JWT token is stored in a cookie

        // if (!token) {
        //     return res.status(401).json({ message: 'JWT token is missing.' });
        // }

        // const decoded = jwt.verify(token, jwtSecret);
        // console.log(decoded);
        // const username = decoded.username;
        // console.log(username);

        // Fetch the tenant based on the username
        const tenantId = req.params.tenantId;
        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found.' });
        }

        // Use the tenant's dbUri to create a connection to their database
        // const tenantConnection = mongoose.createConnection(tenant.dbUri, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });

        // tenantConnection.on('connected', async () => {
        //     console.log('Connected to tenant database');

            // Access tenant-specific data from their database
            //const tenantSpecificData = await tenantConnection.collection('tenants').find().toArray();

        //     // Respond with the tenant-specific data
        //     res.status(200).json({ tenantSpecificData });
        // });

        // Handle potential errors during connection
        // tenantConnection.on('error', (err) => {
        //     console.error('Error creating tenant DB connection:', err);
        //     res.status(500).json({ message: 'Error creating tenant database connection' });
        // });

        res.json(tenant);

    } catch (error) {
        console.error('Error fetching tenant data:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// delete tenant
exports.deleteTenant = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;

        // Use the module's ID to find and delete it from the database
        const deletedTenant = await Tenant.findByIdAndDelete(tenantId);

        if (!deletedTenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        return res.status(200).json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
  };


  // update tenant
  exports.updateTenant = async (req, res) => {
    try {
        const tenantId = req.params.tenantId;
        const updateData = req.body; // Data to update the tenant

        // Use the tenant's ID to find and update it in the database
        const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, updateData, { new: true });

        if (!updatedTenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        return res.status(200).json(updatedTenant);
    } catch (error) {
        console.error('Error updating tenant:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
// Add more controller functions for updating, deleting, and other tenant-related operations as needed.
