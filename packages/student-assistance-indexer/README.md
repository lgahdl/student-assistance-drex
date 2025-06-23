# Student Assistance Indexer

A blockchain indexer built with [Ponder](https://ponder.sh) that indexes events from the StudentAssistanceVault smart contract. This indexer provides a GraphQL API and database for querying historical data about student registrations, DREX deposits, distributions, and other vault activities.

## Features

- **Real-time Event Indexing**: Automatically indexes all events from the StudentAssistanceVault contract
- **GraphQL API**: Provides a GraphQL endpoint for querying indexed data
- **Database Storage**: Stores indexed data in a PostgreSQL database
- **Student Management**: Tracks student registrations, updates, and removals
- **Financial Tracking**: Monitors DREX deposits, distributions, and transfers
- **Role Management**: Indexes staff role grants and revocations
- **Statistics**: Maintains aggregate statistics about the vault

## Indexed Events

The indexer tracks the following events from the StudentAssistanceVault contract:

### Student Management
- `StudentRegistered`: New student registrations
- `StudentUpdated`: Changes to student monthly amounts
- `StudentRemoved`: Student deactivations

### Financial Operations
- `DrexDeposited`: DREX token deposits to the vault
- `MonthlyDistribution`: Monthly distribution events
- `BatchDistribution`: Batch distribution operations
- `Transfer`: Transfers between students
- `EmergencyWithdraw`: Emergency withdrawals by admins

### Access Control
- `StaffRoleGranted`: Staff role assignments
- `StaffRoleRevoked`: Staff role removals

## Database Schema

The indexer creates the following tables:

### Core Tables
- `Student`: Current state of all students
- `VaultStats`: Aggregate statistics about the vault

### Event Tables
- `StudentRegistration`: Student registration events
- `StudentUpdate`: Student update events
- `StudentRemoval`: Student removal events
- `DrexDeposit`: DREX deposit events
- `MonthlyDistribution`: Monthly distribution events
- `BatchDistribution`: Batch distribution events
- `Transfer`: Transfer events
- `EmergencyWithdraw`: Emergency withdrawal events
- `StaffRoleGrant`: Staff role grant events
- `StaffRoleRevoke`: Staff role revoke events

## Installation

```bash
# Install dependencies
npm install

# Generate types from schema
npm run codegen
```

## Configuration

The indexer is configured in `ponder.config.ts`:

- **Network**: Connects to local Besu network on `http://localhost:8545`
- **Contract**: Indexes the StudentAssistanceVault contract
- **Start Block**: Begins indexing from block 0

## Usage

### Development Mode
```bash
npm run dev
```

This starts the indexer in development mode with:
- Hot reloading
- GraphQL playground at `http://localhost:42069`
- Database UI at `http://localhost:42069/graphql`

### Production Mode
```bash
npm run build
npm run start
```

### Generate Types
```bash
npm run codegen
```

## GraphQL API

Once running, the GraphQL API is available at `http://localhost:42069/graphql`.

### Example Queries

#### Get All Active Students
```graphql
query GetActiveStudents {
  students(where: { isActive: true }) {
    items {
      id
      address
      monthlyAmount
      registeredAt
      updatedAt
    }
  }
}
```

#### Get Recent DREX Deposits
```graphql
query GetRecentDeposits {
  drexDeposits(orderBy: "timestamp", orderDirection: "desc", limit: 10) {
    items {
      id
      from
      amount
      timestamp
      transactionHash
    }
  }
}
```

#### Get Vault Statistics
```graphql
query GetVaultStats {
  vaultStats(id: "vault") {
    totalStudents
    activeStudents
    totalDeposited
    totalDistributed
    lastDistributionTimestamp
  }
}
```

#### Get Student Registration History
```graphql
query GetStudentRegistrations($student: String!) {
  studentRegistrations(where: { student: $student }) {
    items {
      monthlyAmount
      timestamp
      transactionHash
    }
  }
}
```

## Environment Variables

The indexer uses the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string (optional, uses SQLite by default)
- `PONDER_LOG_LEVEL`: Log level (debug, info, warn, error)

## Development

### Project Structure
```
src/
├── index.ts          # Main event handlers
ponder.config.ts      # Ponder configuration
ponder.schema.ts      # Database schema definition
abis/                 # Contract ABIs
├── StudentAssistanceVault.json
```

### Adding New Event Handlers

1. Add the event to the schema in `ponder.schema.ts`
2. Create an event handler in `src/index.ts`
3. Run `npm run codegen` to generate types

### Testing

The indexer can be tested by:

1. Running the local Besu network
2. Deploying the StudentAssistanceVault contract
3. Performing contract operations
4. Querying the GraphQL API to verify data

## Integration

This indexer is designed to work with:

- **StudentAssistanceVault Contract**: The smart contract being indexed
- **External Server**: Can query the GraphQL API for student data
- **Mobile App**: Can use the API for displaying transaction history
- **Web Panel**: Can use the API for administrative dashboards

## Monitoring

The indexer provides:

- Real-time sync status
- Error logging
- Performance metrics
- Database health checks

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure Besu network is running on `localhost:8545`
2. **Contract Not Found**: Verify the contract address in `ponder.config.ts`
3. **Schema Errors**: Run `npm run codegen` after schema changes
4. **Database Issues**: Check PostgreSQL connection or use SQLite for development

### Logs

Check the console output for detailed logs about:
- Sync progress
- Event processing
- Database operations
- Error messages 