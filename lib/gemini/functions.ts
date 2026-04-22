import { FunctionDeclarationSchemaType as SchemaType, type FunctionDeclaration } from '@google/generative-ai';

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'retrieve_documents',
    description:
      'Search and retrieve relevant documentation from the knowledge base using semantic similarity. Use this for general questions about features, concepts, or procedures.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'The search query to find relevant documents',
        },
        module: {
          type: SchemaType.STRING,
          description: 'Filter by system module: icm, oracle, or general',
          enum: ['icm', 'oracle', 'general'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'explain_sop',
    description:
      'Retrieve step-by-step Standard Operating Procedure (SOP) documentation for a specific topic or process. Use this when users ask "how to" questions or need process guidance.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: {
          type: SchemaType.STRING,
          description: 'The SOP topic or process name to explain',
        },
        module: {
          type: SchemaType.STRING,
          description: 'The system module: icm, oracle, or general',
          enum: ['icm', 'oracle', 'general'],
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'troubleshoot_issue',
    description:
      'Find resolution steps for a described error, issue, or problem. Use this when users report errors, system problems, or unexpected behavior.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        error_description: {
          type: SchemaType.STRING,
          description:
            'Description of the error or issue the user is experiencing',
        },
        module: {
          type: SchemaType.STRING,
          description: 'The system module where the issue occurs: icm, oracle, or general',
          enum: ['icm', 'oracle', 'general'],
        },
      },
      required: ['error_description'],
    },
  },
  {
    name: 'navigate_workflow',
    description:
      'Retrieve workflow navigation steps and process flows for named business processes. Use this when users ask about approval flows, process stages, or workflow routing.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        workflow_name: {
          type: SchemaType.STRING,
          description: 'The name of the workflow or business process',
        },
        module: {
          type: SchemaType.STRING,
          description: 'The system module: icm, oracle, or general',
          enum: ['icm', 'oracle', 'general'],
        },
      },
      required: ['workflow_name'],
    },
  },
];
