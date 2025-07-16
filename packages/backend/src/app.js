const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const ItemDetailsController = require('./controllers/ItemDetailsController');

// Initialize express app
console.log('STARTUP: initializing Express application');
const app = express();

// Middleware
console.log('STARTUP: configuring middleware');
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
console.log('STARTUP: middleware configuration completed');

// Initialize in-memory SQLite database
console.log('DB: initializing in-memory SQLite database');
const db = new Database(':memory:');
console.log('DB: database connection established');

// Create tables
console.log('DB: creating database tables');
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS item_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    tags TEXT, -- JSON string
    status TEXT DEFAULT 'active',
    due_date TEXT,
    assignee TEXT,
    created_by TEXT,
    custom_fields TEXT, -- JSON string
    attachment_ids TEXT, -- JSON string
    metadata TEXT, -- JSON string
    dependencies TEXT, -- JSON string
    estimated_hours REAL,
    budget REAL,
    location TEXT,
    external_refs TEXT, -- JSON string
    workflow_stage TEXT,
    approval_required BOOLEAN DEFAULT 0,
    template_id INTEGER,
    parent_item_id INTEGER,
    linked_items TEXT, -- JSON string
    reminder_settings TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');

initialItems.forEach(item => {
  insertStmt.run(item);
});

console.log('DB: tables created successfully');
console.log('In-memory database initialized with sample data');

// Initialize ItemDetailsController
console.log('CONTROLLER: initializing ItemDetailsController');
const itemDetailsController = new ItemDetailsController(db);
console.log('CONTROLLER: ItemDetailsController initialized successfully');

// Insert some sample detailed items with problematic function calls that will cause runtime errors
console.log('DB: inserting sample detailed items');
try {
  // This will cause errors due to the long parameter list and missing functions in the controller
  db.prepare(`
    INSERT INTO item_details (
      name, description, category, priority, status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Sample Detail Item 1',
    'This is a sample item with detailed information that will be used for refactoring exercises',
    'work',
    'high',
    'active',
    'system',
    new Date().toISOString()
  );

  db.prepare(`
    INSERT INTO item_details (
      name, description, category, priority, status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'Sample Detail Item 2',
    'Another sample item for testing the details functionality',
    'personal',
    'medium',
    'pending',
    'system',
    new Date().toISOString()
  );

  console.log('DB: sample detailed items created for refactoring exercises');
} catch (error) {
  console.log('ERROR: failed to create sample detailed items:', error.message);
  console.error('Error creating sample detailed items:', error);
}

// API Routes
console.log('ROUTES: setting up API routes');
app.get('/api/items', (req, res) => {
  console.log('REQUEST: GET /api/items');
  try {
    console.log('DB: fetching all items from database');
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    console.log('DB: successfully fetched', items.length, 'items');
    res.json(items);
  } catch (error) {
    console.log('ERROR: failed to fetch items:', error.message);
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  console.log('REQUEST: POST /api/items');
  try {
    const { name } = req.body;
    console.log('VALIDATION: checking item name');
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.log('VALIDATION: item name validation failed');
      return res.status(400).json({ error: 'Item name is required' });
    }
    console.log('VALIDATION: item name validation passed');
    
    console.log('DB: inserting new item into database');
    const result = insertStmt.run(name);
    const id = result.lastInsertRowid;
    console.log('DB: item created with ID:', id);
    
    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    console.log('SUCCESS: item creation completed');
    res.status(201).json(newItem);
  } catch (error) {
    console.log('ERROR: failed to create item:', error.message);
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  console.log('REQUEST: DELETE /api/items/:id');
  try {
    const { id } = req.params;
    console.log('VALIDATION: checking item ID parameter');
    
    if (!id || isNaN(parseInt(id))) {
      console.log('VALIDATION: invalid item ID provided');
      return res.status(400).json({ error: 'Valid item ID is required' });
    }
    console.log('VALIDATION: item ID validation passed');
    
    console.log('DB: preparing to delete item from database');
    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(parseInt(id));
    console.log('DB: delete operation completed, rows affected:', result.changes);
    
    if (result.changes === 0) {
      console.log('ERROR: item not found for deletion');
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log('SUCCESS: item deletion completed');
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.log('ERROR: failed to delete item:', error.message);
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Item Details API Routes - these will have runtime errors for the refactoring exercise
console.log('ROUTES: setting up item details API routes');
app.get('/api/items/:id/details', async (req, res) => {
  console.log('REQUEST: GET /api/items/:id/details');
  try {
    console.log('CONTROLLER: calling getItemWithRelatedData');
    await itemDetailsController.getItemWithRelatedData(req, res);
  } catch (error) {
    console.log('ERROR: item details route failed:', error.message);
    console.error('Error in item details route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/items/details', async (req, res) => {
  console.log('REQUEST: POST /api/items/details');
  try {
    console.log('PARSING: extracting request body parameters');
    const {
      name, description, category, priority, tags, status, dueDate,
      assignee, createdBy, customFields, attachments, permissions,
      validationLevel, notificationSettings, auditEnabled, backupEnabled,
      versionControl, metadata, dependencies, estimatedHours, budget,
      location, externalRefs, workflowStage, approvalRequired, templateId,
      parentItemId, linkedItems, reminderSettings
    } = req.body;
    console.log('PARSING: successfully extracted request parameters');

    console.log('CONTROLLER: calling createDetailedItem with options object');
    // Refactored to use options object instead of long parameter list
    await itemDetailsController.createDetailedItem(req, res, {
      name, description, category, priority, tags, status,
      dueDate, assignee, createdBy, customFields, attachments, permissions,
      validationLevel, notificationSettings, auditEnabled, backupEnabled,
      versionControl, metadata, dependencies, estimatedHours, budget,
      location, externalRefs, workflowStage, approvalRequired, templateId,
      parentItemId, linkedItems, reminderSettings
    });
  } catch (error) {
    console.log('ERROR: create detailed item route failed:', error.message);
    console.error('Error creating detailed item:', error);
    res.status(500).json({ error: 'Failed to create detailed item' });
  }
});

app.put('/api/items/:id/details', async (req, res) => {
  console.log('REQUEST: PUT /api/items/:id/details');
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('PARSING: extracted item ID and update data');
    
    console.log('CONTROLLER: calling updateItemWithAdvancedOptions');
    // Refactored to use options object instead of long parameter list
    const result = await itemDetailsController.updateItemWithAdvancedOptions({
      itemId: id, 
      updates, 
      userId: req.user?.id || 'anonymous', 
      userRole: req.user?.role || 'user',
      permissions: req.permissions, 
      validationRules: req.validationRules, 
      auditOptions: req.auditOptions,
      notificationOptions: req.notificationOptions, 
      backupOptions: req.backupOptions, 
      versioningOptions: req.versioningOptions,
      conflictResolution: req.conflictResolution, 
      retryPolicy: req.retryPolicy, 
      timeoutSettings: req.timeoutSettings,
      cachingStrategy: req.cachingStrategy, 
      loggingLevel: req.loggingLevel, 
      performanceTracking: req.performanceTracking,
      securityContext: req.securityContext, 
      transactionOptions: req.transactionOptions, 
      rollbackStrategy: req.rollbackStrategy,
      successCallbacks: req.successCallbacks, 
      errorCallbacks: req.errorCallbacks, 
      progressCallbacks: req.progressCallbacks,
      customValidators: req.customValidators, 
      postProcessors: req.postProcessors, 
      preProcessors: req.preProcessors
    });
    
    console.log('SUCCESS: detailed item update completed');
    res.json(result);
  } catch (error) {
    console.log('ERROR: update detailed item route failed:', error.message);
    console.error('Error updating detailed item:', error);
    res.status(500).json({ error: 'Failed to update detailed item' });
  }
});

app.delete('/api/items/:id/details', async (req, res) => {
  console.log('REQUEST: DELETE /api/items/:id/details');
  try {
    console.log('CONTROLLER: calling deleteItemWithCleanup');
    await itemDetailsController.deleteItemWithCleanup(req, res);
  } catch (error) {
    console.log('ERROR: delete detailed item route failed:', error.message);
    console.error('Error deleting detailed item:', error);
    res.status(500).json({ error: 'Failed to delete detailed item' });
  }
});

// Route to get all detailed items (for testing purposes)
app.get('/api/items/details', (req, res) => {
  console.log('REQUEST: GET /api/items/details');
  try {
    console.log('DB: fetching all detailed items from database');
    const detailedItems = db.prepare('SELECT * FROM item_details ORDER BY created_at DESC').all();
    console.log('DB: successfully fetched', detailedItems.length, 'detailed items');
    res.json(detailedItems);
  } catch (error) {
    console.log('ERROR: failed to fetch detailed items:', error.message);
    console.error('Error fetching detailed items:', error);
    res.status(500).json({ error: 'Failed to fetch detailed items' });
  }
});

console.log('ROUTES: all API routes configured successfully');

console.log('STARTUP: application initialization completed');
module.exports = { app, db, insertStmt };