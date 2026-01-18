-- Add new customization fields to embed_clients
ALTER TABLE embed_clients 
  ADD COLUMN IF NOT EXISTS placeholder_photo text DEFAULT 'Tu foto',
  ADD COLUMN IF NOT EXISTS placeholder_garment text DEFAULT 'Prenda',
  ADD COLUMN IF NOT EXISTS error_message text DEFAULT 'Error al procesar. Intenta de nuevo.',
  ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS entry_animation text DEFAULT 'fade',
  ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'dark';

-- Add check constraints
ALTER TABLE embed_clients 
  ADD CONSTRAINT button_style_check CHECK (button_style IN ('rounded', 'square', 'pill')),
  ADD CONSTRAINT entry_animation_check CHECK (entry_animation IN ('fade', 'slide', 'none')),
  ADD CONSTRAINT theme_mode_check CHECK (theme_mode IN ('dark', 'light', 'auto'));