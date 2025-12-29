# Test Database Setup Guide

## ✅ Using Existing Database

**Good news!** The tests are now configured to use your **existing database** from your `.env` file. You don't need to create a separate test database unless you want to.

## Optional: Separate Test Database

If you prefer to use a separate test database (recommended for safety), follow the steps below.

## Quick Setup

### Option 1: Create Database via MySQL CLI

```bash
# Connect to MySQL
mysql -u root -p

# Create test database
CREATE DATABASE flawless_test;

# Exit MySQL
exit;
```

### Option 2: Create Database via SQL File

```bash
# Connect and create database
mysql -u root -p -e "CREATE DATABASE flawless_test;"
```

### Option 3: Use Existing Database (Not Recommended)

If you want to use an existing database for testing (not recommended for production), update your `.env.test`:

```env
DB_NAME=your_existing_database_name
```

## Import Schema (Optional)

If you need to import the database schema:

```bash
mysql -u root -p flawless_test < connection/flawless_17102024.sql
```

## Verify Database Exists

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'flawless_test';"
```

## Environment Configuration

Make sure your `.env.test` file (or `.env` file) has:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flawless_test
```

## Troubleshooting

### Error: `Unknown database 'flawless_test'`

**Solution:** Create the database using one of the methods above.

### Error: `Access denied`

**Solution:** Check your database credentials in `.env.test` or `.env` file.

### Error: `Connection refused`

**Solution:** Make sure MySQL server is running:
```bash
# Check MySQL status
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # Mac
```

## Notes

- The test database is separate from your production/development database
- Tests will clean up data after running (if properly configured)
- Never use production database for tests
- Consider using a local MySQL instance for testing

