-- Add unique constraint on cache_key + cache_type to support upsert operations
ALTER TABLE public.ft_cache 
ADD CONSTRAINT ft_cache_key_type_unique 
UNIQUE (cache_key, cache_type);