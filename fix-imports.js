const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'build' && file !== '.next') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function getRelativePath(from, to) {
  const relativePath = path.relative(path.dirname(from), to);
  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    return './' + relativePath;
  }
  return relativePath.replace(/\\/g, '/');
}

function fixImports(filePath, srcDir) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Match all imports with @/ alias
  const importRegex = /from\s+['"]@\/(.*?)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    const targetPath = path.join(srcDir, importPath);
    const relativePath = getRelativePath(filePath, targetPath);
    modified = true;
    console.log(`${path.basename(filePath)}: @/${importPath} -> ${relativePath}`);
    return `from '${relativePath}'`;
  });

  // Match dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"]@\/(.*?)['"]\s*\)/g;
  content = content.replace(dynamicImportRegex, (match, importPath) => {
    const targetPath = path.join(srcDir, importPath);
    const relativePath = getRelativePath(filePath, targetPath);
    modified = true;
    console.log(`${path.basename(filePath)}: import(@/${importPath}) -> import('${relativePath}')`);
    return `import('${relativePath}')`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return modified;
}

// Main execution
const frontendDir = path.join(__dirname, 'protomforms-frontend');
const srcDir = path.join(frontendDir, 'src');

console.log('Fixing imports in frontend...');
const allFiles = getAllFiles(srcDir);
let fixedCount = 0;

allFiles.forEach(file => {
  if (fixImports(file, srcDir)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files out of ${allFiles.length} total files.`);




















