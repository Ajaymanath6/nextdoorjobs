# Database Cleanup Scripts

## Remove Test Companies

### Using SQL Script

1. **Preview the data first** - Uncomment the SELECT query at the end of `cleanup-test-companies.sql` to see what companies exist in your database

2. **Choose your deletion method**:
   - **Option 1**: Delete all Kerala companies (if all are test data)
   - **Option 2**: Delete by company name (safest - specify exact names)
   - **Option 3**: Delete companies with missing coordinates
   - **Option 4**: Delete by specific IDs

3. **Run the script**:
   ```bash
   # Using psql
   psql -U your_username -d your_database_name -f scripts/cleanup-test-companies.sql
   
   # Or using Prisma Studio
   # Open Prisma Studio and run queries manually
   npx prisma studio
   ```

### Using Prisma Client (Programmatic)

Alternatively, you can delete companies programmatically:

```javascript
// Run this in a Node.js script or Next.js API route
import { prisma } from '../lib/prisma';

async function cleanupTestCompanies() {
  // Delete by name
  const result = await prisma.company.deleteMany({
    where: {
      name: {
        in: ['Test Company 1', 'Test Company 2', 'Sample Company']
      }
    }
  });
  
  console.log(`Deleted ${result.count} companies`);
  
  // Or delete by state
  const result2 = await prisma.company.deleteMany({
    where: {
      state: 'Kerala'
    }
  });
  
  console.log(`Deleted ${result2.count} Kerala companies`);
}

cleanupTestCompanies();
```

### Safety Tips

1. **Always backup first**: Create a database backup before running deletion scripts
2. **Test on staging**: If you have a staging environment, test there first
3. **Use transactions**: Wrap deletions in transactions so you can rollback if needed
4. **Preview first**: Always run SELECT queries before DELETE queries to see what will be affected

### Finding Test Companies

To identify test companies, you can run:

```sql
-- Companies with test-like names
SELECT id, name, state, "createdAt" 
FROM "Company" 
WHERE name ILIKE '%test%' 
   OR name ILIKE '%demo%' 
   OR name ILIKE '%sample%'
ORDER BY "createdAt" DESC;

-- Recently created companies
SELECT id, name, state, "createdAt" 
FROM "Company" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Companies in Kerala
SELECT id, name, district, latitude, longitude 
FROM "Company" 
WHERE state = 'Kerala'
ORDER BY "createdAt" DESC;
```
