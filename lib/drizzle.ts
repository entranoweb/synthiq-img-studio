import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  json,
  integer,
} from 'drizzle-orm/pg-core'
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'

// Users table
export const UsersTable = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    image: varchar('image', { length: 255 }),
    credits: integer('credits').default(5).notNull(), // Changed default to 5 to match database
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
  },
  (users) => {
    return {
      uniqueIdx: uniqueIndex('unique_idx').on(users.email),
    }
  }
)

// Prompts table
export const PromptsTable = pgTable(
  'prompts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => UsersTable.id).notNull(),
    promptText: text('prompt_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    modelSettings: json('model_settings').$default(() => ({
      model: 'dalle-3',
      style: 'realistic',
    })),
    status: varchar('status', { length: 50 }).default('pending'),
  },
  (prompts) => ({
    userIdIdx: uniqueIndex('idx_prompts_user_id').on(prompts.userId),
  })
)

// Generated Images table
export const GeneratedImagesTable = pgTable(
  'generated_images',
  {
    id: serial('id').primaryKey(),
    promptId: integer('prompt_id').references(() => PromptsTable.id).notNull(),
    userId: integer('user_id').references(() => UsersTable.id).notNull(),
    imageUrl: varchar('image_url', { length: 1024 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    metadata: json('metadata').$default(() => ({
      width: 1024,
      height: 1024,
      generation_time: '0s'
    })),
  },
  (images) => ({
    promptIdIdx: uniqueIndex('idx_generated_images_prompt_id').on(images.promptId),
    userIdIdx: uniqueIndex('idx_generated_images_user_id').on(images.userId),
  })
)

// Types for regular operations
export type User = InferSelectModel<typeof UsersTable>
export type NewUser = InferInsertModel<typeof UsersTable>
export type Prompt = InferSelectModel<typeof PromptsTable>
export type NewPrompt = InferInsertModel<typeof PromptsTable>
export type GeneratedImage = InferSelectModel<typeof GeneratedImagesTable>
export type NewGeneratedImage = InferInsertModel<typeof GeneratedImagesTable>

// Additional types for model settings and metadata
export type ModelSettings = {
  model: string
  style: string
  [key: string]: any  // Allow additional properties
}

export type ImageMetadata = {
  width: number
  height: number
  generation_time: string
  [key: string]: any  // Allow additional properties
}

// Enums for status
export const PromptStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export type PromptStatus = typeof PromptStatus[keyof typeof PromptStatus]

// Connect to Vercel Postgres
export const db = drizzle(sql)

// Helper types for relations
export type UserWithPrompts = User & {
  prompts: Prompt[]
}

export type PromptWithImages = Prompt & {
  generatedImages: GeneratedImage[]
}

export type UserWithPromptsAndImages = User & {
  prompts: (Prompt & {
    generatedImages: GeneratedImage[]
  })[]
}