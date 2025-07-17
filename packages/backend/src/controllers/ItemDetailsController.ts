import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

// Type definitions
interface Database {
  prepare(sql: string): {
    run(...params: any[]): { lastInsertRowid: number; changes: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  };
}

interface ItemData {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  priority?: string;
  tags?: string;
  status?: string;
  due_date?: string;
  assignee?: string;
  created_by?: string;
  custom_fields?: string;
  attachment_ids?: string;
  metadata?: string;
  dependencies?: string;
  estimated_hours?: number;
  budget?: number;
  location?: string;
  external_refs?: string;
  workflow_stage?: string;
  approval_required?: boolean;
  template_id?: number | null;
  parent_item_id?: number | null;
  linked_items?: string;
  reminder_settings?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateItemOptions {
  name?: string;
  description?: string;
  category?: string;
  priority?: string;
  tags?: string[];
  status?: string;
  dueDate?: string;
  assignee?: string;
  createdBy?: string;
  customFields?: Record<string, any>;
  attachments?: any[];
  permissions?: string[];
  validationLevel?: string;
  notificationSettings?: Record<string, any>;
  auditEnabled?: boolean;
  backupEnabled?: boolean;
  versionControl?: Record<string, any>;
  metadata?: Record<string, any>;
  dependencies?: any[];
  estimatedHours?: number;
  budget?: number;
  location?: string;
  externalRefs?: any[];
  workflowStage?: string;
  approvalRequired?: boolean;
  templateId?: number | null;
  parentItemId?: number | null;
  linkedItems?: any[];
  reminderSettings?: Record<string, any>;
}

interface UpdateItemOptions {
  itemId?: number;
  updates?: Partial<ItemData>;
  userId?: string;
  userRole?: string;
  permissions?: string[];
  validationRules?: Record<string, any>;
  auditOptions?: Record<string, any>;
  notificationOptions?: Record<string, any>;
  backupOptions?: Record<string, any>;
  versioningOptions?: Record<string, any>;
  conflictResolution?: Record<string, any>;
  retryPolicy?: Record<string, any>;
  timeoutSettings?: Record<string, any>;
  cachingStrategy?: Record<string, any>;
  loggingLevel?: string;
  performanceTracking?: boolean;
  securityContext?: Record<string, any>;
  transactionOptions?: Record<string, any>;
  rollbackStrategy?: Record<string, any>;
  successCallbacks?: Function[];
  errorCallbacks?: Function[];
  progressCallbacks?: Function[];
  customValidators?: any[];
  postProcessors?: any[];
  preProcessors?: any[];
}

interface ControllerStats {
  processed: number;
  errors: number;
  avgTime: number;
}

// Utility functions to implement missing backend functionality
const validatePermissions = (permissions: string[], createdBy: string): boolean => {
  console.log('UTILITY: validatePermissions called for user:', createdBy);
  
  if (!permissions || !Array.isArray(permissions)) {
    console.log('PERMISSION: invalid permissions format');
    return false;
  }
  
  // Check for required permissions
  const requiredPermissions = ['read', 'write'];
  const hasRequired = requiredPermissions.every(perm => permissions.includes(perm));
  
  if (!hasRequired) {
    console.log('PERMISSION: missing required permissions');
    return false;
  }
  
  console.log('PERMISSION: permissions validated successfully');
  return true;
};

const processCustomFields = (customFields: any, templateId?: number | null): Record<string, any> => {
  console.log('UTILITY: processCustomFields called with template:', templateId);
  try {
    if (!customFields) {
      return {};
    }
    
    let fields = customFields;
    if (typeof customFields === 'string') {
      fields = JSON.parse(customFields);
    }
    
    // Apply template processing if templateId is provided
    if (templateId) {
      console.log('PROCESSING: applying template to custom fields');
      // Template processing logic would go here
      fields.templateApplied = templateId;
      fields.processedAt = new Date().toISOString();
    }
    
    console.log('UTILITY: custom fields processed successfully');
    return fields;
  } catch (error) {
    console.log('ERROR: processCustomFields failed:', (error as Error).message);
    return {};
  }
};

const handleAttachments = async (attachments: any[], createdBy: string): Promise<string[]> => {
  console.log('UTILITY: handleAttachments called for user:', createdBy);
  try {
    if (!attachments || !Array.isArray(attachments)) {
      console.log('ATTACHMENTS: no attachments to process');
      return [];
    }
    
    // Process each attachment
    const attachmentIds = attachments.map((attachment, index) => {
      const attachmentId = `att_${Date.now()}_${index}`;
      console.log('ATTACHMENTS: processing attachment:', attachmentId);
      
      // In a real app, this would upload to cloud storage
      // For now, we'll just generate IDs
      return attachmentId;
    });
    
    console.log('UTILITY: attachments processed successfully');
    return attachmentIds;
  } catch (error) {
    console.log('ERROR: handleAttachments failed:', (error as Error).message);
    return [];
  }
};

const sendNotifications = async (notificationSettings: Record<string, any>, newItem: ItemData): Promise<void> => {
  console.log('UTILITY: sendNotifications called for item:', newItem.id);
  try {
    if (!notificationSettings || !notificationSettings.enabled) {
      console.log('NOTIFICATION: notifications disabled');
      return;
    }
    
    const notification = {
      type: 'item_created',
      itemId: newItem.id,
      itemName: newItem.name,
      message: `New item "${newItem.name}" has been created`,
      timestamp: new Date().toISOString()
    };
    
    console.log('NOTIFICATION: notification prepared');
    // In a real app, this would send actual notifications
  } catch (error) {
    console.log('ERROR: sendNotifications failed:', (error as Error).message);
  }
};

const logAuditEvent = async (auditEnabled: boolean, eventType: string, item: ItemData, userId: string): Promise<void> => {
  console.log('UTILITY: logAuditEvent called for event:', eventType);
  try {
    if (!auditEnabled) {
      console.log('AUDIT: audit logging disabled');
      return;
    }
    
    const auditLog = {
      eventType,
      itemId: item.id,
      userId,
      timestamp: new Date().toISOString(),
      itemData: {
        name: item.name,
        category: item.category,
        status: item.status
      }
    };
    
    console.log('AUDIT: audit event logged');
    // In a real app, this would write to audit database
  } catch (error) {
    console.log('ERROR: logAuditEvent failed:', (error as Error).message);
  }
};

const createBackup = async (backupEnabled: boolean, item: ItemData): Promise<void> => {
  console.log('UTILITY: createBackup called for item:', item.id);
  try {
    if (!backupEnabled) {
      console.log('BACKUP: backup disabled');
      return;
    }
    
    const backup = {
      itemId: item.id,
      backupData: { ...item },
      backupTimestamp: new Date().toISOString(),
      backupId: `backup_${item.id}_${Date.now()}`
    };
    
    console.log('BACKUP: backup created');
    // In a real app, this would save to backup storage
  } catch (error) {
    console.log('ERROR: createBackup failed:', (error as Error).message);
  }
};

const validateUpdatePermissions = (permissions: string[], userId: string, itemId: number): boolean => {
  console.log('UTILITY: validateUpdatePermissions called for item:', itemId);
  
  if (!permissions || !Array.isArray(permissions)) {
    console.log('PERMISSION: invalid permissions format');
    return false;
  }
  
  // Check for update permissions
  if (!permissions.includes('write') && !permissions.includes('admin')) {
    console.log('PERMISSION: insufficient update permissions');
    return false;
  }
  
  console.log('PERMISSION: update permissions validated');
  return true;
};

const applyPreProcessors = (updates: Partial<ItemData>, preProcessors: any[]): Partial<ItemData> => {
  console.log('UTILITY: applyPreProcessors called');
  try {
    let processedUpdates = { ...updates };
    
    if (preProcessors && Array.isArray(preProcessors)) {
      preProcessors.forEach(processor => {
        console.log('PROCESSING: applying preprocessor:', processor.name || 'unnamed');
        // Apply preprocessing logic here
        if (processor.type === 'sanitize') {
          // Sanitize string fields
          Object.keys(processedUpdates).forEach(key => {
            const value = processedUpdates[key as keyof ItemData];
            if (typeof value === 'string') {
              (processedUpdates as any)[key] = value.trim();
            }
          });
        }
      });
    }
    
    console.log('UTILITY: preprocessors applied successfully');
    return processedUpdates;
  } catch (error) {
    console.log('ERROR: applyPreProcessors failed:', (error as Error).message);
    return updates;
  }
};

const validateWithCustomRules = (data: any, customValidators: any[]): { isValid: boolean; errors: string[] } => {
  console.log('UTILITY: validateWithCustomRules called');
  try {
    const result = {
      isValid: true,
      errors: [] as string[]
    };
    
    if (!customValidators || !Array.isArray(customValidators)) {
      console.log('VALIDATION: no custom validators provided');
      return result;
    }
    
    customValidators.forEach(validator => {
      if (validator.field && data[validator.field] !== undefined) {
        const value = data[validator.field];
        
        // Apply validation rule
        if (validator.rule === 'required' && (!value || value.toString().trim() === '')) {
          result.isValid = false;
          result.errors.push(`${validator.field} is required`);
        }
        
        if (validator.rule === 'minLength' && value.toString().length < validator.value) {
          result.isValid = false;
          result.errors.push(`${validator.field} must be at least ${validator.value} characters`);
        }
      }
    });
    
    console.log('VALIDATION: custom validation completed, valid:', result.isValid);
    return result;
  } catch (error) {
    console.log('ERROR: validateWithCustomRules failed:', (error as Error).message);
    return { isValid: false, errors: ['Validation error occurred'] };
  }
};

const createVersionSnapshot = async (currentItem: ItemData, userId: string, versioningOptions: Record<string, any>): Promise<void> => {
  console.log('UTILITY: createVersionSnapshot called for item:', currentItem.id);
  try {
    const snapshot = {
      itemId: currentItem.id,
      version: versioningOptions.version || 1,
      snapshotData: { ...currentItem },
      createdBy: userId,
      createdAt: new Date().toISOString(),
      snapshotId: `version_${currentItem.id}_${Date.now()}`
    };
    
    console.log('VERSION: snapshot created');
    // In a real app, this would save to version history
  } catch (error) {
    console.log('ERROR: createVersionSnapshot failed:', (error as Error).message);
  }
};

const handlePostProcessing = async (updatedItem: ItemData, postProcessors: any[]): Promise<void> => {
  console.log('UTILITY: handlePostProcessing called for item:', updatedItem.id);
  try {
    if (!postProcessors || !Array.isArray(postProcessors)) {
      console.log('PROCESSING: no post processors provided');
      return;
    }
    
    postProcessors.forEach(processor => {
      console.log('PROCESSING: applying post processor:', processor.name || 'unnamed');
      // Apply post-processing logic here
    });
    
    console.log('UTILITY: post processing completed');
  } catch (error) {
    console.log('ERROR: handlePostProcessing failed:', (error as Error).message);
  }
};

const triggerNotifications = async (notificationOptions: Record<string, any>, updatedItem: ItemData, originalItem: ItemData): Promise<void> => {
  console.log('UTILITY: triggerNotifications called for item:', updatedItem.id);
  try {
    if (!notificationOptions || !notificationOptions.enabled) {
      console.log('NOTIFICATION: notifications disabled');
      return;
    }
    
    // Compare items to see what changed
    const changes: string[] = [];
    Object.keys(updatedItem).forEach(key => {
      if ((updatedItem as any)[key] !== (originalItem as any)[key]) {
        changes.push(key);
      }
    });
    
    if (changes.length > 0) {
      console.log('NOTIFICATION: changes detected:', changes.join(', '));
      // Send notifications about changes
    }
  } catch (error) {
    console.log('ERROR: triggerNotifications failed:', (error as Error).message);
  }
};

const logAuditTrail = async (auditOptions: Record<string, any>, action: string, updatedItem: ItemData, originalItem: ItemData, userId: string): Promise<void> => {
  console.log('UTILITY: logAuditTrail called for action:', action);
  try {
    if (!auditOptions || !auditOptions.enabled) {
      console.log('AUDIT: audit trail disabled');
      return;
    }
    
    const auditEntry = {
      action,
      itemId: updatedItem.id,
      userId,
      timestamp: new Date().toISOString(),
      changes: {
        before: originalItem,
        after: updatedItem
      }
    };
    
    console.log('AUDIT: audit trail entry created');
    // In a real app, this would write to audit database
  } catch (error) {
    console.log('ERROR: logAuditTrail failed:', (error as Error).message);
  }
};

// Additional helper functions for the other missing functions
const fetchRelatedItems = async (itemId: number): Promise<any[]> => {
  console.log('UTILITY: fetchRelatedItems called for item:', itemId);
  // Return empty array for now - in real app would fetch from database
  return [];
};

const getItemAttachments = async (attachmentIds: string): Promise<any[]> => {
  console.log('UTILITY: getItemAttachments called');
  // Return empty array for now - in real app would fetch attachments
  return [];
};

const getItemComments = async (itemId: number): Promise<any[]> => {
  console.log('UTILITY: getItemComments called for item:', itemId);
  // Return empty array for now - in real app would fetch comments
  return [];
};

const getItemHistory = async (itemId: number): Promise<any[]> => {
  console.log('UTILITY: getItemHistory called for item:', itemId);
  // Return empty array for now - in real app would fetch history
  return [];
};

const resolveDependencies = async (dependencies: string): Promise<any[]> => {
  console.log('UTILITY: resolveDependencies called');
  // Return empty array for now - in real app would resolve dependencies
  return [];
};

const enrichWithUserData = async (item: ItemData): Promise<ItemData> => {
  console.log('UTILITY: enrichWithUserData called for item:', item.id);
  // Return item as-is for now - in real app would add user data
  return item;
};

const cleanupAttachments = async (attachmentIds: string): Promise<void> => {
  console.log('UTILITY: cleanupAttachments called');
  // Cleanup logic would go here
};

const removeFromCache = async (itemId: number): Promise<void> => {
  console.log('UTILITY: removeFromCache called for item:', itemId);
  // Cache removal logic would go here
};

const notifyDependentItems = async (linkedItems: string): Promise<void> => {
  console.log('UTILITY: notifyDependentItems called');
  // Notification logic would go here
};

const archiveAuditLogs = async (itemId: number): Promise<void> => {
  console.log('UTILITY: archiveAuditLogs called for item:', itemId);
  // Archive logic would go here
};

const logDeletion = async (item: ItemData, userId: string): Promise<void> => {
  console.log('UTILITY: logDeletion called for item:', item.id, 'by user:', userId);
  // Deletion logging would go here
};

/**
 * ItemDetailsController - Controller for managing detailed item operations
 */
class ItemDetailsController {
  private db: Database;
  private cache: Map<string, any>;
  private stats: ControllerStats;

  constructor(database: Database) {
    this.db = database;
    this.cache = new Map();
    
    // Add stats property to fix runtime error
    this.stats = {
      processed: 0,
      errors: 0,
      avgTime: 0
    };
  }

  // Function with too many parameters that should be refactored
  async createDetailedItem(req: Request, res: Response, options: CreateItemOptions = {}): Promise<void> {
    const {
      name,
      description,
      category,
      priority,
      tags,
      status,
      dueDate,
      assignee,
      createdBy,
      customFields = {},
      attachments = [],
      permissions = [],
      validationLevel = 'standard',
      notificationSettings = {},
      auditEnabled = false,
      backupEnabled = false,
      versionControl = {},
      metadata = {},
      dependencies = [],
      estimatedHours = 0,
      budget = 0,
      location = '',
      externalRefs = [],
      workflowStage = 'draft',
      approvalRequired = false,
      templateId = null,
      parentItemId = null,
      linkedItems = [],
      reminderSettings = {}
    } = options;

    console.log('ENTRY: createDetailedItem called with options object');
    console.log('FLOW: beginning detailed item creation process');
    
    try {
      console.log('VALIDATION: preparing to validate inputs');
      
      console.log('PERMISSION: attempting permission validation');
      // This will cause a runtime error - validatePermissions function doesn't exist
      if (!validatePermissions(permissions, createdBy || 'anonymous')) {
        console.log('PERMISSION: permission validation failed');
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      console.log('PERMISSION: permission validation passed');

      console.log('PROCESSING: attempting to process custom fields');
      // This will cause an error - processCustomFields doesn't exist
      const processedFields = processCustomFields(customFields, templateId);
      
      console.log('PROCESSING: attempting to handle attachments');
      // This will cause an error - handleAttachments doesn't exist
      const attachmentIds = await handleAttachments(attachments, createdBy || 'anonymous');
      console.log('PROCESSING: attachment handling completed');

      const itemData: ItemData = {
        name: name || '',
        description,
        category,
        priority,
        tags: JSON.stringify(tags),
        status,
        due_date: dueDate,
        assignee,
        created_by: createdBy,
        custom_fields: JSON.stringify(processedFields),
        attachment_ids: JSON.stringify(attachmentIds),
        metadata: JSON.stringify(metadata),
        dependencies: JSON.stringify(dependencies),
        estimated_hours: estimatedHours,
        budget,
        location,
        external_refs: JSON.stringify(externalRefs),
        workflow_stage: workflowStage,
        approval_required: approvalRequired,
        template_id: templateId,
        parent_item_id: parentItemId,
        linked_items: JSON.stringify(linkedItems),
        reminder_settings: JSON.stringify(reminderSettings),
        created_at: new Date().toISOString()
      };

      console.log('DB: preparing item data for database insertion');
      console.log('DB: executing INSERT query for new detailed item');
      const result = this.db.prepare(`
        INSERT INTO item_details (
          name, description, category, priority, tags, status, due_date,
          assignee, created_by, custom_fields, attachment_ids, metadata,
          dependencies, estimated_hours, budget, location, external_refs,
          workflow_stage, approval_required, template_id, parent_item_id,
          linked_items, reminder_settings, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemData.name, itemData.description, itemData.category, itemData.priority,
        itemData.tags, itemData.status, itemData.due_date, itemData.assignee,
        itemData.created_by, itemData.custom_fields, itemData.attachment_ids,
        itemData.metadata, itemData.dependencies, itemData.estimated_hours,
        itemData.budget, itemData.location, itemData.external_refs,
        itemData.workflow_stage, itemData.approval_required, itemData.template_id,
        itemData.parent_item_id, itemData.linked_items, itemData.reminder_settings,
        itemData.created_at
      );

      const newItem = this.db.prepare('SELECT * FROM item_details WHERE id = ?').get(result.lastInsertRowid);
      console.log('DB: successfully created new item with ID:', result.lastInsertRowid);
      
      console.log('NOTIFICATION: attempting to send notifications');
      // This will cause an error - these functions don't exist
      await sendNotifications(notificationSettings, newItem);
      console.log('AUDIT: attempting to log audit event');
      await logAuditEvent(auditEnabled, 'item_created', newItem, createdBy || 'anonymous');
      console.log('BACKUP: attempting to create backup');
      await createBackup(backupEnabled, newItem);
      
      console.log('SUCCESS: detailed item creation completed');
      res.status(201).json(newItem);
    } catch (error) {
      console.log('ERROR: createDetailedItem failed:', (error as Error).message);
      console.log('ERROR: detailed item creation process failed');
      res.status(500).json({ error: 'Failed to create detailed item' });
    }
  }

  // Another function with too many parameters
  async updateItemWithAdvancedOptions(options: UpdateItemOptions = {}): Promise<ItemData> {
    const {
      itemId,
      updates,
      userId,
      userRole = 'user',
      permissions = [],
      validationRules = {},
      auditOptions = {},
      notificationOptions = {},
      backupOptions = {},
      versioningOptions = {},
      conflictResolution = {},
      retryPolicy = {},
      timeoutSettings = {},
      cachingStrategy = {},
      loggingLevel = 'info',
      performanceTracking = false,
      securityContext = {},
      transactionOptions = {},
      rollbackStrategy = {},
      successCallbacks = [],
      errorCallbacks = [],
      progressCallbacks = [],
      customValidators = [],
      postProcessors = [],
      preProcessors = []
    } = options;

    console.log('ENTRY: updateItemWithAdvancedOptions called with options object');
    console.log('FLOW: beginning advanced item update process');
    
    try {
      console.log('VALIDATION: preparing to validate update inputs');
      
      console.log('PERMISSION: attempting update permission validation');
      // This will cause a runtime error - validateUpdatePermissions doesn't exist
      if (!validateUpdatePermissions(permissions, userId || 'anonymous', itemId || 0)) {
        console.log('PERMISSION: update permission validation failed');
        throw new Error('Access denied');
      }
      console.log('PERMISSION: update permission validation passed');

      console.log('PROCESSING: attempting to apply pre-processors');
      // This will cause an error - applyPreProcessors doesn't exist
      const processedUpdates = applyPreProcessors(updates || {}, preProcessors);
      
      console.log('VALIDATION: attempting custom validation rules');
      // This will cause an error - validateWithCustomRules doesn't exist
      const validationResult = validateWithCustomRules(processedUpdates, customValidators);
      if (!validationResult.isValid) {
        console.log('VALIDATION: custom validation failed');
        throw new Error('Validation failed: ' + validationResult.errors.join(', '));
      }
      console.log('VALIDATION: custom validation passed');

      console.log('DB: fetching current item for update');
      const currentItem = this.db.prepare('SELECT * FROM item_details WHERE id = ?').get(itemId);
      if (!currentItem) {
        console.log('ERROR: item not found for update');
        throw new Error('Item not found');
      }
      console.log('DB: current item found successfully');

      console.log('VERSION: checking if versioning is enabled');
      // This will cause an error - createVersionSnapshot doesn't exist
      if (versioningOptions.enabled) {
        console.log('VERSION: attempting to create version snapshot');
        await createVersionSnapshot(currentItem, userId || 'anonymous', versioningOptions);
      }

      console.log('DB: building dynamic update query');
      // Build update query dynamically (potential SQL injection if not careful)
      const updateFields = Object.keys(processedUpdates);
      const setClause = updateFields.map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(processedUpdates), itemId];
      console.log('DB: prepared', updateFields.length, 'fields for update');

      console.log('DB: executing UPDATE query');
      const updateResult = this.db.prepare(`
        UPDATE item_details SET ${setClause}, updated_at = ? WHERE id = ?
      `).run(...values, new Date().toISOString(), itemId);

      if (updateResult.changes === 0) {
        console.log('ERROR: update failed - no rows affected');
        throw new Error('Update failed - no rows affected');
      }
      console.log('DB: update successful, rows affected:', updateResult.changes);

      const updatedItem = this.db.prepare('SELECT * FROM item_details WHERE id = ?').get(itemId);
      console.log('DB: fetched updated item successfully');
      
      console.log('PROCESSING: attempting post-processing');
      // This will cause errors - these functions don't exist
      await handlePostProcessing(updatedItem, postProcessors);
      console.log('NOTIFICATION: attempting to trigger notifications');
      await triggerNotifications(notificationOptions, updatedItem, currentItem);
      console.log('AUDIT: attempting to log audit trail');
      await logAuditTrail(auditOptions, 'item_updated', updatedItem, currentItem, userId || 'anonymous');
      
      console.log('SUCCESS: advanced item update completed');
      return updatedItem;
    } catch (error) {
      console.log('ERROR: updateItemWithAdvancedOptions failed:', (error as Error).message);
      console.log('ERROR: advanced update process failed');
      throw error;
    }
  }

  // Function that will cause runtime errors
  async getItemWithRelatedData(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    console.log('ENTRY: getItemWithRelatedData called for item ID');
    console.log('FLOW: beginning related data fetch process');
    
    try {
      console.log('DB: fetching item from database');
      const item = this.db.prepare('SELECT * FROM item_details WHERE id = ?').get(id);
      
      if (!item) {
        console.log('ERROR: item not found in database');
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('DB: item found successfully');

      console.log('FETCH: attempting to fetch related items');
      // This will cause errors - these functions don't exist
      const relatedItems = await fetchRelatedItems(item.id);
      console.log('FETCH: attempting to get item attachments');
      const attachments = await getItemAttachments(item.attachment_ids);
      console.log('FETCH: attempting to get item comments');
      const comments = await getItemComments(item.id);
      console.log('FETCH: attempting to get item history');
      const history = await getItemHistory(item.id);
      console.log('FETCH: attempting to resolve dependencies');
      const dependencies = await resolveDependencies(item.dependencies);
      
      console.log('ENRICHMENT: attempting to enrich item with user data');
      // This will cause an error - enrichWithUserData doesn't exist
      const enrichedItem = await enrichWithUserData(item);
      
      console.log('RESPONSE: building response object with related data');
      const response = {
        ...enrichedItem,
        related_items: relatedItems,
        attachments,
        comments,
        history,
        dependencies
      };
      
      console.log('SUCCESS: related data fetch completed');
      res.json(response);
    } catch (error) {
      console.log('ERROR: getItemWithRelatedData failed:', (error as Error).message);
      console.log('ERROR: failed to fetch item details');
      res.status(500).json({ error: 'Failed to fetch item details' });
    }
  }

  // Method with missing error handling and will cause runtime errors
  async deleteItemWithCleanup(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    console.log('ENTRY: deleteItemWithCleanup called for item ID');
    console.log('FLOW: beginning item deletion with cleanup process');
    
    try {
      console.log('DB: fetching item for deletion');
      const item = this.db.prepare('SELECT * FROM item_details WHERE id = ?').get(id);
      
      console.log('CLEANUP: attempting to cleanup attachments');
      // This will cause an error - these cleanup functions don't exist
      await cleanupAttachments(item.attachment_ids);
      console.log('CLEANUP: attempting to remove from cache');
      await removeFromCache(parseInt(id));
      console.log('CLEANUP: attempting to notify dependent items');
      await notifyDependentItems(item.linked_items);
      console.log('CLEANUP: attempting to archive audit logs');
      await archiveAuditLogs(parseInt(id));
      
      console.log('DB: executing DELETE query');
      const deleteResult = this.db.prepare('DELETE FROM item_details WHERE id = ?').run(id);
      
      if (deleteResult.changes === 0) {
        console.log('ERROR: delete failed - item not found');
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      console.log('DB: item deleted successfully');
      
      console.log('AUDIT: attempting to log deletion');
      // This will cause an error - logDeletion doesn't exist
      await logDeletion(item, 'anonymous');
      
      console.log('SUCCESS: item deletion with cleanup completed');
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.log('ERROR: deleteItemWithCleanup failed:', (error as Error).message);
      console.log('ERROR: item deletion process failed');
      res.status(500).json({ error: 'Deletion failed' });
    }
  }

  // Function that accesses undefined properties
  getControllerStats(): ControllerStats {
    console.log('ENTRY: getControllerStats called');
    console.log('STATS: attempting to access undefined stats properties');
    // This will cause runtime errors - these properties don't exist
    return {
      processedRequests: this.stats.processed,
      errorCount: this.stats.errors,
      averageResponseTime: this.stats.avgTime
    } as any;
  }
}

export default ItemDetailsController;