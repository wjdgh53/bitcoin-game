// Script to index feature development documentation in ChromaDB
import { ChromaClient } from 'chromadb';
import fs from 'fs';
import path from 'path';
import { getChromaClient } from '@/lib/database/chroma-client';

const COLLECTION_NAME = 'bitcoin_game_dev_patterns';

interface DocumentInfo {
  filePath: string;
  title: string;
  content: string;
  type: string;
  category: string;
}

async function indexDevelopmentDocumentation() {
  console.log('🚀 Starting feature development documentation indexing...');
  
  const chroma = await getChromaClient();

  try {
    // Get or create collection
    let collection;
    try {
      collection = await chroma.getCollection({ name: COLLECTION_NAME });
      console.log(`✅ Found existing collection: ${COLLECTION_NAME}`);
    } catch {
      collection = await chroma.createCollection({
        name: COLLECTION_NAME,
        metadata: {
          description: 'Bitcoin Trading Game feature development patterns and documentation',
          category: 'development_docs',
          version: '1.0',
          created_by: 'index-dev-docs-script'
        }
      });
      console.log(`✅ Created new collection: ${COLLECTION_NAME}`);
    }

    // Define documentation files to index
    const docsToIndex: DocumentInfo[] = [
      {
        filePath: 'docs/feature/pattern.md',
        title: 'Feature Development Pattern Guide',
        content: fs.readFileSync('docs/feature/pattern.md', 'utf8'),
        type: 'guide',
        category: 'development_patterns'
      },
      {
        filePath: 'docs/feature/checklist.md',
        title: 'Feature Development Checklist',
        content: fs.readFileSync('docs/feature/checklist.md', 'utf8'),
        type: 'checklist',
        category: 'quality_assurance'
      },
      {
        filePath: 'docs/feature/search-patterns.md',
        title: 'ChromaDB Search Patterns Guide',
        content: fs.readFileSync('docs/feature/search-patterns.md', 'utf8'),
        type: 'guide',
        category: 'chromadb_patterns'
      },
      {
        filePath: 'docs/feature/README.md',
        title: 'Feature Development Documentation Overview',
        content: fs.readFileSync('docs/feature/README.md', 'utf8'),
        type: 'overview',
        category: 'navigation'
      },
      {
        filePath: 'docs/feature/examples/basic-crud-feature.md',
        title: 'Complete CRUD Feature Example - Trading Notes',
        content: fs.readFileSync('docs/feature/examples/basic-crud-feature.md', 'utf8'),
        type: 'example',
        category: 'implementation_examples'
      },
      {
        filePath: 'docs/feature/examples/README.md',
        title: 'Feature Implementation Examples Guide',
        content: fs.readFileSync('docs/feature/examples/README.md', 'utf8'),
        type: 'overview',
        category: 'examples_navigation'
      }
    ];

    // Index each document
    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: any[] = [];

    for (const doc of docsToIndex) {
      const docId = doc.filePath.replace(/[\/\.]/g, '_');
      
      // Extract key sections for better search
      const sections = extractSections(doc.content, doc.title);
      
      ids.push(docId);
      documents.push(sections.searchableContent);
      metadatas.push({
        file_path: doc.filePath,
        title: doc.title,
        type: doc.type,
        category: doc.category,
        topics: sections.topics,
        word_count: sections.wordCount,
        created_at: new Date().toISOString(),
        indexed_by: 'index-dev-docs-script'
      });
      
      console.log(`📄 Prepared: ${doc.title}`);
    }

    // Add documents to ChromaDB
    await collection.add({
      ids,
      documents,
      metadatas
    });

    console.log(`✅ Successfully indexed ${docsToIndex.length} documentation files`);
    
    // Test search functionality
    await testSearchFunctionality(collection);
    
  } catch (error) {
    console.error('❌ Error indexing documentation:', error);
    throw error;
  }
}

function extractSections(content: string, title: string) {
  // Extract headings and important sections
  const lines = content.split('\n');
  const sections: string[] = [];
  const topics: string[] = [];
  let currentSection = '';
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      // Save previous section
      if (currentSection.trim()) {
        sections.push(currentSection.trim());
      }
      
      // Start new section
      const heading = line.replace(/^#+\s*/, '');
      topics.push(heading);
      currentSection = heading + '\n';
    } else if (line.trim()) {
      currentSection += line + '\n';
    }
  }
  
  // Save final section
  if (currentSection.trim()) {
    sections.push(currentSection.trim());
  }

  // Create searchable content
  const searchableContent = `${title}\n\n${sections.join('\n\n')}`;
  
  return {
    searchableContent,
    topics: topics.slice(0, 10), // Limit topics
    wordCount: searchableContent.split(/\s+/).length
  };
}

async function testSearchFunctionality(collection: any) {
  console.log('\n🔍 Testing search functionality...');
  
  const testQueries = [
    'How to implement CRUD operations',
    'ChromaDB search patterns',
    'Service layer architecture',
    'API route validation',
    'React hooks for data management',
    'Testing strategies for features',
    'Database schema design',
    'TypeScript types and validation'
  ];

  for (const query of testQueries) {
    try {
      const results = await collection.query({
        queryTexts: [query],
        nResults: 3,
        include: ['metadatas', 'documents']
      });

      if (results.metadatas && results.metadatas[0] && results.metadatas[0].length > 0) {
        console.log(`  ✅ "${query}" -> Found ${results.metadatas[0].length} results`);
        console.log(`     Best match: ${results.metadatas[0][0].title}`);
      } else {
        console.log(`  ⚠️  "${query}" -> No results found`);
      }
    } catch (error) {
      console.log(`  ❌ "${query}" -> Search failed: ${error}`);
    }
  }
}

// Run the indexing
if (require.main === module) {
  indexDevelopmentDocumentation()
    .then(() => {
      console.log('\n🎉 Documentation indexing completed successfully!');
      console.log('You can now search for development patterns using ChromaDB queries.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Documentation indexing failed:', error);
      process.exit(1);
    });
}

export { indexDevelopmentDocumentation };