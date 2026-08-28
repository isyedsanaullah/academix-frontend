const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const modelsDir = 'c:/Users/DELL/Desktop/CESMS/backend/models';
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

console.log('Found models:', files.length);

files.forEach(file => {
  try {
    const modelPath = path.join(modelsDir, file);
    // Clear cache to avoid issues
    delete require.cache[require.resolve(modelPath)];
    
    // Mock mongoose model registration if needed
    const model = require(modelPath);
    
    let schema;
    let modelName;
    
    if (model.schema) {
      schema = model.schema;
      modelName = model.modelName || file.replace('.js', '');
    } else if (typeof model === 'object') {
      // Handles exports with multiple models like Evaluation
      Object.keys(model).forEach(key => {
        if (model[key] && model[key].schema) {
          printSchema(key, model[key].schema);
        }
      });
      return;
    }
    
    if (schema) {
      printSchema(modelName, schema);
    }
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
  }
});

function printSchema(name, schema) {
  console.log(`\n========================================`);
  console.log(`MODEL: ${name}`);
  console.log(`========================================`);
  
  const paths = schema.paths;
  const indexes = schema.indexes();
  
  Object.keys(paths).forEach(pathName => {
    const pathInfo = paths[pathName];
    const type = pathInfo.instance;
    const isRequired = !!pathInfo.isRequired;
    const ref = pathInfo.options ? pathInfo.options.ref : null;
    const enumValues = pathInfo.options ? pathInfo.options.enum : null;
    
    let typeStr = type;
    if (type === 'ObjectID' || type === 'ObjectId') {
      typeStr = ref ? `ObjectId (ref: ${ref})` : 'ObjectId';
    } else if (type === 'Array') {
      const caster = pathInfo.caster;
      if (caster) {
        const casterRef = caster.options ? caster.options.ref : null;
        typeStr = casterRef ? `Array of ObjectId (ref: ${casterRef})` : `Array of ${caster.instance}`;
      } else {
        typeStr = 'Array';
      }
    }
    
    console.log(`- ${pathName}: ${typeStr} ${isRequired ? '[REQUIRED]' : ''} ${enumValues ? '[ENUM: ' + enumValues.join(', ') + ']' : ''}`);
  });
  
  if (indexes.length > 0) {
    console.log('INDEXES:');
    indexes.forEach(idx => {
      console.log(`  ${JSON.stringify(idx[0])} ${JSON.stringify(idx[1])}`);
    });
  }
}
