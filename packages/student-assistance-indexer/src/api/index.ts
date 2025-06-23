import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Student Assistance Indexer API",
    timestamp: new Date().toISOString(),
    service: "student-assistance-indexer",
    endpoints: {
      graphql: "/graphql"
    }
  });
});

// GraphQL endpoint
app.post("/graphql", async (c) => {
  const { query, variables } = await c.req.json();
  
  // Simple GraphQL resolver for transfers
  if (query.includes("transfers")) {
    // This would typically query your database
    // For now, return a placeholder response
    return c.json({
      data: {
        transfers: []
      }
    });
  }
  
  return c.json({
    data: null,
    errors: [{ message: "Query not supported" }]
  });
});

// GraphQL schema introspection
app.get("/graphql", (c) => {
  return c.text(`
    type Transfer {
      id: String!
      txHash: String!
      fromAddress: String!
      toAddress: String!
      amount: String!
      timestamp: String!
      blockNumber: String!
    }
    
    type Query {
      transfers: [Transfer!]!
    }
  `);
});

export default app; 