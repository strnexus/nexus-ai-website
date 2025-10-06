const fs = require('fs');
const crypto = require('crypto');

// Function to generate unique ID
function generateId() {
    return crypto.randomBytes(4).toString('hex');
}

// Function to slugify string
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

// Function to map category to color (simplified mapping)
function getCategoryColor(category) {
    const colorMap = {
        'Pet Care & Services': '#10B981',
        'Home Services & Contractors': '#3B82F6',
        'Professional Services': '#8B5CF6',
        'Food & Hospitality': '#F59E0B',
        'Beauty & Wellness': '#EC4899',
        'Telecommunications': '#06B6D4',
        'Energy & Utilities': '#84CC16',
        'Security & Surveillance': '#EF4444',
        'Legal & Compliance': '#6B7280',
        'Government & Public Sector': '#1F2937',
        'Automotive & Transportation': '#F97316',
        'default': '#6B7280'
    };
    return colorMap[category] || colorMap['default'];
}

// Function to get business size based on price
function getBusinessSize(price) {
    const priceNum = parseInt(price.replace(/[^\d]/g, ''));
    if (priceNum < 50) return ['small'];
    if (priceNum < 150) return ['small', 'medium'];
    return ['medium', 'large'];
}

// Function to map technical complexity
function getTechnicalComplexity(easeOfUse) {
    if (easeOfUse >= 8) return 'no_code';
    if (easeOfUse >= 6) return 'low_code';
    return 'technical';
}

// Function to transform tool data
function transformTool(tool) {
    return {
        id: generateId(),
        name: tool.name,
        slug: slugify(tool.name),
        description: tool.description,
        tagline: null,
        categories: [{
            id: slugify(tool.category),
            name: tool.category,
            slug: slugify(tool.category),
            icon: '🤖',
            color: getCategoryColor(tool.category)
        }],
        industry_focus: [{
            id: slugify(tool.subcategory || 'general'),
            name: tool.subcategory || 'General',
            slug: slugify(tool.subcategory || 'general'),
            icon: '🎯'
        }],
        business_size: getBusinessSize(tool.startingPrice),
        use_cases: [],
        pricing_model: tool.startingPrice.includes('Free') ? 'freemium' : 'subscription',
        pricing_details: {
            free_tier: tool.startingPrice.includes('Free'),
            starting_price: parseInt(tool.startingPrice.replace(/[^\d]/g, '')) || 0,
            starting_price_currency: 'USD',
            starting_price_period: 'month',
            custom_pricing: false
        },
        roi_metrics: [{
            metric: 'ROI Potential',
            value: tool.industryROI || 'High',
            timeframe: null,
            source: 'manual_entry'
        }],
        ease_of_use: Math.max(1, Math.min(5, Math.round(tool.easeOfUse / 2))), // Convert 1-10 to 1-5 scale
        setup_time: tool.setupTime,
        technical_complexity: getTechnicalComplexity(tool.easeOfUse),
        website_url: tool.url,
        logo_url: null,
        screenshot_url: null,
        key_features: tool.keyFeatures ? tool.keyFeatures.split(' ').slice(0, 4) : [],
        integrations: [],
        ai_capabilities: ['automation'],
        status: 'active',
        rating: null,
        review_count: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'nexus_comprehensive_db',
        meta_description: tool.description,
        keywords: [],
        popularity_score: tool.specializationScore,
        trending_score: null
    };
}

// Read the new database
console.log('Reading new database...');
const newDatabase = JSON.parse(fs.readFileSync('data/tools-new-190.json', 'utf8'));

console.log(`Found ${newDatabase.length} tools in new database`);

// Transform all tools
console.log('Transforming tools...');
const transformedTools = newDatabase.map(transformTool);

console.log('Writing transformed database...');
fs.writeFileSync('data/tools-transformed.json', JSON.stringify(transformedTools, null, 2));

console.log(`✅ Successfully transformed ${transformedTools.length} tools`);
console.log('✅ Output saved to: data/tools-transformed.json');

// Backup existing and replace
console.log('Backing up existing tools.json...');
if (fs.existsSync('data/tools.json')) {
    fs.copyFileSync('data/tools.json', 'data/tools-backup.json');
}

console.log('Replacing tools.json with transformed data...');
fs.copyFileSync('data/tools-transformed.json', 'data/tools.json');

console.log('🎉 Database transformation complete!');
console.log(`📊 Database upgraded from 20 tools to ${transformedTools.length} tools`);