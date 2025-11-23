-- Enable pgvector extension for similarity search
create extension if not exists vector;

-- Movies table with vibe embeddings
create table if not exists movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year integer not null,
  poster_url text,
  overview text,
  vibe_profile jsonb not null,
  vibe_summary text not null,
  embedding vector(1536) not null,
  tmdb_id integer,
  imdb_id text,
  created_at timestamp with time zone default now(),

  unique(tmdb_id)
);

-- User favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Can be anonymous session ID
  movie_id uuid references movies(id) on delete cascade,
  created_at timestamp with time zone default now(),

  unique(user_id, movie_id)
);

-- Create index for vector similarity search
create index if not exists movies_embedding_idx on movies
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create index for title search
create index if not exists movies_title_idx on movies
using gin (to_tsvector('english', title));

-- Function to find similar movies by embedding
create or replace function match_movies(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  title text,
  year integer,
  poster_url text,
  overview text,
  vibe_profile jsonb,
  vibe_summary text,
  embedding vector(1536),
  tmdb_id integer,
  imdb_id text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    m.id,
    m.title,
    m.year,
    m.poster_url,
    m.overview,
    m.vibe_profile,
    m.vibe_summary,
    m.embedding,
    m.tmdb_id,
    m.imdb_id,
    1 - (m.embedding <=> query_embedding) as similarity
  from movies m
  where 1 - (m.embedding <=> query_embedding) > match_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Row Level Security (optional, for multi-user support)
alter table movies enable row level security;
alter table favorites enable row level security;

-- Allow public read access to movies
create policy "Movies are viewable by everyone" on movies
  for select using (true);

-- Allow authenticated users to manage favorites
create policy "Users can manage their own favorites" on favorites
  for all using (true);
