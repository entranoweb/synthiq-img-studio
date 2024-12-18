import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db, PromptsTable, GeneratedImagesTable, UsersTable } from '@/lib/drizzle';
import { eq } from 'drizzle-orm';
import { fal } from "@fal-ai/client";
import type { QueueStatus, FluxProV11UltraInput } from "@fal-ai/client";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import axios from 'axios';

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY
});

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true // Required for Tigris
});

interface FalImage {
  url: string;
  content_type: string;
}

interface FalResponse {
  data?: {
    images?: FalImage[];
  };
  requestId: string;
}

async function uploadToS3(imageUrl: string, fileName: string): Promise<string> {
  try {
    console.log('Downloading image from:', imageUrl);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const bucketName = process.env.BUCKET_NAME!;
    console.log('Uploading to S3 bucket:', bucketName);
    
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/png',
        ACL: 'private'
      }
    });

    await upload.done();
    
    // Generate a presigned URL using the correct import
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 24 * 60 * 60 }); // 24 hours
    console.log('Generated presigned URL:', presignedUrl);
    return presignedUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('POST request started');
  try {
    const user = await getCurrentUser();
    console.log('Current user:', user);
    
    if (!user) {
      console.log('No user found - Unauthorized');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (user.credits < 1) {
      console.log('Insufficient credits:', user.credits);
      return new NextResponse('Insufficient credits', { status: 402 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      console.log('Invalid prompt:', prompt);
      return new NextResponse('Invalid prompt', { status: 400 });
    }

    console.log('Creating prompt record...');
    const [promptRecord] = await db.insert(PromptsTable).values({
      userId: user.id,
      promptText: prompt,
      modelSettings: {
        model: 'fal-ai/flux-pro',
        version: 'v1.1-ultra'
      },
      status: 'processing'
    }).returning();
    console.log('Prompt record created:', promptRecord);

    try {
      console.log('Starting image generation with fal.ai...');
      const generationInput = {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          negative_prompt: "ugly, blurry, low quality, distorted, deformed",
          scheduler: "dpm++2m",
          seed: Math.floor(Math.random() * 1000000)
        } as FluxProV11UltraInput,
        logs: true,
        onQueueUpdate: (status: QueueStatus) => {
          console.log('Queue update status:', status.status);
          if (status.status === "IN_PROGRESS" && 'logs' in status) {
            console.log('Generation progress:', status.logs);
          }
        }
      };
      console.log('Generation input:', generationInput);

      const result = await fal.subscribe("fal-ai/flux-pro/v1.1-ultra", generationInput) as FalResponse;
      console.log('Fal.ai API response:', result);

      if (!result.data?.images?.[0]?.url) {
        console.log('No image URL in response:', result);
        throw new Error('No image generated');
      }

      // Upload to S3
      const fileName = `${user.id}/${promptRecord.id}_${Date.now()}.png`;
      const tigrisUrl = await uploadToS3(result.data.images[0].url, fileName);
      console.log('Image uploaded to S3:', tigrisUrl);

      console.log('Creating image record...');
      const [imageRecord] = await db.insert(GeneratedImagesTable).values({
        userId: user.id,
        promptId: promptRecord.id,
        imageUrl: tigrisUrl,
        metadata: {
          prompt: prompt,
          model: 'fal-ai/flux-pro',
          settings: {
            width: 1024,
            height: 1024,
            steps: 50,
            guidance_scale: 7.5
          },
          fallbackUrl: result.data.images[0].url // Store the original fal.ai URL as fallback
        }
      }).returning();
      console.log('Image record created:', imageRecord);

      console.log('Updating prompt status...');
      await db.update(PromptsTable)
        .set({ status: 'completed' })
        .where(eq(PromptsTable.id, promptRecord.id));

      console.log('Deducting credits...');
      await db.update(UsersTable)
        .set({ credits: user.credits - 1 })
        .where(eq(UsersTable.id, user.id));

      const response = {
        promptId: promptRecord.id,
        imageUrl: tigrisUrl,
        status: 'completed' as const,
        requestId: result.requestId
      };
      console.log('Sending successful response:', response);
      return NextResponse.json(response);

    } catch (genError: unknown) {
      console.error('Image generation error details:', {
        error: genError,
        message: genError instanceof Error ? genError.message : 'Unknown error',
        stack: genError instanceof Error ? genError.stack : undefined
      });

      console.log('Updating prompt status to failed...');
      await db.update(PromptsTable)
        .set({ status: 'failed' })
        .where(eq(PromptsTable.id, promptRecord.id));

      return new NextResponse('Failed to generate image', { status: 500 });
    }

  } catch (error: unknown) {
    console.error('General error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
