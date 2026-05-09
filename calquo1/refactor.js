const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'e:/B2b-main/calquo1/src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

// Just checking how many files import firebase
let firebaseFiles = [];
walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('from \'firebase/')) {
            firebaseFiles.push(filePath);
        }
    }
});

console.log(`Found ${firebaseFiles.length} files with Firebase imports`);
