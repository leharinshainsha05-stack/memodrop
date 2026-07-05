-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create the memories table
create table if not exists memories (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  summary text,
  intent varchar(10) not null, -- 'dump' or 'query' (dumps are stored)
  category varchar(50),        -- 'Shopping Link', 'Document', 'Supplier Quote', 'Customer Complaint', 'Task/Reminder', 'Random Thought', 'Contact Info', 'Business Info'
  entities jsonb,              -- Extracted entities like prices, URLs, dates, locations, phone numbers
  tags text[],                 -- Auto-tags for filtering
  embedding vector(768),       -- Vector storage for Gemini text-embedding-004 (768 dimensions)
  language varchar(10) default 'en',
  user_phone varchar(50) default 'anonymous',
  due_date timestamp with time zone,
  reminder_status varchar(20) default 'pending',
  document_folder text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ALTER TABLE command to add language column to existing databases
ALTER TABLE memories ADD COLUMN IF NOT EXISTS language varchar(10) default 'en';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_phone varchar(50) default 'anonymous';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS reminder_status varchar(20) default 'pending';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS document_folder text;

-- Create a vector similarity search function
create or replace function match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  summary text,
  intent varchar,
  category varchar,
  entities jsonb,
  tags text[],
  similarity float,
  created_at timestamp with time zone
)
language sql stable
as $$
  select
    memories.id,
    memories.content,
    memories.summary,
    memories.intent,
    memories.category,
    memories.entities,
    memories.tags,
    1 - (memories.embedding <=> query_embedding) as similarity,
    memories.created_at
  from memories
  where 1 - (memories.embedding <=> query_embedding) > match_threshold
  order by memories.embedding <=> query_embedding
  limit match_count;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==========================================

-- Option A: DISABLE RLS (Easiest for hackathon demos/prototypes)
ALTER TABLE memories DISABLE ROW LEVEL SECURITY;

-- Option B: ENABLE RLS & ALLOW PUBLIC ACCESS (If you want RLS active but accessible)
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public select" ON memories FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON memories FOR INSERT WITH CHECK (true);

