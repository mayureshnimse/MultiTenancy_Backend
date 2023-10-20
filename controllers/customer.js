const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth");

const bcrypt = require("bcrypt");
const customerTenantConnection = require("../models/CustomerTenant");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");

// Create a new tenant
exports.createCustomer = async (req, res) => {
  try {
    const token = req.cookies.jwtToken; // Assuming the JWT token is stored in a cookie
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "JWT token is missing." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    console.log(decoded);
    const {
      name,
      username,
      role,
      description,
      permissions,
      password,
      tenantId,
      databaseName,
    } = req.body;
    if (decoded.name !== databaseName) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient privileges." });
    }

    const dbUri = `mongodb://127.0.0.1:27017/${databaseName}`;
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a connection to the MongoDB server using the provided dbUri
    const mongooseConnection = mongoose.createConnection(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongooseConnection.on("connected", async () => {
      console.log("Connected to tenant database");
      const db = mongooseConnection.db;
      const customersCollection = db.collection("customers");
      // Store the hashed password
      const customerData = {
        name,
        username,
        password: hashedPassword,
        description,
        role,
        permissions,
        tenantId,
      };
      await customersCollection.insertOne(customerData);

      const customerTenantData = {
        customerId: customerData._id,
        tenantId: tenantId, // Assuming tenantId is the associated tenant's _id
        username,
        databaseName,
      };

      console.log(customerTenantData);

      const customerTenantConnection = mongoose.createConnection(
        `mongodb://127.0.0.1:27017/customerTenantDB`,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );

      customerTenantConnection.on("connected", async () => {
        console.log("Connected to CustomerTenant database");
        const customerTenantCollection =
          customerTenantConnection.collection("customerTenant");
        await customerTenantCollection.insertOne(customerTenantData);
      });

      // await CustomerTenant.create(customerTenantData);
      // Respond with a success message
      res
        .status(201)
        .json({
          message: "Customer and database connection created successfully",
        });
    });
    mongooseConnection.on("error", (err) => {
      console.error("Error creating customer DB connection:", err);
      res
        .status(500)
        .json({ message: "Error creating customer database connection" });
    });
    // Save the customer document
    //await Customer.create({ name, username, password: hashedPassword, description, role, permissions, databaseName, tenantId });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
///////////////////////////////////////
// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const token = req.cookies.jwtToken; // Assuming the JWT token is stored in a cookie
    // console.log(token);
    if (!token) {
      return res.status(401).json({ message: "JWT token is missing." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    //console.log(decoded);
    const { dbName } = req.params; // Assuming the database name is provided as a URL parameter
    if (!dbName) {
      return res.status(400).json({ message: "Database name is required." });
    }
    if (decoded.name !== dbName) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient privileges." });
    }

    const conn = mongoose.createConnection(
      `mongodb://127.0.0.1:27017/${dbName}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    const Customer = conn.model(
      "Customer",
      new mongoose.Schema({
        // Define your Customer schema here
      })
    );
    const customers = await Customer.find({});
    res.status(200).json(customers);
    // Don't forget to close the connection when done.
    conn.close();
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getCustomerByName = async (req, res) => {
  const username = req.params.username; // Access the module name from the URL

  try {
    const token = req.cookies.jwtToken; // Assuming the JWT token is stored in a cookie
    if (!token) {
      return res.status(401).json({ message: "JWT token is missing." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    console.log(decoded);

    // Check the user's role, e.g., superadmin, tenant, or customer
    if (decoded.isSuperadmin || decoded.isTenant) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient privileges." });
    }

    // If the user is a customer, continue to fetch data
    if (decoded.username === req.params.username) {
      const customerTenantConnection = mongoose.createConnection(
        `mongodb://127.0.0.1:27017/customerTenantDB`,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );

      customerTenantConnection.on("connected", async () => {
        console.log("Connected to CustomerTenant database");

        const customerTenantCollection =
          customerTenantConnection.collection("customerTenant");

        // Use a query object to match documents based on the 'username' field
        const query = { username: decoded.username };

        const databasenameEntry = await customerTenantCollection.findOne(query);

        if (databasenameEntry) {
          const databasename = databasenameEntry.databaseName;
          console.log("Found databasename:", databasename);

          // Create a connection to the user-specific database
          const conn = mongoose.createConnection(
            `mongodb://127.0.0.1:27017/${databasename}`,
            {
              useNewUrlParser: true,
              useUnifiedTopology: true,
            }
          );

          const Customer = conn.model(
            "Customer",
            new mongoose.Schema({
              // Define your Customer schema here
            })
          );
          const customers = await Customer.find({ username: decoded.username });
          res.status(200).json(customers);
          // Don't forget to close the connection when done.
          conn.close();
        } else {
          console.log("Data not found for the provided username.");
          res
            .status(404)
            .json({ message: "Data not found for the provided username." });
        }
      });
    } else {
      res
        .status(404)
        .json({ message: "Data not found for the provided username." });
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
