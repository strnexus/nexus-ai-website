#!/usr/bin/env node

/**
 * Convert AI Tools Markdown Database to Structured JSON
 * 
 * This script parses the existing markdown file and converts it to our structured database format
 * It also validates URLs, identifies missing data, and generates initial seed data
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Input and output paths
const MARKDOWN_FILE = 'C:\\Users\\svetk\\Downloads\\AI_tools_SMB_database.md';
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const TOOLS_OUTPUT = path.join(OUTPUT_DIR, 'tools.json');
const CATEGORIES_OUTPUT = path.join(OUTPUT_DIR, 'categories.json');
const INDUSTRIES_OUTPUT = path.join(OUTPUT_DIR, 'industries.json');
const ISSUES_REPORT = path.join(OUTPUT_DIR, 'conversion_issues.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Category mappings from the markdown
const CATEGORY_MAPPINGS = {
  'Customer Service & Support': {
    id: 'customer_service',
    name: 'Customer Service & Support',
    slug: 'customer-service',
    icon: '🎧',
    color: '#3B82F6'
  },
  'Operations & Productivity': {
    id: 'operations',
    name: 'Operations & Productivity', 
    slug: 'operations',
    icon: '⚡',
    color: '#10B981'
  },
  'Sales & CRM': {
    id: 'sales_crm',
    name: 'Sales & CRM',
    slug: 'sales-crm',
    icon: '📊',
    color: '#F59E0B'
  },
  'Marketing & Content': {
    id: 'marketing',
    name: 'Marketing & Content',
    slug: 'marketing',
    icon: '📣',
    color: '#EF4444'
  },
  'Finance & Accounting': {
    id: 'finance',
    name: 'Finance & Accounting',
    slug: 'finance',
    icon: '💰',
    color: '#8B5CF6'
  },
  'E-commerce & Retail': {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    slug: 'ecommerce',
    icon: '🛒',
    color: '#F97316'
  },
  'Human Resources': {
    id: 'hr',
    name: 'Human Resources',
    slug: 'human-resources',
    icon: '👥',
    color: '#06B6D4'
  }
};

// Industry mappings
const INDUSTRY_MAPPINGS = {
  'All': { id: 'all', name: 'All Industries', slug: 'all', icon: '🌐' },
  'Healthcare': { id: 'healthcare', name: 'Healthcare', slug: 'healthcare', icon: '🏥' },
  'Legal Services': { id: 'legal', name: 'Legal Services', slug: 'legal', icon: '⚖️' },
  'HVAC, Plumbing, Electrical': { id: 'home_services', name: 'Home Services', slug: 'home-services', icon: '🔧' },
  'Home Services': { id: 'home_services', name: 'Home Services', slug: 'home-services', icon: '🔧' },
  'Contractors': { id: 'construction', name: 'Construction', slug: 'construction', icon: '🏗️' },
  'Restaurants': { id: 'restaurants', name: 'Restaurants', slug: 'restaurants', icon: '🍽️' },
  'Food Service': { id: 'restaurants', name: 'Restaurants', slug: 'restaurants', icon: '🍽️' },
  'Veterinary': { id: 'veterinary', name: 'Veterinary', slug: 'veterinary', icon: '🐾' },
  'Real Estate': { id: 'real_estate', name: 'Real Estate', slug: 'real-estate', icon: '🏠' },
  'E-commerce': { id: 'ecommerce', name: 'E-commerce', slug: 'ecommerce', icon: '🛒' },
  'SaaS': { id: 'saas', name: 'SaaS', slug: 'saas', icon: '💻' }
};

// Business size mappings
const BUSINESS_SIZE_MAPPINGS = {
  'Micro (1-5)': 'micro',
  'Small (6-50)': 'small',
  'Medium (51-200)': 'medium'
};

// Pricing model mappings
const PRICING_MODEL_MAPPINGS = {
  'Freemium': 'freemium',
  'Subscription': 'subscription',
  'Custom': 'custom',
  'Free': 'free'
};

// Generate consistent ID from name
function generateId(name) {
  return crypto.createHash('md5').update(name.toLowerCase()).digest('hex').substring(0, 8);
}

// Convert name to URL-friendly slug
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Parse pricing string to structured data
function parsePricing(pricingText, modelText) {
  const pricing = {
    free_tier: false,
    starting_price: null,
    starting_price_currency: 'USD',
    starting_price_period: 'month',
    custom_pricing: false
  };

  if (modelText === 'Freemium' || pricingText.toLowerCase().includes('free')) {
    pricing.free_tier = true;
  }

  if (modelText === 'Custom') {
    pricing.custom_pricing = true;
  }

  // Extract price from text like "$15/mo", "$200/mo", "Free + $20/mo"
  const priceMatch = pricingText.match(/\$(\d+(?:\.\d{2})?)/);
  if (priceMatch) {
    pricing.starting_price = parseFloat(priceMatch[1]);
  }

  if (pricingText.includes('/mo')) {
    pricing.starting_price_period = 'month';
  } else if (pricingText.includes('/yr')) {
    pricing.starting_price_period = 'year';
  }

  return pricing;
}

// Parse business size
function parseBusinessSize(sizeText) {
  const sizes = [];
  Object.keys(BUSINESS_SIZE_MAPPINGS).forEach(key => {
    if (sizeText.includes(key)) {
      sizes.push(BUSINESS_SIZE_MAPPINGS[key]);
    }
  });
  return sizes.length > 0 ? sizes : ['small']; // Default to small
}

// Parse industry focus
function parseIndustries(industryText) {
  const industries = [];
  Object.keys(INDUSTRY_MAPPINGS).forEach(key => {
    if (industryText.includes(key)) {
      industries.push(INDUSTRY_MAPPINGS[key]);
    }
  });
  return industries.length > 0 ? industries : [INDUSTRY_MAPPINGS['All']];
}

// Parse setup time to complexity
function parseComplexity(setupTime) {
  if (setupTime.includes('minute')) return 'no_code';
  if (setupTime.includes('hour')) return 'low_code';
  if (setupTime.includes('day') || setupTime.includes('week')) return 'technical';
  return 'low_code';
}

// Main conversion function
function parseMarkdownToTools() {
  const content = fs.readFileSync(MARKDOWN_FILE, 'utf8');
  const tools = [];
  const issues = [];
  
  // Split content into tool blocks (between ``` markers)
  const toolBlocks = content.split('```').filter(block => 
    block.trim().startsWith('Tool_Name:') || 
    block.trim().startsWith('Tool Name:')
  );

  console.log(`Found ${toolBlocks.length} tool blocks to process...`);

  toolBlocks.forEach((block, index) => {
    try {
      // Split by actual line breaks, not escaped ones
      const lines = block.trim().split('\n').filter(line => line.trim());
      const toolData = {};

      // Parse each line
      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().replace('Tool_Name', 'Tool_Name');
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            toolData[key] = value;
          }
        }
      });

      // Required fields check
      if (!toolData['Tool_Name']) {
        issues.push({
          type: 'missing_required_field',
          field: 'Tool_Name',
          block_index: index,
          content: block.substring(0, 100) + '...'
        });
        return;
      }

      const tool = {
        id: generateId(toolData['Tool_Name']),
        name: toolData['Tool_Name'],
        slug: createSlug(toolData['Tool_Name']),
        description: toolData['Description'] || 'TBD',
        tagline: null,
        
        // Categorization
        categories: toolData['Category'] ? [CATEGORY_MAPPINGS[toolData['Category']] || { 
          id: generateId(toolData['Category']), 
          name: toolData['Category'], 
          slug: createSlug(toolData['Category']) 
        }] : [],
        
        industry_focus: toolData['Industry_Focus'] ? 
          parseIndustries(toolData['Industry_Focus']) : [INDUSTRY_MAPPINGS['All']],
        
        business_size: toolData['Business_Size'] ? 
          parseBusinessSize(toolData['Business_Size']) : ['small'],
        
        use_cases: [], // Will be populated later
        
        // Pricing
        pricing_model: toolData['Pricing_Model'] ? 
          (PRICING_MODEL_MAPPINGS[toolData['Pricing_Model']] || 'subscription') : 'subscription',
        
        pricing_details: toolData['Starting_Price'] ? 
          parsePricing(toolData['Starting_Price'], toolData['Pricing_Model']) : {},
        
        roi_metrics: toolData['ROI_Potential'] ? [{
          metric: 'ROI Potential',
          value: toolData['ROI_Potential'],
          timeframe: null,
          source: 'manual_entry'
        }] : [],
        
        // Implementation
        ease_of_use: toolData['Ease_of_Use'] ? parseInt(toolData['Ease_of_Use']) : 3,
        setup_time: toolData['Setup_Time'] || 'TBD',
        technical_complexity: toolData['Setup_Time'] ? 
          parseComplexity(toolData['Setup_Time']) : 'low_code',
        
        // External info
        website_url: toolData['Website'] || '',
        logo_url: null,
        screenshot_url: null,
        
        // Features
        key_features: toolData['Key_Features'] ? 
          toolData['Key_Features'].split(',').map(f => f.trim()) : [],
        integrations: [],
        ai_capabilities: ['automation'], // Default for AI tools
        
        // Quality
        status: toolData['Status'] === 'Active' ? 'active' : 'inactive',
        rating: null,
        review_count: null,
        
        // Metadata
        created_at: new Date(),
        updated_at: new Date(),
        source: 'manual',
        
        // SEO
        meta_description: toolData['Description'] ? 
          toolData['Description'].substring(0, 160) : null,
        keywords: [],
        
        // Analytics
        popularity_score: null,
        trending_score: null
      };

      // Validate website URL
      if (tool.website_url && !tool.website_url.startsWith('http')) {
        issues.push({
          type: 'invalid_url',
          tool_name: tool.name,
          url: tool.website_url
        });
      }

      tools.push(tool);

    } catch (error) {
      issues.push({
        type: 'parsing_error',
        block_index: index,
        error: error.message,
        content: block.substring(0, 100) + '...'
      });
    }
  });

  return { tools, issues };
}

// Generate categories and industries JSON
function generateMetadata(tools) {
  const categories = new Set();
  const industries = new Set();

  tools.forEach(tool => {
    tool.categories.forEach(cat => categories.add(JSON.stringify(cat)));
    tool.industry_focus.forEach(ind => industries.add(JSON.stringify(ind)));
  });

  return {
    categories: Array.from(categories).map(cat => JSON.parse(cat)),
    industries: Array.from(industries).map(ind => JSON.parse(ind))
  };
}

// Main execution
console.log('🚀 Starting AI Tools Database Conversion...');

try {
  const { tools, issues } = parseMarkdownToTools();
  const { categories, industries } = generateMetadata(tools);
  
  // Write output files
  fs.writeFileSync(TOOLS_OUTPUT, JSON.stringify(tools, null, 2));
  fs.writeFileSync(CATEGORIES_OUTPUT, JSON.stringify(categories, null, 2));
  fs.writeFileSync(INDUSTRIES_OUTPUT, JSON.stringify(industries, null, 2));
  fs.writeFileSync(ISSUES_REPORT, JSON.stringify(issues, null, 2));
  
  console.log(`✅ Conversion completed successfully!`);
  console.log(`📊 Processed ${tools.length} tools`);
  console.log(`📁 Generated files:`);
  console.log(`   - ${TOOLS_OUTPUT}`);
  console.log(`   - ${CATEGORIES_OUTPUT}`);
  console.log(`   - ${INDUSTRIES_OUTPUT}`);
  console.log(`   - ${ISSUES_REPORT}`);
  
  if (issues.length > 0) {
    console.log(`⚠️  Found ${issues.length} issues - check ${ISSUES_REPORT}`);
  }
  
  console.log('\\n🎯 Next Steps:');
  console.log('1. Review the issues report and fix any data problems');
  console.log('2. Validate the generated JSON files');
  console.log('3. Import into your database');
  console.log('4. Set up automated data refresh pipeline');

} catch (error) {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
}