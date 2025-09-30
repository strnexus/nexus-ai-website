import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');

    // Build where clause based on filters
    const where: {
      status: string;
      categories?: {
        some: {
          category: {
            slug: string;
          };
        };
      };
      industries?: {
        some: {
          industry: {
            slug: string;
          };
        };
      };
    } = {
      status: 'ACTIVE'
    };

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category
          }
        }
      };
    }

    if (industry) {
      where.industries = {
        some: {
          industry: {
            slug: industry
          }
        }
      };
    }

    const tools = await prisma.aITool.findMany({
      where,
      take: limit,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        industries: {
          include: {
            industry: true
          }
        },
        pricingTiers: {
          orderBy: {
            sortOrder: 'asc'
          },
          take: 1
        },
        features: {
          where: {
            isCore: true
          },
          take: 5
        }
      },
      orderBy: [
        { qualityScore: 'desc' },
        { smbRelevanceScore: 'desc' }
      ]
    });

    // Transform the data for easier frontend consumption
    const transformedTools = tools.map(tool => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      website: tool.website,
      logo: tool.logo,
      screenshot: tool.screenshot,
      categories: tool.categories.map(tc => ({
        id: tc.category.id,
        name: tc.category.name,
        slug: tc.category.slug,
        icon: tc.category.icon,
        color: tc.category.color
      })),
      industries: tool.industries.map(ti => ({
        id: ti.industry.id,
        name: ti.industry.name,
        slug: ti.industry.slug,
        icon: ti.industry.icon
      })),
      pricing: tool.pricingTiers[0] ? {
        name: tool.pricingTiers[0].name,
        price: tool.pricingTiers[0].price,
        currency: tool.pricingTiers[0].currency,
        billingCycle: tool.pricingTiers[0].billingCycle,
        isFree: tool.pricingTiers[0].isFree
      } : null,
      features: tool.features.map(f => f.name),
      useCases: tool.useCases ? JSON.parse(tool.useCases) : [],
      tags: tool.tags ? JSON.parse(tool.tags) : [],
      qualityScore: tool.qualityScore,
      smbRelevanceScore: tool.smbRelevanceScore
    }));

    return NextResponse.json({
      tools: transformedTools,
      total: transformedTools.length,
      limit,
      filters: {
        category,
        industry
      }
    });

  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

// Get tool categories for filtering
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'categories') {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              tools: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return NextResponse.json({ categories });
    }

    if (action === 'industries') {
      const industries = await prisma.industry.findMany({
        include: {
          _count: {
            select: {
              tools: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return NextResponse.json({ industries });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}