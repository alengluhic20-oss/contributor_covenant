import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors?: any[];
}

let schemaCache: any = null;
let ajvInstance: Ajv | null = null;

function getSchema(): any {
  if (schemaCache) {
    return schemaCache;
  }

  const schemaPath = path.join(process.cwd(), '.maatyselfai', 'trajectory-schema.json');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found at ${schemaPath}`);
  }

  schemaCache = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  return schemaCache;
}

function getAjv(): Ajv {
  if (ajvInstance) {
    return ajvInstance;
  }

  ajvInstance = new Ajv({ allErrors: true });
  // Add basic format support
  ajvInstance.addFormat('date-time', {
    validate: (dateTimeString: string) => {
      return !isNaN(Date.parse(dateTimeString));
    }
  });
  return ajvInstance;
}

export function validateTrajectory(data: any): ValidationResult {
  try {
    const schema = getSchema();
    const ajv = getAjv();
    
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
      return {
        valid: false,
        errors: validate.errors || []
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: `Validation error: ${error}` }]
    };
  }
}

export function validateMetrics(metrics: any): ValidationResult {
  const requiredMetrics = [
    'code_churn',
    'review_engagement',
    'conversation_sentiment',
    'test_coverage',
    'ci_stability',
    'merge_conflicts'
  ];

  const errors: any[] = [];

  for (const metric of requiredMetrics) {
    if (!(metric in metrics)) {
      errors.push({ message: `Missing required metric: ${metric}` });
    } else if (typeof metrics[metric] !== 'number') {
      errors.push({ message: `Metric ${metric} must be a number` });
    } else if (metrics[metric] < 0 || metrics[metric] > 1) {
      errors.push({ message: `Metric ${metric} must be between 0 and 1` });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
