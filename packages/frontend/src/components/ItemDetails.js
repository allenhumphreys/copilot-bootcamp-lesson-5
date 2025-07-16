import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';

// Utility functions to implement missing functionality for ItemDetails
const fetchItemDetails = async (itemId) => {
  console.log('UTILITY: fetchItemDetails called for item:', itemId);
  try {
    const response = await fetch(`/api/items/${itemId}/details`);
    if (!response.ok) {
      throw new Error('Failed to fetch item details');
    }
    const itemDetails = await response.json();
    console.log('UTILITY: item details fetched successfully');
    return itemDetails;
  } catch (error) {
    console.log('ERROR: fetchItemDetails failed:', error.message);
    throw error;
  }
};

const validateDate = (dateString) => {
  console.log('UTILITY: validateDate called');
  if (!dateString) {
    return false;
  }
  
  const date = new Date(dateString);
  const isValidDate = !isNaN(date.getTime());
  
  if (!isValidDate) {
    console.log('VALIDATION: invalid date format');
    return false;
  }
  
  // Check if date is not in the past (for due dates)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    console.log('VALIDATION: date cannot be in the past');
    return false;
  }
  
  console.log('VALIDATION: date validation passed');
  return true;
};

const processBulkUpdate = async (itemData, userId, permissions) => {
  console.log('UTILITY: processBulkUpdate called');
  try {
    // Validate permissions for bulk operations
    if (!permissions || !permissions.includes('bulk_update')) {
      throw new Error('Insufficient permissions for bulk update');
    }
    
    // Process bulk update logic
    const bulkResult = {
      itemData,
      userId,
      processedAt: new Date().toISOString(),
      type: 'bulk_update'
    };
    
    console.log('UTILITY: bulk update processed successfully');
    return bulkResult;
  } catch (error) {
    console.log('ERROR: processBulkUpdate failed:', error.message);
    throw error;
  }
};

const processSingleUpdate = async (itemData, userId, timestamp) => {
  console.log('UTILITY: processSingleUpdate called');
  try {
    const singleResult = {
      itemData,
      userId,
      timestamp,
      processedAt: new Date().toISOString(),
      type: 'single_update'
    };
    
    console.log('UTILITY: single update processed successfully');
    return singleResult;
  } catch (error) {
    console.log('ERROR: processSingleUpdate failed:', error.message);
    throw error;
  }
};

const processGenericUpdate = async (itemData) => {
  console.log('UTILITY: processGenericUpdate called');
  try {
    const genericResult = {
      itemData,
      processedAt: new Date().toISOString(),
      type: 'generic_update'
    };
    
    console.log('UTILITY: generic update processed successfully');
    return genericResult;
  } catch (error) {
    console.log('ERROR: processGenericUpdate failed:', error.message);
    throw error;
  }
};

const formatDateTime = (date, format) => {
  console.log('UTILITY: formatDateTime called with format:', format);
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Handle different format patterns
    switch (format) {
      case 'yyyy-MM-dd HH:mm':
        return dateObj.toISOString().slice(0, 16).replace('T', ' ');
      case 'MM/dd/yyyy':
        return dateObj.toLocaleDateString('en-US');
      case 'dd/MM/yyyy':
        return dateObj.toLocaleDateString('en-GB');
      default:
        return dateObj.toLocaleString();
    }
  } catch (error) {
    console.log('ERROR: formatDateTime failed:', error.message);
    return 'Invalid date';
  }
};

const handleNotificationToggle = (enabled) => {
  console.log('UTILITY: handleNotificationToggle called with enabled:', enabled);
  try {
    // Save notification preference
    const currentPrefs = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
    currentPrefs.enabled = enabled;
    currentPrefs.updatedAt = new Date().toISOString();
    
    localStorage.setItem('notificationPreferences', JSON.stringify(currentPrefs));
    console.log('UTILITY: notification preference updated successfully');
    return true;
  } catch (error) {
    console.log('ERROR: handleNotificationToggle failed:', error.message);
    return false;
  }
};

const handleAutoSaveToggle = (enabled) => {
  console.log('UTILITY: handleAutoSaveToggle called with enabled:', enabled);
  try {
    // Save auto-save preference
    const currentPrefs = JSON.parse(localStorage.getItem('autoSavePreferences') || '{}');
    currentPrefs.enabled = enabled;
    currentPrefs.updatedAt = new Date().toISOString();
    
    localStorage.setItem('autoSavePreferences', JSON.stringify(currentPrefs));
    console.log('UTILITY: auto-save preference updated successfully');
    return true;
  } catch (error) {
    console.log('ERROR: handleAutoSaveToggle failed:', error.message);
    return false;
  }
};

/**
 * ItemDetails component for managing detailed item information
 * This component has several issues that need refactoring:
 * - Long parameter lists
 * - Missing error handling and logging
 * - Dead code
 * - Runtime errors
 */
function ItemDetails({ 
  open, 
  onClose, 
  itemId, 
  itemName,
  itemDescription,
  itemCategory,
  itemPriority,
  itemTags,
  itemStatus,
  itemDueDate,
  itemAssignee,
  itemCreatedBy,
  itemCreatedAt,
  itemUpdatedAt,
  showAdvanced,
  enableNotifications,
  autoSave,
  readOnly,
  onSave,
  onDelete,
  onUpdate,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onTagsChange,
  onAssigneeChange,
  onDueDateChange,
  onDescriptionChange,
  onNameChange,
  allowEdit,
  allowDelete,
  showHistory,
  historyData,
  validationRules,
  customFields,
  permissions
}) {
  const [localName, setLocalName] = useState(itemName || '');
  const [localDescription, setLocalDescription] = useState(itemDescription || '');
  const [localCategory, setLocalCategory] = useState(itemCategory || '');
  const [localPriority, setLocalPriority] = useState(itemPriority || 'medium');
  const [localTags, setLocalTags] = useState(itemTags || []);
  const [localStatus, setLocalStatus] = useState(itemStatus || 'active');
  const [localDueDate, setLocalDueDate] = useState(itemDueDate || '');
  const [localAssignee, setLocalAssignee] = useState(itemAssignee || '');
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Dead code - unused variables and functions
  const unusedVariable = 'This is never used';
  const anotherUnusedVar = { data: 'unused', count: 0 };
  
  function deadFunction() {
    console.log('This function is never called');
    return false;
  }
  
  function anotherDeadFunction(param1, param2, param3) {
    // This function exists but is never used
    const result = param1 + param2 + param3;
    return result * 2;
  }

  // This useEffect has a bug - missing dependency
  useEffect(() => {
    console.log('ENTRY: useEffect called for itemId:', itemId ? '[REDACTED]' : 'null');
    if (itemId) {
      console.log('FLOW: attempting to fetch item details');
      // This will cause a runtime error because fetchItemDetails is not defined
      fetchItemDetails(itemId);
    }
  }, [itemId]);

  // Missing error handling and logging in this function
  const handleSave = () => {
    console.log('ENTRY: handleSave called');
    console.log('STATE: isDirty:', isDirty, 'isValid:', isValid);
    // No validation or error handling
    const updatedItem = {
      id: itemId,
      name: localName,
      description: localDescription,
      category: localCategory,
      priority: localPriority,
      tags: localTags,
      status: localStatus,
      dueDate: localDueDate,
      assignee: localAssignee
    };
    
    console.log('FLOW: calling onSave with item data');
    // This might fail but no error handling
    onSave(updatedItem);
    console.log('STATE: setting isDirty to false');
    setIsDirty(false);
  };

  // Function with long parameter list that should be refactored
  const validateAndUpdateItem = (
    name,
    description, 
    category,
    priority,
    tags,
    status,
    dueDate,
    assignee,
    createdBy,
    permissions,
    validationRules,
    customFields,
    showAdvanced,
    enableNotifications,
    autoSave,
    readOnly,
    allowEdit,
    allowDelete
  ) => {
    console.log('ENTRY: validateAndUpdateItem called with', Object.keys(arguments).length, 'parameters');
    console.log('VALIDATION: starting validation process');
    let valid = true;
    const newErrors = {};

    if (!name || name.trim().length === 0) {
      console.log('VALIDATION: name validation failed');
      valid = false;
      newErrors.name = 'Name is required';
    }

    if (category && !['work', 'personal', 'urgent'].includes(category)) {
      console.log('VALIDATION: category validation failed');
      valid = false;
      newErrors.category = 'Invalid category';
    }

    // This will cause a runtime error - undefined method
    if (dueDate) {
      console.log('VALIDATION: attempting date validation');
      if (!validateDate(dueDate)) {
        console.log('VALIDATION: date validation failed');
        valid = false;
        newErrors.dueDate = 'Invalid due date';
      }
    }

    console.log('VALIDATION: validation complete, valid:', valid, 'error count:', Object.keys(newErrors).length);
    setErrors(newErrors);
    setIsValid(valid);
    return valid;
  };

  // Another function with too many parameters
  const processItemUpdate = (
    itemData,
    updateType,
    timestamp,
    userId,
    userRole,
    permissions,
    validationLevel,
    notificationSettings,
    auditEnabled,
    backupEnabled,
    versionControl,
    conflictResolution,
    retryCount,
    timeout,
    batchMode,
    asyncMode
  ) => {
    console.log('ENTRY: processItemUpdate called with update type:', updateType);
    console.log('FLOW: processing item update with', Object.keys(arguments).length, 'parameters');
    if (updateType === 'bulk') {
      console.log('FLOW: processing bulk update');
      // Process bulk update
      return processBulkUpdate(itemData, userId, permissions);
    } else if (updateType === 'single') {
      console.log('FLOW: processing single update');
      // Process single update
      return processSingleUpdate(itemData, userId, timestamp);
    }
    
    console.log('FLOW: falling back to generic update processing');
    // This will cause an error because these functions don't exist
    return processGenericUpdate(itemData);
  };

  // Dead code - unused event handlers
  const handleUnusedClick = () => {
    console.log('This handler is never attached to any element');
  };

  const handleAnotherUnusedEvent = (event) => {
    event.preventDefault();
    // More unused code
    return false;
  };

  const handleInputChange = (field, value) => {
    console.log('ENTRY: handleInputChange called for field:', field);
    console.log('STATE: setting isDirty to true');
    setIsDirty(true);
    
    switch (field) {
      case 'name':
        console.log('FIELD: updating name field');
        setLocalName(value);
        console.log('CALLBACK: calling onNameChange');
        onNameChange(value);
        break;
      case 'description':
        console.log('FIELD: updating description field');
        setLocalDescription(value);
        console.log('CALLBACK: calling onDescriptionChange');
        onDescriptionChange(value);
        break;
      case 'category':
        setLocalCategory(value);
        onCategoryChange(value);
        break;
      case 'priority':
        setLocalPriority(value);
        onPriorityChange(value);
        break;
      case 'status':
        setLocalStatus(value);
        onStatusChange(value);
        break;
      case 'dueDate':
        setLocalDueDate(value);
        onDueDateChange(value);
        break;
      case 'assignee':
        setLocalAssignee(value);
        onAssigneeChange(value);
        break;
      default:
        console.log('WARNING: unhandled field type:', field);
        break;
    }
  };

  // This will cause a runtime error because formatDateTime is not defined
  const formatCreatedDate = (date) => {
    console.log('ENTRY: formatCreatedDate called');
    console.log('FORMAT: attempting to format date');
    return formatDateTime(date, 'yyyy-MM-dd HH:mm');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {itemId ? 'Edit Item Details' : 'New Item Details'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={localName}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={localCategory}
                  label="Category"
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={localDescription}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={localPriority}
                  label="Priority"
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={localStatus}
                  label="Status"
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={localDueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assignee"
                value={localAssignee}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                disabled={readOnly}
              />
            </Grid>
            
            {showAdvanced && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Advanced Options
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableNotifications}
                        onChange={(e) => {
                          console.log('EVENT: notification toggle changed');
                          // Missing function call - this will cause an error
                          handleNotificationToggle(e.target.checked);
                        }}
                      />
                    }
                    label="Enable Notifications"
                    disabled={readOnly}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoSave}
                        onChange={(e) => {
                          console.log('EVENT: auto save toggle changed');
                          // Missing function - will cause runtime error
                          handleAutoSaveToggle(e.target.checked);
                        }}
                      />
                    }
                    label="Auto Save"
                    disabled={readOnly}
                  />
                </Grid>
              </>
            )}
            
            {itemCreatedAt && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {/* This will cause an error because formatCreatedDate calls undefined function */}
                  Created: {formatCreatedDate(itemCreatedAt)} by {itemCreatedBy}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        {allowEdit && !readOnly && (
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!isValid || !isDirty}
          >
            Save Changes
          </Button>
        )}
        {allowDelete && (
          <Button 
            onClick={() => {
              console.log('EVENT: delete button clicked for item');
              console.log('WARNING: no confirmation dialog implemented');
              // Missing confirmation dialog - this could accidentally delete items
              onDelete(itemId);
            }} 
            color="error"
          >
            Delete
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ItemDetails;
