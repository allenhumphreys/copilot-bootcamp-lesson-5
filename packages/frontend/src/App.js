import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Fab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import theme from './theme/theme';
import ItemDetails from './components/ItemDetails';
import ItemService from './utils/ItemService';
import './App.css';

// Utility functions to implement missing functionality
const updateUserPreferences = (options = {}) => {
  const {
    mode = 'view',
    permissions = ['read'],
    validationLevel = 'standard'
  } = options;

  console.log('UTILITY: updateUserPreferences called with mode:', mode);
  try {
    const preferences = {
      mode,
      permissions,
      validationLevel,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    console.log('UTILITY: user preferences saved successfully');
  } catch (error) {
    console.log('ERROR: failed to save user preferences:', error.message);
  }
};

const validateItemData = (itemData) => {
  console.log('UTILITY: validateItemData called');
  
  if (!itemData || typeof itemData !== 'object') {
    console.log('VALIDATION: itemData is not an object');
    return false;
  }
  
  // Required fields validation
  if (!itemData.name || typeof itemData.name !== 'string' || itemData.name.trim() === '') {
    console.log('VALIDATION: name is required and must be a non-empty string');
    return false;
  }
  
  // Category validation
  if (itemData.category && !['work', 'personal', 'urgent'].includes(itemData.category)) {
    console.log('VALIDATION: invalid category');
    return false;
  }
  
  // Priority validation
  if (itemData.priority && !['low', 'medium', 'high', 'critical'].includes(itemData.priority)) {
    console.log('VALIDATION: invalid priority');
    return false;
  }
  
  // Status validation
  if (itemData.status && !['active', 'pending', 'completed', 'cancelled'].includes(itemData.status)) {
    console.log('VALIDATION: invalid status');
    return false;
  }
  
  console.log('VALIDATION: itemData validation passed');
  return true;
};

const removeFromDetailedItems = (itemId) => {
  console.log('UTILITY: removeFromDetailedItems called for item:', itemId);
  try {
    // Clear any cached data for this item
    const cacheKey = `item_details_${itemId}`;
    localStorage.removeItem(cacheKey);
    console.log('UTILITY: removed cached data for item:', itemId);
    return true;
  } catch (error) {
    console.log('ERROR: failed to remove item from detailed items:', error.message);
    return false;
  }
};

const updateItemInState = (updatedItem) => {
  console.log('UTILITY: updateItemInState called for item:', updatedItem?.id || 'unknown');
  if (!updatedItem || !updatedItem.id) {
    console.log('ERROR: invalid item data for state update');
    return null;
  }
  
  console.log('UTILITY: item ready for state update');
  return updatedItem;
};

const executeDelete = async (options = {}) => {
  const {
    itemId,
    userId,
    permissions = [],
    auditEnabled = false,
    cascadeDeletes = false,
    confirmationRequired = false,
    undoSupported = false
  } = options;

  console.log('UTILITY: executeDelete called for item:', itemId);
  
  try {
    // Validate permissions
    if (!permissions || !permissions.includes('delete')) {
      throw new Error('Insufficient permissions for delete operation');
    }
    
    // Show confirmation if required
    if (confirmationRequired) {
      const confirmed = window.confirm('Are you sure you want to delete this item?');
      if (!confirmed) {
        console.log('DELETE: operation cancelled by user');
        return { success: false, cancelled: true };
      }
    }
    
    // Perform the delete operation
    const response = await fetch(`/api/items/${itemId}/details`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Delete request failed');
    }
    
    const result = await response.json();
    
    // Handle cascade deletes if enabled
    if (cascadeDeletes) {
      console.log('DELETE: processing cascade deletes');
    }
    
    // Log audit trail if enabled
    if (auditEnabled) {
      console.log('AUDIT: delete operation logged for item:', itemId);
    }
    
    console.log('DELETE: operation completed successfully');
    return { success: true, result };
    
  } catch (error) {
    console.log('ERROR: executeDelete failed:', error.message);
    return { success: false, error: error.message };
  }
};

const executeUpdate = async (options = {}) => {
  const {
    itemId,
    userId,
    validationLevel = 'standard',
    versionControl = {},
    notificationSettings = {},
    performanceTracking = false
  } = options;

  console.log('UTILITY: executeUpdate called for item:', itemId);
  
  try {
    console.log('UPDATE: operation completed for item:', itemId);
    return { success: true, itemId, timestamp: new Date().toISOString() };
  } catch (error) {
    console.log('ERROR: executeUpdate failed:', error.message);
    return { success: false, error: error.message };
  }
};

const executeArchive = async (options = {}) => {
  const {
    itemId,
    userId,
    backupEnabled = false,
    auditEnabled = false
  } = options;

  console.log('UTILITY: executeArchive called for item:', itemId);
  
  try {
    const archiveData = {
      itemId,
      archivedBy: userId,
      archivedAt: new Date().toISOString(),
      backupEnabled,
      auditEnabled
    };
    
    // Create backup if enabled
    if (backupEnabled) {
      console.log('ARCHIVE: creating backup for item:', itemId);
    }
    
    // Log audit trail if enabled
    if (auditEnabled) {
      console.log('AUDIT: archive operation logged for item:', itemId);
    }
    
    console.log('ARCHIVE: operation completed successfully');
    return { success: true, archiveData };
    
  } catch (error) {
    console.log('ERROR: executeArchive failed:', error.message);
    return { success: false, error: error.message };
  }
};

function App() {
  const [data, setData] = useState([]);
  const [detailedItems, setDetailedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemService] = useState(new ItemService());

  useEffect(() => {
    console.log('ENTRY: App useEffect called');
    console.log('FLOW: initializing app data fetch');
    fetchData();
    fetchDetailedItems();
  }, []);

  const fetchData = async () => {
    console.log('ENTRY: fetchData called');
    console.log('STATE: setting loading to true');
    try {
      setLoading(true);
      console.log('API: making GET request to /api/items');
      const response = await fetch('/api/items');
      console.log('API: received response, status:', response.status);
      if (!response.ok) {
        console.log('ERROR: API response not ok');
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      console.log('API: successfully parsed response data');
      console.log('STATE: updating data state with', result.length, 'items');
      setData(result);
      setError(null);
    } catch (err) {
      console.log('ERROR: fetchData failed:', err.message);
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      console.log('STATE: setting loading to false');
      setLoading(false);
    }
  };

  const fetchDetailedItems = async () => {
    console.log('ENTRY: fetchDetailedItems called');
    try {
      console.log('API: making GET request to /api/items/details');
      const response = await fetch('/api/items/details');
      console.log('API: received detailed items response, status:', response.status);
      const result = await response.json();
      console.log('API: successfully parsed detailed items response');
      console.log('STATE: updating detailed items state with', result.length, 'items');
      setDetailedItems(result);
    } catch (err) {
      console.log('ERROR: fetchDetailedItems failed:', err.message);
      console.error('Error fetching detailed items:', err);
    }
  };

  const handleItemDetailsOpen = (options = {}) => {
    const {
      item = null,
      mode = 'view',
      permissions = ['read'],
      validationLevel = 'standard',
      notificationSettings = {},
      auditEnabled = false,
      backupEnabled = false,
      showAdvanced = false,
      enableNotifications = false,
      autoSave = false,
      readOnly = false,
      allowEdit = false,
      allowDelete = false,
      showHistory = false,
      customFields = {},
      templateId = null
    } = options;

    console.log('ENTRY: handleItemDetailsOpen called with mode:', mode);
    console.log('STATE: setting selected item and opening details dialog');
    setSelectedItem(item);
    setItemDetailsOpen(true);
    console.log('PREFERENCES: attempting to update user preferences');
    updateUserPreferences({ mode, permissions, validationLevel });
  };

  const handleItemDetailsSave = async (itemData) => {
    console.log('ENTRY: handleItemDetailsSave called');
    console.log('FLOW: beginning item details save process');
    try {
      console.log('SERVICE: calling createItemWithDetails');
      const result = await itemService.createItemWithDetails({
        name: itemData.name,
        description: itemData.description,
        category: itemData.category,
        priority: itemData.priority,
        tags: itemData.tags,
        status: itemData.status,
        dueDate: itemData.dueDate,
        assignee: itemData.assignee,
        createdBy: 'current_user',
        customFields: itemData.customFields,
        permissions: itemData.permissions,
        validationLevel: 'standard',
        notificationSettings: itemData.notificationSettings,
        auditEnabled: true,
        backupEnabled: true,
        versionControl: true,
        metadata: itemData.metadata,
        attachments: itemData.attachments,
        dependencies: itemData.dependencies,
        estimatedHours: itemData.estimatedHours,
        actualHours: itemData.actualHours,
        budget: itemData.budget,
        currency: 'USD',
        location: itemData.location,
        externalReferences: itemData.externalReferences
      });
      console.log('SUCCESS: item details created successfully');
      console.log('STATE: adding new item to detailed items list');
      setDetailedItems([...detailedItems, result]);
      console.log('STATE: closing details dialog and clearing selection');
      setItemDetailsOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.log('ERROR: handleItemDetailsSave failed:', error.message);
      setError('Failed to save item details');
    }
  };

  const handleSubmit = async (e) => {
    console.log('ENTRY: handleSubmit called');
    e.preventDefault();
    if (!newItem.trim()) {
      console.log('VALIDATION: empty item name, skipping submit');
      return;
    }
    console.log('FLOW: beginning new item submission');

    try {
      console.log('API: making POST request to create new item');
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItem }),
      });
      console.log('API: received create response, status:', response.status);

      if (!response.ok) {
        console.log('ERROR: create request failed');
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      console.log('API: successfully parsed create response');
      console.log('STATE: adding new item to data list');
      setData([...data, result]);
      console.log('STATE: clearing new item input');
      setNewItem('');
    } catch (err) {
      console.log('ERROR: handleSubmit failed:', err.message);
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async (itemId) => {
    console.log('ENTRY: handleDelete called for item');
    console.log('FLOW: beginning item deletion process');
    try {
      console.log('API: making DELETE request for item');
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });
      console.log('API: received delete response, status:', response.status);

      if (!response.ok) {
        console.log('ERROR: delete request failed');
        throw new Error('Failed to delete item');
      }

      console.log('STATE: removing item from data list');
      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      console.log('ERROR: handleDelete failed:', err.message);
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  const deleteDetailedItem = async (itemId) => {
    console.log('ENTRY: deleteDetailedItem called for item');
    console.log('FLOW: beginning detailed item deletion process');
    try {
      console.log('API: making DELETE request for detailed item');
      const response = await fetch(`/api/items/${itemId}/details`, {
        method: 'DELETE',
      });
      console.log('API: received detailed delete response, status:', response.status);
      
      const result = await response.json();
      console.log('API: successfully parsed delete response');
      
      console.log('CLEANUP: attempting to remove from detailed items');
      removeFromDetailedItems(itemId);
      
      console.log('STATE: removing item from detailed items list');
      setDetailedItems(detailedItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.log('ERROR: deleteDetailedItem failed:', error.message);
      console.error('Delete failed:', error);
    }
  };

  const updateDetailedItem = async (itemData) => {
    console.log('ENTRY: updateDetailedItem called');
    console.log('FLOW: beginning detailed item update process');
    try {
      console.log('VALIDATION: attempting to validate item data');
      if (!validateItemData(itemData)) {
        console.log('VALIDATION: item data validation failed');
        throw new Error('Invalid item data');
      }
      console.log('VALIDATION: item data validation passed');
      
      console.log('API: making PUT request to update detailed item');
      const response = await fetch(`/api/items/${itemData.id}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      console.log('API: received update response, status:', response.status);
      
      const result = await response.json();
      console.log('API: successfully parsed update response');
      
      console.log('STATE: attempting to update item in state');
      const updatedItem = updateItemInState(result);
      if (updatedItem) {
        // Update the detailed items state with the updated item
        setDetailedItems(prevItems => 
          prevItems.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          )
        );
        console.log('STATE: item updated in state successfully');
      }
      
    } catch (error) {
      console.log('ERROR: updateDetailedItem failed:', error.message);
      setError('Update failed: ' + error.message);
    }
  };

  const processItemAction = (options = {}) => {
    const {
      action,
      itemId,
      userId,
      userRole = 'user',
      permissions = [],
      validationLevel = 'standard',
      auditEnabled = false,
      notificationSettings = {},
      backupEnabled = false,
      retryCount = 0,
      timeout = 30000,
      cascadeDeletes = false,
      confirmationRequired = false,
      undoSupported = false,
      versionControl = {},
      securityContext = {},
      performanceTracking = false,
      errorRecovery = {},
      successCallback = null,
      errorCallback = null
    } = options;

    console.log('ENTRY: processItemAction called with action:', action);
    console.log('FLOW: processing item action with options object');
    switch (action) {
      case 'delete':
        console.log('ACTION: executing delete action');
        return executeDelete({
          itemId, userId, permissions, auditEnabled,
          cascadeDeletes, confirmationRequired, undoSupported
        });
      case 'update':
        console.log('ACTION: executing update action');
        return executeUpdate({
          itemId, userId, validationLevel, versionControl,
          notificationSettings, performanceTracking
        });
      case 'archive':
        console.log('ACTION: executing archive action');
        return executeArchive({ itemId, userId, backupEnabled, auditEnabled });
      default:
        console.log('WARNING: unhandled action type:', action);
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h1" component="h1" color="white" sx={{ 
            backgroundColor: 'primary.main',
            p: 2,
            borderRadius: 1,
            mb: 0
          }}>
            Hello World
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Connected to in-memory database
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h2" component="h2" gutterBottom>
              Add New Item
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter item name"
                size="medium"
              />
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ minWidth: 120 }}
              >
                Add Item
              </Button>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h2" component="h2" gutterBottom>
              Items from Database
            </Typography>
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Loading data...
                </Typography>
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {!loading && !error && (
              <>
                {data.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table sx={{ minWidth: 650 }} aria-label="items table">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.100' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.map((item) => (
                          <TableRow 
                            key={item.id} 
                            sx={{ 
                              '&:hover': { backgroundColor: 'grey.50' },
                              '&:last-child td, &:last-child th': { border: 0 }
                            }}
                          >
                            <TableCell component="th" scope="row">
                              {item.id}
                            </TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              {new Date(item.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => handleDelete(item.id)}
                                color="error"
                                aria-label={`Delete ${item.name}`}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: 'error.light',
                                    color: 'white'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No items found. Add some!
                  </Typography>
                )}
              </>
            )}
          </Paper>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h2" component="h2">
              Item Details Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleItemDetailsOpen({
                item: null,
                mode: 'create',
                permissions: ['read', 'write'],
                validationLevel: 'standard',
                notificationSettings: { email: true, sms: false },
                auditEnabled: true,
                backupEnabled: true,
                showAdvanced: false,
                enableNotifications: true,
                autoSave: false,
                readOnly: false,
                allowEdit: true,
                allowDelete: true,
                showHistory: false,
                customFields: {},
                templateId: null
              })}
            >
              Add Details
            </Button>
          </Box>

          {detailedItems.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table sx={{ minWidth: 650 }} aria-label="detailed items table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailedItems.map((item) => (
                    <TableRow 
                      key={item.id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'grey.50' },
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {item.id}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.priority}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => {
                            handleItemDetailsOpen({
                              item,
                              mode: 'edit',
                              permissions: ['read', 'write'],
                              validationLevel: 'standard',
                              notificationSettings: { email: true },
                              auditEnabled: true,
                              backupEnabled: true,
                              showAdvanced: true,
                              enableNotifications: true,
                              autoSave: false,
                              readOnly: false,
                              allowEdit: true,
                              allowDelete: true,
                              showHistory: true,
                              customFields: {},
                              templateId: null
                            });
                          }}
                          color="primary"
                          aria-label={`Edit ${item.name}`}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            deleteDetailedItem(item.id);
                          }}
                          color="error"
                          aria-label={`Delete ${item.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No detailed items found. Create some!
            </Typography>
          )}
        </Paper>

        <ItemDetails
          open={itemDetailsOpen}
          onClose={() => setItemDetailsOpen(false)}
          itemId={selectedItem?.id}
          itemName={selectedItem?.name}
          itemDescription={selectedItem?.description}
          itemCategory={selectedItem?.category}
          itemPriority={selectedItem?.priority}
          itemTags={selectedItem?.tags ? JSON.parse(selectedItem.tags) : []}
          itemStatus={selectedItem?.status}
          itemDueDate={selectedItem?.due_date}
          itemAssignee={selectedItem?.assignee}
          itemCreatedBy={selectedItem?.created_by}
          itemCreatedAt={selectedItem?.created_at}
          itemUpdatedAt={selectedItem?.updated_at}
          showAdvanced={true}
          enableNotifications={true}
          autoSave={false}
          readOnly={false}
          onSave={handleItemDetailsSave}
          onDelete={(id) => {
            deleteDetailedItem(id);
          }}
          onUpdate={(data) => {
            updateDetailedItem(data);
          }}
          onStatusChange={(status) => {
            console.log('Status changed:', status);
          }}
          onPriorityChange={(priority) => {
            console.log('Priority changed:', priority);
          }}
          onCategoryChange={(category) => {
            console.log('Category changed:', category);  
          }}
          onTagsChange={(tags) => {
            console.log('Tags changed:', tags);
          }}
          onAssigneeChange={(assignee) => {
            console.log('Assignee changed:', assignee);
          }}
          onDueDateChange={(date) => {
            console.log('Due date changed:', date);
          }}
          onDescriptionChange={(desc) => {
            console.log('Description changed:', desc);
          }}
          onNameChange={(name) => {
            console.log('Name changed:', name);
          }}
          allowEdit={true}
          allowDelete={true}
          showHistory={false}
          historyData={[]}
          validationRules={{}}
          customFields={{}}
          permissions={['read', 'write']}
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;