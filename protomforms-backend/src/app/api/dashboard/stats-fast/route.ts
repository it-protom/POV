import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Redirect to standard stats endpoint - optimization files not available
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simply redirect to the standard stats endpoint
    // This endpoint exists for compatibility but uses the standard implementation
    const statsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/dashboard/stats`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!statsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const stats = await statsResponse.json();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Fallback: return empty stats
    return NextResponse.json({
      stats: [],
      chartData: [],
      completionData: [],
      topForms: [],
      recentActivity: [],
      performanceData: [],
      categoryDistribution: [],
      deviceData: [],
      hourlyActivity: []
    });
  }
}
