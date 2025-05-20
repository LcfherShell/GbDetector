# ⚠️ CRITICAL WARNING ⚠️

## DO NOT MODIFY OR DELETE FILES IN THE DIST FOLDER

### SEVERE CONSEQUENCES OF MODIFICATION:

The files contained within the `dist/` directory are **automatically generated** production assets that are essential for the proper functioning of the application. 

**MODIFYING OR DELETING THESE FILES WILL:**

1. **BREAK PRODUCTION DEPLOYMENTS** - Causing system-wide failures and downtime
2. **CORRUPT APPLICATION INTEGRITY** - Leading to unpredictable behavior and security vulnerabilities
3. **DISRUPT DEPENDENCY CHAINS** - Breaking functionality across multiple system components
4. **INVALIDATE INTEGRITY CHECKS** - Causing CDN and security verification failures
5. **PREVENT FUTURE UPDATES** - Making it impossible to properly update or patch the system

### CORRECT PROCEDURES:

- **NEVER** directly edit any file in the `dist/` directory
- **ALWAYS** make changes to source files only
- **ALWAYS** use the proper build process to regenerate `dist/` files
- **CONSULT** technical documentation before any operation affecting these files
- **VERIFY** integrity hashes after any build process
