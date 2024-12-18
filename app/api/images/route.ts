import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, GeneratedImagesTable, UsersTable, PromptsTable } from '@/lib/drizzle';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  console.log('GET /api/images - Start');
  try {
    const user = await getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Fetching images for user:', user.id);
    // Fetch images with their associated prompts
    const images = await db
      .select({
        id: GeneratedImagesTable.id,
        imageUrl: GeneratedImagesTable.imageUrl,
        createdAt: GeneratedImagesTable.createdAt,
        userId: GeneratedImagesTable.userId,
        metadata: GeneratedImagesTable.metadata,
        prompt: PromptsTable.promptText,
      })
      .from(GeneratedImagesTable)
      .leftJoin(
        PromptsTable,
        eq(GeneratedImagesTable.promptId, PromptsTable.id)
      )
      .where(eq(GeneratedImagesTable.userId, user.id))
      .orderBy(desc(GeneratedImagesTable.createdAt))
      .limit(20);

    console.log('Found images:', images);

    // Filter out any invalid images
    const validImages = images.filter(img => {
      const isValid = img && img.imageUrl && typeof img.imageUrl === 'string';
      if (!isValid) {
        console.warn('Found invalid image in database:', img);
      }
      return isValid;
    });

    // Set cache control headers
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    return NextResponse.json({ images: validImages }, { headers });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the session token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user's session
    const session = await verifyAuth(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { imageUrl, prompt } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Insert the new image with the user's ID
    const newImage = await db
      .insert(GeneratedImagesTable)
      .values({
        imageUrl,
        prompt,
        userId: session.userId,
      })
      .returning();

    return NextResponse.json({ image: newImage[0] });
  } catch (error) {
    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}
