import path from 'path';  
import fs from 'fs';  

export default {  
  async afterCreate(event) {  
    const { result } = event;  
    const dbPath = path.resolve(__dirname, '../../../data', `${result.slug}.db`);  
    if (!fs.existsSync(dbPath)) {  
      fs.writeFileSync(dbPath, '');  
      console.log(`Created DB: ${result.slug}.db`);  
    }  
  },  
  async afterUpdate(event) { // Optional: Handle slug changes  
    // Similar logic if slug updated  
  },  
};  