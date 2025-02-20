const path = require('path')
const fs = require('fs').promises

const processFile = require('./processFile')

const processDirectory = async ({ options, inputPath }) => {
  if (!inputPath) {
    throw new Error('Input path is required');
  }
  console.log(`Processing directory ${inputPath}`);

  let processing = [];
  let counter = 0;
  
  try {
    const dirStats = await fs.stat(inputPath);
    if (!dirStats.isDirectory()) {
      throw new Error(`Input path "${inputPath}" is not a directory`);
    }

    const files = await fs.readdir(inputPath);
    for (const file of files) {
      try {
        const filePath = path.join(inputPath, file);
        const fileStats = await fs.stat(filePath);
        
        if (fileStats.isFile()) {
          processing.push(processFile({ ...options, filePath }));
          counter++;
        } else if (options.includeSubdirectories && fileStats.isDirectory()) {
          await processDirectory({ options, inputPath: filePath });
        }
        
        if(counter % 5 === 0) {
          await Promise.allSettled(processing);
          processing = [];
          counter = 0;
        }
      } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }
    
    if(counter > 0) {
      await Promise.allSettled(processing);
    }
  } catch (err) {
    console.error(`Error processing directory ${inputPath}: ${err.message}`);
    throw err;
  }
}

module.exports = processDirectory
