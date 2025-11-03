const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/auth/signin/page.tsx',
  'src/pages/admin/layout.tsx',
  'src/hooks/use-navigation-loading.ts',
  'src/components/theme-provider.tsx',
  'src/components/PageTransition.tsx',
  'src/components/PageLoader.tsx',
  'src/components/ui/sonner.tsx',
  'src/pages/user/responses/[slug]/[progressive]/page.tsx',
  'src/pages/admin/responses/[slug]/[progressive]/page.tsx',
  'src/pages/admin/responses/[slug]/page.tsx',
  'src/pages/admin/forms/[id]/share/page.tsx',
  'src/pages/admin/forms/[id]/results/page.tsx',
  'src/pages/admin/forms/[id]/responses/page.tsx',
  'src/pages/admin/forms/[id]/preview/page.tsx',
  'src/pages/admin/forms/[id]/page.tsx',
  'src/pages/forms/[id]/page.tsx'
];

let count = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      
      // Fix all imports
      content = content
        .replace(/from ["']next\/link["']/g, 'from "react-router-dom"')
        .replace(/from ["']next\/navigation["']/g, 'from "react-router-dom"')
        .replace(/from ["']next\/image["']/g, '// Image removed')
        .replace(/import Link from ["']next\/link["']/g, 'import { Link } from "react-router-dom"')
        .replace(/import \{ useRouter \} from ["']next\/navigation["']/g, 'import { useNavigate } from "react-router-dom"')
        .replace(/import \{ useParams \} from ["']next\/navigation["']/g, 'import { useParams } from "react-router-dom"')
        .replace(/import \{ useRouter, useParams \} from ["']next\/navigation["']/g, 'import { useParams, useNavigate } from "react-router-dom"')
        .replace(/import \{ useParams, useRouter \} from ["']next\/navigation["']/g, 'import { useParams, useNavigate } from "react-router-dom"')
        .replace(/from ["']components\/ui\//g, 'from "@/components/ui/')
        .replace(/from ["']components\//g, 'from "@/components/')
        .replace(/const router = useRouter\(\)/g, 'const navigate = useNavigate()')
        .replace(/router\.push\(/g, 'navigate(')
        .replace(/router\.replace\(/g, 'navigate(')
        .replace(/router\.back\(\)/g, 'navigate(-1)');
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
        count++;
      } else {
        console.log(`⏭️  No changes: ${file}`);
      }
    } else {
      console.log(`❌ Not found: ${file}`);
    }
  } catch (err) {
    console.log(`❌ Error in ${file}: ${err.message}`);
  }
});

console.log(`\n🎉 Total files fixed: ${count}`);

