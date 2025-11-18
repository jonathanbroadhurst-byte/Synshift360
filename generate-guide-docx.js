import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateDocx() {
  try {
    console.log('Generating Survey Participant Guide Word document...');
    
    const mdPath = path.join(__dirname, 'SURVEY_PARTICIPANT_GUIDE.md');
    const docxPath = path.join(__dirname, 'Survey_Participant_Guide.docx');
    
    // Read the markdown file
    const markdown = await readFile(mdPath, 'utf-8');
    
    // Configure document options for professional appearance
    const options = {
      style: {
        titleSize: 32,
        heading1Size: 28,
        heading2Size: 24,
        heading3Size: 20,
        heading4Size: 18,
        paragraphSize: 22,
        headingSpacing: 240,
        paragraphSpacing: 120,
        lineSpacing: 1.15,
        paragraphAlignment: "LEFT",
        blockquoteAlignment: "LEFT",
      }
    };
    
    // Convert to DOCX (returns a Blob)
    const blob = await convertMarkdownToDocx(markdown, options);
    
    // Convert Blob to Buffer for Node.js file writing
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write the DOCX file
    await writeFile(docxPath, buffer);
    
    console.log('✅ Word document generated successfully!');
    console.log(`📄 Location: ${docxPath}`);
    console.log(`📏 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error generating Word document:', error);
    process.exit(1);
  }
}

generateDocx();
