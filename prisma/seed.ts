import { PrismaClient, ToolStatus, PricingModel, BillingCycle } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Utility function to create a URL-friendly slug
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Function to parse pricing model from existing data
function parsePricingModel(pricingModel: string): PricingModel {
  switch (pricingModel?.toLowerCase()) {
    case 'freemium':
      return 'FREEMIUM';
    case 'subscription':
      return 'SUBSCRIPTION';
    case 'free':
      return 'FREE';
    default:
      return 'SUBSCRIPTION';
  }
}

// Function to parse business size into proper format
function parseBusinessSize(sizes: string[]): string[] {
  return sizes.map(size => size.charAt(0).toUpperCase() + size.slice(1));
}

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Read existing JSON data
    const toolsJsonPath = path.join(process.cwd(), 'data', 'tools.json');
    const categoriesJsonPath = path.join(process.cwd(), 'data', 'categories.json');
    const industriesJsonPath = path.join(process.cwd(), 'data', 'industries.json');

    if (!fs.existsSync(toolsJsonPath)) {
      console.error('❌ tools.json not found at:', toolsJsonPath);
      return;
    }

    const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf-8'));
    console.log(`📊 Found ${toolsData.length} tools to import`);

    // Create categories
    console.log('📁 Creating categories...');
    const categoryMap = new Map<string, string>();
    
    const uniqueCategories = new Map();
    toolsData.forEach((tool: any) => {
      if (tool.categories && Array.isArray(tool.categories)) {
        tool.categories.forEach((cat: any) => {
          if (!uniqueCategories.has(cat.slug)) {
            uniqueCategories.set(cat.slug, cat);
          }
        });
      }
    });

    for (const [slug, categoryData] of uniqueCategories) {
      const category = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: `AI tools for ${categoryData.name.toLowerCase()}`,
          icon: categoryData.icon || '🔧',
          color: categoryData.color || '#6B7280'
        }
      });
      categoryMap.set(slug, category.id);
    }

    // Create industries
    console.log('🏭 Creating industries...');
    const industryMap = new Map<string, string>();
    
    const uniqueIndustries = new Map();
    toolsData.forEach((tool: any) => {
      if (tool.industry_focus && Array.isArray(tool.industry_focus)) {
        tool.industry_focus.forEach((ind: any) => {
          if (!uniqueIndustries.has(ind.slug)) {
            uniqueIndustries.set(ind.slug, ind);
          }
        });
      }
    });

    for (const [slug, industryData] of uniqueIndustries) {
      const industry = await prisma.industry.upsert({
        where: { slug },
        update: {},
        create: {
          name: industryData.name,
          slug: industryData.slug,
          description: `AI solutions for ${industryData.name.toLowerCase()} businesses`,
          icon: industryData.icon || '🏢',
          keywords: JSON.stringify([industryData.name.toLowerCase()])
        }
      });
      industryMap.set(slug, industry.id);
    }

    // Create business types
    console.log('💼 Creating business types...');
    const businessTypeMap = new Map<string, string>();
    
    const businessTypes = [
      { name: 'Small Business', slug: 'small', employeeRange: '1-50', description: 'Small businesses with 1-50 employees' },
      { name: 'Medium Business', slug: 'medium', employeeRange: '51-200', description: 'Medium businesses with 51-200 employees' },
      { name: 'Large Enterprise', slug: 'large', employeeRange: '200+', description: 'Large enterprises with 200+ employees' }
    ];

    for (const bizType of businessTypes) {
      const businessType = await prisma.businessType.upsert({
        where: { slug: bizType.slug },
        update: {},
        create: bizType
      });
      businessTypeMap.set(bizType.slug, businessType.id);
    }

    // Create AI tools
    console.log('🤖 Creating AI tools...');
    
    for (const toolData of toolsData) {
      const slug = createSlug(toolData.name);
      
      // Create the main AI tool record
      const aiTool = await prisma.aITool.create({
        data: {
          slug,
          name: toolData.name,
          description: toolData.description || '',
          website: toolData.website_url || '',
          logo: toolData.logo_url || null,
          screenshot: toolData.screenshot_url || null,
          status: 'ACTIVE' as ToolStatus,
          useCases: JSON.stringify(toolData.use_cases || []),
          tags: JSON.stringify(toolData.key_features || []),
          qualityScore: 85, // Default quality score
          smbRelevanceScore: 80, // Default SMB relevance
          metaDescription: toolData.meta_description || null,
          keywords: JSON.stringify(toolData.keywords || [])
        }
      });

      // Create pricing tier
      if (toolData.pricing_details) {
        const pricing = toolData.pricing_details;
        await prisma.pricingTier.create({
          data: {
            toolId: aiTool.id,
            name: pricing.free_tier ? 'Freemium' : 'Paid',
            model: parsePricingModel(toolData.pricing_model),
            price: pricing.starting_price || null,
            currency: pricing.starting_price_currency || 'USD',
            billingCycle: 'MONTHLY' as BillingCycle,
            isFree: pricing.free_tier || false,
            customPricing: pricing.custom_pricing || false,
            features: JSON.stringify(toolData.key_features || []),
            limitations: JSON.stringify([])
          }
        });
      }

      // Link categories (use upsert to avoid duplicates)
      if (toolData.categories && Array.isArray(toolData.categories)) {
        for (const category of toolData.categories) {
          const categoryId = categoryMap.get(category.slug);
          if (categoryId) {
            await prisma.aIToolCategory.upsert({
              where: {
                toolId_categoryId: {
                  toolId: aiTool.id,
                  categoryId
                }
              },
              update: {},
              create: {
                toolId: aiTool.id,
                categoryId,
                isPrimary: true
              }
            });
          }
        }
      }

      // Link industries (use upsert to avoid duplicates)
      if (toolData.industry_focus && Array.isArray(toolData.industry_focus)) {
        for (const industry of toolData.industry_focus) {
          const industryId = industryMap.get(industry.slug);
          if (industryId) {
            await prisma.aIToolIndustry.upsert({
              where: {
                toolId_industryId: {
                  toolId: aiTool.id,
                  industryId
                }
              },
              update: {},
              create: {
                toolId: aiTool.id,
                industryId,
                relevanceScore: 85
              }
            });
          }
        }
      }

      // Link business types (use upsert to avoid duplicates)
      if (toolData.business_size && Array.isArray(toolData.business_size)) {
        for (const size of toolData.business_size) {
          const businessTypeId = businessTypeMap.get(size);
          if (businessTypeId) {
            await prisma.aIToolBusinessType.upsert({
              where: {
                toolId_businessTypeId: {
                  toolId: aiTool.id,
                  businessTypeId
                }
              },
              update: {},
              create: {
                toolId: aiTool.id,
                businessTypeId,
                suitabilityScore: 90
              }
            });
          }
        }
      }

      // Add features as separate records
      if (toolData.key_features && Array.isArray(toolData.key_features)) {
        for (const feature of toolData.key_features.slice(0, 5)) { // Limit to 5 features
          await prisma.feature.create({
            data: {
              toolId: aiTool.id,
              name: feature,
              category: 'CORE_FUNCTIONALITY',
              isCore: true,
              availableIn: JSON.stringify(['all'])
            }
          });
        }
      }

      // Add source information
      await prisma.sourceEntry.create({
        data: {
          toolId: aiTool.id,
          source: 'MANUAL_ENTRY',
          sourceId: toolData.id,
          confidence: 0.95
        }
      });

      console.log(`✅ Created tool: ${toolData.name}`);
    }

    console.log('🎉 Database seeded successfully!');
    
    // Print summary
    const toolCount = await prisma.aITool.count();
    const categoryCount = await prisma.category.count();
    const industryCount = await prisma.industry.count();
    
    console.log('\n📊 Summary:');
    console.log(`   • ${toolCount} AI tools`);
    console.log(`   • ${categoryCount} categories`);
    console.log(`   • ${industryCount} industries`);
    console.log(`   • ${businessTypes.length} business types`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });