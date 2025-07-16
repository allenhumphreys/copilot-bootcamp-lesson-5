# Lesson 5 Starting Code Summary

This repository contains code specifically designed for the GitHub Copilot Bootcamp Lesson 5 refactoring and debugging exercises.

## What Was Added

### New Features
- **Item Details Management**: A new feature that allows users to manage detailed item information beyond the basic name field
- **Three new files** that contain various code quality issues for refactoring

### Files Created

#### Frontend
1. **`packages/frontend/src/components/ItemDetails.js`**
   - React component with long parameter lists (33+ parameters)
   - Dead code (unused variables and functions)
   - Missing error handling and logging
   - Runtime errors from undefined functions

2. **`packages/frontend/src/utils/ItemService.js`**
   - Service class with methods having excessive parameters (25+ parameters)
   - Unused utility functions and constants
   - Missing error handling
   - References to undefined functions

#### Backend
3. **`packages/backend/src/controllers/ItemDetailsController.js`**
   - Controller with methods having too many parameters (30+ parameters)
   - Dead code and unused methods
   - Missing error handling and logging
   - Runtime errors from undefined functions

### Database Schema
- Added `item_details` table to support the new functionality

### Integration
- Updated `packages/frontend/src/App.js` to include the new ItemDetails functionality
- Updated `packages/backend/src/app.js` to include API routes for item details
- Added sample data for testing

## Issues for Refactoring (Maps to Lesson 5 Steps)

### Step 5-2: Long Parameter Lists → Objects
- `ItemDetails` component constructor has 33+ parameters
- `createItemWithDetails()` method has 25+ parameters  
- `updateItemWithAdvancedOptions()` method has 25+ parameters
- `processItemAction()` function has 20+ parameters

### Step 5-3: Dead Code Removal
- Unused imports: `Fab`, `AddIcon`, `EditIcon`, `Chip`
- Unused variables: `unusedVariable`, `UNUSED_CONSTANT`, `OLD_API_VERSION`
- Unused functions: `deadFunction`, `unusedUtilityFunction`, `deprecatedDataProcessor`
- Unused methods: `deprecatedGetMethod`, `oldValidationMethod`

### Step 5-4: Add Logging
- Functions lack entry/exit logging
- Missing parameter validation logging
- No error context logging
- Missing performance tracking

### Step 5-5: Fix Runtime Errors
- Undefined functions: `updateUserPreferences`, `fetchItemDetails`, `validateItemData`
- Missing function implementations: `removeFromDetailedItems`, `updateItemInState`
- Undefined service methods: `processNewItem`, `handleAuditLogging`, `sendNotifications`

### Step 5-6: Convert to TypeScript
- All three main files are JavaScript and can be converted to TypeScript
- Requires adding type definitions for parameters, return values, and interfaces
- Need to configure TypeScript compilation for the project

## Current Application State

The application currently:
- ✅ **Runs** - Both frontend and backend start successfully
- ❌ **Has compilation errors** - ESLint errors prevent frontend compilation
- ✅ **Backend works** - API endpoints are accessible
- ❌ **Frontend fails** - Cannot load due to undefined function errors

This is the **intended state** for lesson 5 - students will use GitHub Copilot to fix these issues step by step.

## Testing the Exercises

Students can test their refactoring progress by:
1. Running `npm run start` to see current errors
2. Using browser console to see runtime errors  
3. Checking ESLint output for dead code warnings
4. Verifying functionality works after each refactoring step

## Expected Learning Outcomes

After completing lesson 5, students will have:
- Refactored long parameter lists into object parameters
- Removed all dead/unused code
- Added comprehensive logging for debugging
- Fixed all runtime errors
- Converted JavaScript files to TypeScript (optional)
- A fully functional item details management system



## How to start this exercise

Simply copy the exercise to your account, then wait **about 20 seconds** for the setup to complete, then **refresh the page**.

[![](https://img.shields.io/badge/Copy%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/new?template_owner=andykongslalom&template_name=copilot-bootcamp-lesson-5&owner=%40me&name=copilot-bootcamp-lesson-5&description=Lesson+5+Refactoring&visibility=public)

<details>
<summary>Having trouble? 🤷</summary><br/>

When copying the exercise, we recommend the following settings:

- For owner, choose your personal account or an organization to host the repository.
- We recommend creating a public repository, since private repositories will use Actions minutes.
   
If the exercise isn't ready in 20 seconds, please check the Actions tab.

- Check to see if a job is running. Sometimes it simply takes a bit longer.
- If the page shows a failed job, please submit an issue.

</details>

---

&copy; 2025 Slalom &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)