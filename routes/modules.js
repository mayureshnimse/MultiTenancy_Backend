// backend/routes/modules.js

const express = require("express");
const router = express.Router();
const modulesController = require("../controllers/modules");
const permissionController = require("../controllers/permission");

const checkRole = require("../middleware/checkRole"); // Assuming you have a role-based middleware

// Create a new module (only accessible to superadmins)
router.post(
  "/create",
  checkRole(["superadmin"]),
  modulesController.createModule
);

// Get all modules (accessible to users with specific roles, adjust roles as needed)
router.get("/", modulesController.getAllModules);

// Add more routes for updating, deleting, and other module-related operations as needed.
router.get(
  "/:moduleId",
  checkRole(["superadmin"]),
  modulesController.getModuleById
);

// route to delete module
router.delete(
  "/:moduleId",
  checkRole(["superadmin"]),
  modulesController.deleteModule
);

//  route to update module
router.put(
  "/:moduleId",
  checkRole(["superadmin"]),
  modulesController.updateModule
);

//permission
router.post(
  "/permission",
  checkRole(["superadmin"]),
  permissionController.grantPermission
);

module.exports = router;
