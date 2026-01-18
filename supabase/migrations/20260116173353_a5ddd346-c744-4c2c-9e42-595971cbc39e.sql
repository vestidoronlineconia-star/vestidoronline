-- Add category column to embed_usage table for tracking which clothing category was used
ALTER TABLE embed_usage ADD COLUMN category text DEFAULT NULL;